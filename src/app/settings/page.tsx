import { getCurrentUser } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import SettingsClient from "@/components/settings/SettingsClient"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user?.id) {
    redirect("/auth/signin")
  }

  // Fetch user's full settings data
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      username: true,
      bio: true,
      profilePictureUrl: true,
      readingGoal: true,
      showCurrentlyReading: true,
      image: true, // Google OAuth image as fallback
      email: true,
    },
  })

  if (!userData) {
    redirect("/auth/signin")
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your profile, preferences, and account settings.
        </p>
      </div>

      <SettingsClient initialData={userData} />
    </div>
  )
}
