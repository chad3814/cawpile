'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowDownTrayIcon,
  FilmIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import type { MonthlyRecapExport, MonthlyRecapPreview } from '@/lib/recap/types';
import { MONTH_NAMES } from '@/lib/recap/types';

type RenderStatus = 'idle' | 'loading' | 'rendering' | 'success' | 'error';

const RENDER_SERVER_URL = process.env.NEXT_PUBLIC_RENDER_SERVER_URL || 'http://localhost:3001';

function buildProxyVideoUrl(s3Url: string, filename: string): string {
  const params = new URLSearchParams({
    url: s3Url,
    filename: filename,
  });
  return `/api/proxy/video?${params.toString()}`;
}

export function RecapTab() {
  const { data: session } = useSession();
  const currentDate = new Date();
  const isEarlyInMonth = currentDate.getDate() <= 10;
  const defaultDate = isEarlyInMonth
    ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    : currentDate;
  const [selectedMonth, setSelectedMonth] = useState(defaultDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(
    isEarlyInMonth ? defaultDate.getFullYear() : currentDate.getFullYear()
  );
  const [preview, setPreview] = useState<MonthlyRecapPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle');
  const [renderProgress, setRenderProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<MonthlyRecapExport | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i);

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/recap/monthly?month=${selectedMonth}&year=${selectedYear}&preview=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch preview');
      }

      const data: MonthlyRecapPreview = await response.json();
      setPreview(data);
    } catch (err) {
      console.error('Error fetching preview:', err);
      setError('Failed to load preview');
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    setExportData(null);
    setRenderStatus('idle');
    setRenderProgress(0);
    setError(null);
    fetchPreview();
  }, [fetchPreview]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleExportJson = async () => {
    setRenderStatus('loading');
    setError(null);

    try {
      const response = await fetch(
        `/api/recap/monthly?month=${selectedMonth}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recap data');
      }

      const data: MonthlyRecapExport = await response.json();
      setExportData(data);

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reading-recap-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setRenderStatus('success');
    } catch (err) {
      console.error('Error exporting recap:', err);
      setError(err instanceof Error ? err.message : 'Failed to export recap data');
      setRenderStatus('error');
    }
  };

  const handleGenerateVideo = async () => {
    setRenderStatus('rendering');
    setRenderProgress(0);
    setError(null);

    try {
      let data = exportData;
      if (!data) {
        const response = await fetch(
          `/api/recap/monthly?month=${selectedMonth}&year=${selectedYear}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch recap data');
        }

        data = await response.json();
        setExportData(data);
      }

      const userId = session?.user?.id || '';
      const initResponse = await fetch(`${RENDER_SERVER_URL}/render-stream/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
      });

      if (!initResponse.ok) {
        const errBody = await initResponse.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error || 'Failed to initialize render job');
      }

      const { jobId } = await initResponse.json() as { jobId: string };
      const sseUrl = `${RENDER_SERVER_URL}/render-stream?jobId=${jobId}`;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('progress', (event: MessageEvent) => {
        const eventData = JSON.parse(event.data) as { progress: number };
        setRenderProgress(eventData.progress);
      });

      eventSource.addEventListener('complete', (event: MessageEvent) => {
        const eventData = JSON.parse(event.data) as { filename: string; s3Url: string };

        const proxyUrl = buildProxyVideoUrl(eventData.s3Url, eventData.filename);
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = eventData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        eventSource.close();
        eventSourceRef.current = null;
        setRenderStatus('success');
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        if (event.data) {
          const eventData = JSON.parse(event.data) as { message: string };
          setError(eventData.message);
        } else {
          setError('An error occurred during rendering');
        }
        setRenderStatus('error');
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.onerror = () => {
        if (eventSourceRef.current) {
          setError('Connection to render server lost');
          setRenderStatus('error');
          eventSource.close();
          eventSourceRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error generating video:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate video'
      );
      setRenderStatus('error');
    }
  };

  const hasBooks = preview && preview.bookCount > 0;
  const isBusy = renderStatus === 'rendering' || renderStatus === 'loading';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Reading Recap</h2>

      <div className="max-w-md space-y-6">
        {/* Month/Year Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="recap-month"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Month
            </label>
            <select
              id="recap-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="recap-year"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Year
            </label>
            <select
              id="recap-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {previewLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
            </div>
          ) : preview ? (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {preview.monthName} {preview.year}
              </h4>
              {preview.bookCount > 0 ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {preview.bookCount}
                    </span>{' '}
                    {preview.bookCount === 1 ? 'book' : 'books'} finished
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {preview.completedCount > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        {preview.completedCount} completed
                      </span>
                    )}
                    {preview.dnfCount > 0 && (
                      <span className="flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                        {preview.dnfCount} DNF
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No books finished this month
                </p>
              )}
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>

        {/* Status Messages */}
        {renderStatus === 'rendering' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Generating video...
                </p>
                <span className="text-xs text-blue-600 dark:text-blue-300">
                  {renderProgress}%
                </span>
              </div>
              <div
                data-testid="render-progress-bar"
                className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2"
              >
                <div
                  data-testid="render-progress-fill"
                  className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {renderStatus === 'success' && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              Export completed successfully!
            </p>
          </div>
        )}

        {error && renderStatus !== 'idle' && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={!hasBooks || isBusy}
            className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FilmIcon className="h-5 w-5 mr-2" />
            Generate TikTok Video
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={!hasBooks || isBusy}
            className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export JSON Data
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Generate a TikTok-style video showcasing your monthly reading progress,
          or export raw data for custom video creation.
        </p>
      </div>
    </div>
  );
}
