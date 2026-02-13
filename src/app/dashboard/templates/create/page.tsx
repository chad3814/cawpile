import { requireAdmin } from "@/lib/auth/admin"
import TemplateEditorClient from "@/components/templates/TemplateEditorClient"

export default async function TemplateCreatePage() {
  // Gate access: non-admins are redirected to /
  await requireAdmin()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Create New Template</h1>
      <TemplateEditorClient mode="create" />
    </div>
  )
}
