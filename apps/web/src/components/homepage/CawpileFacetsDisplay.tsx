"use client";

import { useState } from "react";
import {
  FICTION_FACETS,
  NONFICTION_FACETS,
  RATING_SCALE_GUIDE,
  BookType,
} from "@/types/cawpile";

export default function CawpileFacetsDisplay() {
  const [activeType, setActiveType] = useState<BookType>(BookType.FICTION);

  const facets =
    activeType === BookType.FICTION ? FICTION_FACETS : NONFICTION_FACETS;

  return (
    <div className="w-full">
      {/* Toggle Buttons */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setActiveType(BookType.FICTION)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeType === BookType.FICTION
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Fiction
          </button>
          <button
            onClick={() => setActiveType(BookType.NONFICTION)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeType === BookType.NONFICTION
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Non-Fiction
          </button>
        </div>
      </div>

      {/* CAWPILE Acronym */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
          {activeType === BookType.FICTION ? "C.A.W.P.I.L.E." : "C.A.W.P.I.L.E. for Non-Fiction"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {facets.map((facet, index) => (
            <div
              key={facet.key}
              className="p-4 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-primary">
                  {facet.name.charAt(0)}
                </span>
                <span className="font-medium text-foreground">{facet.name}</span>
                {index === 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({activeType === BookType.FICTION ? "Characters" : "Credibility"})
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{facet.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Scale Guide */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
          Rating Scale Guide
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {RATING_SCALE_GUIDE.map((item) => (
            <div
              key={item.value}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
            >
              <span
                className={`text-lg font-bold w-8 text-center ${
                  item.value >= 8
                    ? "text-green-600 dark:text-green-400"
                    : item.value >= 6
                    ? "text-yellow-600 dark:text-yellow-400"
                    : item.value >= 4
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {item.value}
              </span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
