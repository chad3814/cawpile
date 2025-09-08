'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface QualityIssue {
  type: string
  label: string
  count: number
  severity: 'error' | 'warning' | 'info'
  link: string
}

interface DataQualityMetrics {
  totalBooks: number
  qualityScore: number
  issues: QualityIssue[]
}

export default function DataQualityWidget() {
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/data-quality')
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
        } else {
          setError('Failed to fetch data quality metrics')
        }
      } catch (err) {
        setError('Error loading data quality metrics')
        console.error('Error fetching data quality metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Quality</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Quality</h3>
        <p className="text-sm text-red-600">{error || 'No data available'}</p>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  const activeIssues = metrics.issues.filter(issue => issue.count > 0)

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Data Quality</h3>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(metrics.qualityScore)}`}>
            {metrics.qualityScore}%
          </div>
          <div className="text-xs text-gray-500">Quality Score</div>
        </div>
      </div>

      {activeIssues.length === 0 ? (
        <p className="text-sm text-green-600">✅ No data quality issues detected</p>
      ) : (
        <div className="space-y-2">
          {activeIssues.map((issue) => (
            <Link
              key={issue.type}
              href={issue.link}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {getSeverityIcon(issue.severity)}
                <span className="text-sm text-gray-700">{issue.label}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{issue.count}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Total books: {metrics.totalBooks} • Updates every 5 minutes
        </div>
      </div>
    </div>
  )
}