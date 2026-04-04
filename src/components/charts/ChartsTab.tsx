'use client';

import { useState } from 'react';
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

export function ChartsTab() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reading Analytics</h2>
        <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </div>

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