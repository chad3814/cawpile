import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getCurrentUser } from '@/lib/auth-helpers'
import { fetchUserExportData } from '@/lib/export/fetchUserExportData'
import { buildJsonExport, formatExportDate } from '@/lib/export/exportUtils'
import {
  buildProfileCsv,
  buildBooksCsv,
  buildRatingsCsv,
  buildSessionsCsv,
  buildSharedReviewsCsv,
  buildBookClubsCsv,
  buildReadathonsCsv,
} from '@/lib/export/csvBuilder'
import type { ExportFormat } from '@/types/export'

/**
 * GET /api/user/export
 * Export all user data in JSON or CSV format.
 *
 * Query parameters:
 * - format: 'json' | 'csv' (required)
 *
 * Response:
 * - JSON: Returns JSON file with all user data
 * - CSV: Returns ZIP file containing multiple CSV files
 */
export async function GET(request: NextRequest) {
  let userId: string | undefined

  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    userId = user.id

    // Parse and validate format parameter
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') as ExportFormat | null

    if (!format || (format !== 'json' && format !== 'csv')) {
      return NextResponse.json(
        { error: 'Invalid format parameter. Must be "json" or "csv".' },
        { status: 400 }
      )
    }

    // Fetch all user data
    const userData = await fetchUserExportData(user.id)

    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 })
    }

    const dateStr = formatExportDate(new Date())

    if (format === 'json') {
      // Build JSON export
      const exportData = buildJsonExport(userData)

      const jsonContent = JSON.stringify(exportData, null, 2)
      const filename = `cawpile-export-${dateStr}.json`

      return new NextResponse(jsonContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else {
      // Build CSV/ZIP export
      const zip = new JSZip()

      // Add all CSV files to zip
      zip.file('profile.csv', buildProfileCsv(userData.profile))
      zip.file('books.csv', buildBooksCsv(userData.userBooks))
      zip.file('ratings.csv', buildRatingsCsv(userData.userBooks))
      zip.file('reading-sessions.csv', buildSessionsCsv(userData.userBooks))
      zip.file('shared-reviews.csv', buildSharedReviewsCsv(userData.userBooks))
      zip.file('book-clubs.csv', buildBookClubsCsv(userData.bookClubs))
      zip.file('readathons.csv', buildReadathonsCsv(userData.readathons))

      // Generate zip buffer
      const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })
      const filename = `cawpile-export-${dateStr}.zip`

      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }
  } catch (error) {
    console.error('Export failed for user:', userId, error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
