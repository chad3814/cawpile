import { getCurrentUser } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import TemplateBrowseClient from "@/components/templates/TemplateBrowseClient"

export default async function TemplateBrowsePage() {
  const user = await getCurrentUser()

  if (!user?.id) {
    redirect("/auth/signin")
  }

  // Fetch user's selectedTemplateId from the database
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedTemplateId: true },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TemplateBrowseClient
        selectedTemplateId={userData?.selectedTemplateId ?? null}
        userId={user.id}
      />
    </div>
  )
}
