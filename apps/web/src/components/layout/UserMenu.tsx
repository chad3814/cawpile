"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import UsernameRequiredModal from "@/components/modals/UsernameRequiredModal"

interface UserData {
  profilePictureUrl: string | null
  username: string | null
}

export default function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    // Check if user is admin
    if (session?.user) {
      fetch('/api/admin/check-access')
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin))
        .catch(() => setIsAdmin(false))
    }
  }, [session])

  useEffect(() => {
    // Fetch user profile data for custom avatar and username
    if (session?.user) {
      fetch('/api/user/settings')
        .then(res => res.json())
        .then(data => setUserData({
          profilePictureUrl: data.profilePictureUrl,
          username: data.username
        }))
        .catch(() => setUserData(null))
    }
  }, [session])

  if (!session?.user) return null

  // Prioritize custom profile picture, then Google OAuth image
  const avatarUrl = userData?.profilePictureUrl || session.user.image

  const handleNameClick = () => {
    if (userData?.username) {
      // User has username - navigate to profile
      setIsOpen(false)
      router.push(`/u/${userData.username}`)
    } else {
      // No username - open modal
      setShowUsernameModal(true)
    }
  }

  const handleUsernameSuccess = (username: string) => {
    // Update local state with new username
    setUserData(prev => prev ? { ...prev, username } : { profilePictureUrl: null, username })
    setShowUsernameModal(false)
    setIsOpen(false)
    router.push(`/u/${username}`)
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={session.user.name || "User"}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <button
                onClick={handleNameClick}
                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-orange-600 transition-colors text-left w-full"
              >
                {session.user.name}
              </button>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Settings
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Admin Panel
              </Link>
            )}

            <hr className="my-1" />

            <button
              onClick={() => signOut()}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <UsernameRequiredModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSuccess={handleUsernameSuccess}
      />
    </>
  )
}
