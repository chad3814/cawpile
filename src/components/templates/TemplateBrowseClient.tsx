"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'
import TemplateCard from '@/components/templates/TemplateCard'
import type { TemplateCardData } from '@/components/templates/TemplateCard'
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'

type SortOption = 'newest' | 'name' | 'popular'

interface TemplateBrowseClientProps {
  selectedTemplateId: string | null
  isAdmin?: boolean
}

const ITEMS_PER_PAGE = 12

export default function TemplateBrowseClient({ selectedTemplateId: initialSelectedId, isAdmin }: TemplateBrowseClientProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [page, setPage] = useState(1)
  const [templates, setTemplates] = useState<TemplateCardData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialSelectedId)
  const [myTemplates, setMyTemplates] = useState<TemplateCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [myTemplatesLoading, setMyTemplatesLoading] = useState(true)

  const debouncedSearch = useDebounce(search, 300)

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch templates - admin gets all (published + draft), users get published only
  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String((page - 1) * ITEMS_PER_PAGE),
        sort,
      })
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim())
      }

      // Admin fetches from admin API (includes drafts); users fetch from user API
      const endpoint = isAdmin
        ? `/api/templates?${params.toString()}`
        : `/api/user/templates?${params.toString()}`

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
        setTotalCount(data.totalCount ?? data.templates.length)
        if (data.selectedTemplateId !== undefined) {
          setSelectedTemplateId(data.selectedTemplateId)
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }, [page, sort, debouncedSearch, isAdmin])

  // Fetch user's personal (duplicated) templates
  const fetchMyTemplates = useCallback(async () => {
    setMyTemplatesLoading(true)
    try {
      const response = await fetch(`/api/user/templates/mine`)
      if (response.ok) {
        const data = await response.json()
        setMyTemplates(data.templates)
      }
    } catch {
      // Endpoint may not exist yet, silently fail
      setMyTemplates([])
    } finally {
      setMyTemplatesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    // Skip "my templates" fetch for admin since they see all templates already
    if (!isAdmin) {
      fetchMyTemplates()
    } else {
      setMyTemplatesLoading(false)
    }
  }, [fetchMyTemplates, isAdmin])

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }
    try {
      const response = await fetch(`/api/templates/${templateId}`, { method: 'DELETE' })
      if (response.ok) {
        // Refresh templates list
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Template Gallery</h1>
          <p className="text-muted-foreground mt-2">
            Browse and select a template for your monthly recap video
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/templates/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create New Template
          </Link>
        )}
      </div>

      {/* My Templates Section */}
      {!isAdmin && !myTemplatesLoading && myTemplates.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">My Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="my-templates-grid">
            {myTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search input */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            data-testid="template-search"
          />
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortOption)
            setPage(1)
          }}
          className="px-4 py-2 rounded-lg border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          data-testid="template-sort"
        >
          <option value="newest">Newest</option>
          <option value="name">Name (A-Z)</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="flex gap-1.5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="w-5 h-5 rounded-full bg-muted" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16" data-testid="empty-state">
          <p className="text-muted-foreground text-lg">
            {debouncedSearch
              ? 'No templates match your search.'
              : 'No templates available yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="template-grid">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                isAdmin={isAdmin}
                isPublished={template.isPublished}
                onDelete={() => handleDeleteTemplate(template.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} templates
              </p>
              <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === page
                          ? 'z-10 bg-primary/10 border-primary text-primary'
                          : 'bg-card border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}
