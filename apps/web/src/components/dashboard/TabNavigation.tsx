'use client';

interface TabNavigationProps {
  activeTab: 'books' | 'charts';
  onTabChange: (tab: 'books' | 'charts') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => onTabChange('books')}
          className={`
            py-2 px-1 border-b-2 font-medium text-sm transition-colors
            ${activeTab === 'books'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          Books
        </button>
        <button
          onClick={() => onTabChange('charts')}
          className={`
            py-2 px-1 border-b-2 font-medium text-sm transition-colors
            ${activeTab === 'charts'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          Charts
        </button>
      </nav>
    </div>
  );
}