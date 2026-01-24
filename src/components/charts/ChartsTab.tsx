'use client';

import { useState } from 'react';
import { FilmIcon } from '@heroicons/react/24/outline';
import { YearSelector } from './YearSelector';
import { ChartGrid } from './ChartGrid';
import { ChartCard } from './ChartCard';
import { BooksPerMonthChart } from './BooksPerMonthChart';
import { BookFormatChart } from './BookFormatChart';
import { PagesPerMonthChart } from './PagesPerMonthChart';
import { DnfPerMonthChart } from './DnfPerMonthChart';
import { MainGenresChart } from './MainGenresChart';
import { AcquisitionMethodChart } from './AcquisitionMethodChart';
import { LgbtqRepresentationChart } from './LgbtqRepresentationChart';
import { DisabilityRepresentationChart } from './DisabilityRepresentationChart';
import { PocAuthorsChart } from './PocAuthorsChart';
import { NewAuthorsChart } from './NewAuthorsChart';
import MonthlyRecapModal from '@/components/modals/MonthlyRecapModal';

interface ChartsTabProps {
  isAdmin?: boolean;
}

export function ChartsTab({ isAdmin }: ChartsTabProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Year Selector and Recap Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reading Analytics</h2>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsRecapModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <FilmIcon className="h-4 w-4" />
              Monthly Recap
            </button>
          )}
          <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
        </div>
      </div>

      {/* Monthly Recap Modal */}
      <MonthlyRecapModal
        isOpen={isRecapModalOpen}
        onClose={() => setIsRecapModalOpen(false)}
        initialYear={selectedYear}
      />

      {/* Charts Grid */}
      <ChartGrid>
        <ChartCard id="books-per-month" title="Books per Month">
          <BooksPerMonthChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="book-format" title="Book Format">
          <BookFormatChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="pages-per-month" title="Pages per Month">
          <PagesPerMonthChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="dnf-per-month" title="DNF per Month">
          <DnfPerMonthChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="acquisition-method" title="Acquisition Method">
          <AcquisitionMethodChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="main-genres" title="Main Genres">
          <MainGenresChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="lgbtq-representation" title="LGBTQ+ Representation">
          <LgbtqRepresentationChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="disability-representation" title="Disability Representation">
          <DisabilityRepresentationChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="poc-authors" title="POC Authors">
          <PocAuthorsChart year={selectedYear} />
        </ChartCard>

        <ChartCard id="new-authors" title="New Authors">
          <NewAuthorsChart year={selectedYear} />
        </ChartCard>
      </ChartGrid>
    </div>
  );
}