'use client';

export type DashboardSection = 'books' | 'authors' | 'library' | 'recaps' | 'charts';

interface SubItem {
  anchor: string;
  label: string;
}

interface NavItem {
  id: DashboardSection;
  label: string;
  subItems?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'books', label: 'Books' },
  { id: 'authors', label: 'Authors' },
  {
    id: 'library',
    label: 'Your Library',
    subItems: [
      { anchor: 'currently-reading', label: 'Currently Reading' },
      { anchor: 'tbr', label: 'TBR' },
      { anchor: 'completed', label: 'Completed' },
    ],
  },
  { id: 'recaps', label: 'Recaps' },
  { id: 'charts', label: 'Charts' },
];

interface SidebarNavigationProps {
  activeSection: DashboardSection;
  activeAnchor: string | null;
  onSectionChange: (section: DashboardSection, anchor?: string) => void;
}

export default function SidebarNavigation({ activeSection, activeAnchor, onSectionChange }: SidebarNavigationProps) {
  return (
    <nav className="w-52 shrink-0" aria-label="Dashboard sections">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSectionChange(item.id)}
              aria-current={activeSection === item.id ? 'page' : undefined}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {item.label}
            </button>
            {item.subItems && activeSection === item.id && (
              <ul className="mt-1 ml-3 space-y-0.5">
                {item.subItems.map((sub) => (
                  <li key={sub.anchor}>
                    <button
                      type="button"
                      onClick={() => onSectionChange(item.id, sub.anchor)}
                      aria-current={activeAnchor === sub.anchor ? 'true' : undefined}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        activeAnchor === sub.anchor
                          ? 'bg-primary/5 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {sub.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
