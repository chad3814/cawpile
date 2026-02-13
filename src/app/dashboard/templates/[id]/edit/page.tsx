import { requireAdmin } from "@/lib/auth/admin"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import TemplateEditorClient from "@/components/templates/TemplateEditorClient"
import type { VideoTemplate } from "@/types/video-template"

interface TemplateEditPageProps {
  params: Promise<{ id: string }>
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  // Gate access: non-admins are redirected to /
  await requireAdmin()

  const { id } = await params

  // Fetch the existing template via direct Prisma query
  const template = await prisma.videoTemplate.findUnique({
    where: { id },
  })

  if (!template) {
    redirect("/dashboard/templates")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Edit Template</h1>
      <TemplateEditorClient
        mode="edit"
        templateId={template.id}
        initialConfig={template.config as VideoTemplate}
        initialName={template.name}
        initialDescription={template.description ?? ""}
        initialIsPublished={template.isPublished}
      />
    </div>
  )
}
