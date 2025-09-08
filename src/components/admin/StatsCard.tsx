import { 
  BookOpenIcon, 
  UsersIcon, 
  DocumentDuplicateIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline'

interface StatsCardProps {
  title: string
  value: number
  subtitle?: string
  icon: 'book' | 'users' | 'editions' | 'fiction'
}

export default function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  const icons = {
    book: BookOpenIcon,
    users: UsersIcon,
    editions: DocumentDuplicateIcon,
    fiction: SparklesIcon,
  }

  const Icon = icons[icon]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-orange-100 rounded-lg">
          <Icon className="h-6 w-6 text-orange-600" />
        </div>
      </div>
    </div>
  )
}