'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  isOpen: boolean;
  onClose: () => void;
}

function NavItems({
  activeSection,
  activeAnchor,
  onSectionChange,
}: Pick<SidebarNavigationProps, 'activeSection' | 'activeAnchor' | 'onSectionChange'>) {
  return (
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
  );
}

export default function SidebarNavigation({ activeSection, activeAnchor, onSectionChange, isOpen, onClose }: SidebarNavigationProps) {
  return (
    <>
      {/* Desktop sidebar — always visible at md+ */}
      <nav className="hidden md:block w-52 shrink-0" aria-label="Dashboard sections">
        <NavItems
          activeSection={activeSection}
          activeAnchor={activeAnchor}
          onSectionChange={onSectionChange}
        />
      </nav>

      {/* Mobile sidebar — slide-out drawer */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={onClose}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* Drawer panel */}
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-200 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-150 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-64 max-w-[75vw] flex-col bg-background pt-16 pb-4 shadow-xl">
                {/* Close button */}
                <div className="absolute top-4 right-3">
                  <button
                    type="button"
                    className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto px-4" aria-label="Dashboard sections">
                  <NavItems
                    activeSection={activeSection}
                    activeAnchor={activeAnchor}
                    onSectionChange={onSectionChange}
                  />
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
