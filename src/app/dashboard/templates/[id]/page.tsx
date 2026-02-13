import { getCurrentUser } from "@/lib/auth-helpers"
import { redirect, notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import TemplateDetailClient from "@/components/templates/TemplateDetailClient"

interface TemplateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const user = await getCurrentUser()

  if (!user?.id) {
    redirect("/auth/signin")
  }

  const { id } = await params

  // Fetch the template (published only) with creator info
  const template = await prisma.videoTemplate.findFirst({
    where: {
      id,
      isPublished: true,
    },
    include: {
      creator: {
        select: { name: true, image: true },
      },
    },
  })

  if (!template) {
    notFound()
  }

  // Fetch user's selectedTemplateId
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedTemplateId: true },
  })

  // Serialize the template data for the client component
  const templateData = {
    id: template.id,
    name: template.name,
    description: template.description,
    previewThumbnailUrl: template.previewThumbnailUrl,
    config: template.config as Record<string, unknown>,
    creator: template.creator,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TemplateDetailClient
        template={templateData}
        selectedTemplateId={userData?.selectedTemplateId ?? null}
      />
    </div>
  )
}
