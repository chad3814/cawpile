import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/audit/logger'
import { deleteAvatar, extractKeyFromUrl } from '@/lib/s3-upload'

const VALID_PROVIDERS = ['google', 'hardcover', 'ibdb', 'custom'] as const
type Provider = (typeof VALID_PROVIDERS)[number]

function isValidProvider(value: string): value is Provider {
  return VALID_PROVIDERS.includes(value as Provider)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, provider } = body

    const edition = await prisma.edition.findUnique({
      where: { id },
      include: {
        googleBook: true,
        hardcoverBook: true,
        ibdbBook: true,
      },
    })

    if (!edition) {
      return NextResponse.json(
        { error: 'Edition not found' },
        { status: 404 }
      )
    }

    if (action === 'set_default') {
      // provider can be null to clear the default
      if (provider !== null && !isValidProvider(provider)) {
        return NextResponse.json(
          { error: 'Invalid provider' },
          { status: 400 }
        )
      }

      // Validate the provider has a non-null imageUrl if setting (not clearing)
      if (provider !== null) {
        let hasImage = false
        switch (provider) {
          case 'custom':
            hasImage = !!edition.customCoverUrl
            break
          case 'google':
            hasImage = !!edition.googleBook?.imageUrl
            break
          case 'hardcover':
            hasImage = !!edition.hardcoverBook?.imageUrl
            break
          case 'ibdb':
            hasImage = !!edition.ibdbBook?.imageUrl
            break
        }

        if (!hasImage) {
          return NextResponse.json(
            { error: 'Provider does not have a cover image' },
            { status: 400 }
          )
        }
      }

      const oldValue = edition.defaultCoverProvider

      await prisma.edition.update({
        where: { id },
        data: { defaultCoverProvider: provider },
      })

      await logAdminAction(user.id, {
        entityType: 'Edition',
        entityId: id,
        fieldName: 'defaultCoverProvider',
        actionType: 'UPDATE',
        oldValue: oldValue,
        newValue: provider,
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'delete_cover') {
      if (!provider || !isValidProvider(provider)) {
        return NextResponse.json(
          { error: 'Invalid provider' },
          { status: 400 }
        )
      }

      // Set the provider's imageUrl to null
      switch (provider) {
        case 'custom':
          if (!edition.customCoverUrl) {
            return NextResponse.json(
              { error: 'No custom cover for this edition' },
              { status: 404 }
            )
          }
          // Delete the S3 object
          const s3Key = extractKeyFromUrl(edition.customCoverUrl)
          if (s3Key) {
            deleteAvatar(s3Key).catch((err) => {
              console.error('Failed to delete custom cover from S3:', err)
            })
          }
          await prisma.edition.update({
            where: { id },
            data: { customCoverUrl: null },
          })
          break
        case 'google':
          if (!edition.googleBook) {
            return NextResponse.json(
              { error: 'No Google Books data for this edition' },
              { status: 404 }
            )
          }
          await prisma.googleBook.update({
            where: { editionId: id },
            data: { imageUrl: null },
          })
          break
        case 'hardcover':
          if (!edition.hardcoverBook) {
            return NextResponse.json(
              { error: 'No Hardcover data for this edition' },
              { status: 404 }
            )
          }
          await prisma.hardcoverBook.update({
            where: { editionId: id },
            data: { imageUrl: null },
          })
          break
        case 'ibdb':
          if (!edition.ibdbBook) {
            return NextResponse.json(
              { error: 'No IBDB data for this edition' },
              { status: 404 }
            )
          }
          await prisma.ibdbBook.update({
            where: { editionId: id },
            data: { imageUrl: null },
          })
          break
      }

      // Clear defaultCoverProvider if it pointed to the deleted provider
      if (edition.defaultCoverProvider === provider) {
        await prisma.edition.update({
          where: { id },
          data: { defaultCoverProvider: null },
        })
      }

      await logAdminAction(user.id, {
        entityType: 'Edition',
        entityId: id,
        fieldName: `${provider}Book.imageUrl`,
        actionType: 'UPDATE',
        oldValue: 'deleted',
        newValue: null,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating edition covers:', error)
    return NextResponse.json(
      { error: 'Failed to update edition covers' },
      { status: 500 }
    )
  }
}
