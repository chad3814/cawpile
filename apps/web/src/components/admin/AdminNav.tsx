'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  BookOpenIcon, 
  UsersIcon, 
  DocumentTextIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function AdminNav() {
  const pathname = usePathname()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    // Check if user is super admin
    fetch('/api/admin/check-access')
      .then(res => res.json())
      .then(data => setIsSuperAdmin(data.isSuperAdmin))
      .catch(() => setIsSuperAdmin(false))
  }, [])

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: HomeIcon,
    },
    {
      name: 'Books',
      href: '/admin/books',
      icon: BookOpenIcon,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: UsersIcon,
      superAdminOnly: true,
    },
    {
      name: 'Audit Log',
      href: '/admin/audit-log',
      icon: DocumentTextIcon,
    },
  ]

  const filteredItems = navItems.filter(item => 
    !item.superAdminOnly || isSuperAdmin
  )

  return (
    <nav className="w-64 bg-white shadow-lg h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Panel</h2>
        
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-8 pt-8 border-t">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to App</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}