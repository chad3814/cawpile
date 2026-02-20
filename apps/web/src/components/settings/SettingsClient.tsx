'use client'

import { useState } from 'react'
import ProfileSection from './ProfileSection'
import PreferencesSection from './PreferencesSection'
import AccountSection from './AccountSection'

interface SettingsData {
  name: string | null
  username: string | null
  bio: string | null
  profilePictureUrl: string | null
  readingGoal: number
  showCurrentlyReading: boolean
  profileEnabled: boolean
  showTbr: boolean
  image: string | null
  email: string
}

interface SettingsClientProps {
  initialData: SettingsData
}

type TabKey = 'profile' | 'preferences' | 'account'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'account', label: 'Account' },
]

export default function SettingsClient({ initialData }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [data, setData] = useState<SettingsData>(initialData)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDataUpdate = (updates: Partial<SettingsData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-opacity ${
            toast.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && (
          <ProfileSection
            data={data}
            onUpdate={handleDataUpdate}
            onSuccess={(msg) => showToast('success', msg)}
            onError={(msg) => showToast('error', msg)}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesSection
            data={data}
            onUpdate={handleDataUpdate}
            onSuccess={(msg) => showToast('success', msg)}
            onError={(msg) => showToast('error', msg)}
          />
        )}

        {activeTab === 'account' && (
          <AccountSection
            email={data.email}
            onError={(msg) => showToast('error', msg)}
          />
        )}
      </div>
    </div>
  )
}
