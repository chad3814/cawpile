# Raw Feature Idea

## Original Description

The search results from /api/books/search are coordinated through multiple sources and each source's book that is determined to be the same as another source, are merged in `mergeResults()`. Update the search results returned so that the individual source results are retained. Also, sign each search result entry (that includes multiple sources).

## Context

- Feature affects the multi-provider search system
- Current behavior: Results from different providers are merged via `mergeResults()`
- Desired behavior:
  1. Retain individual source results (don't lose provider-specific data during merge)
  2. Sign each search result entry to indicate which sources contributed to it

## Related Components

- `/api/books/search` endpoint
- `SearchOrchestrator.ts`
- `resultMerger.ts` (contains `mergeResults()` function)
- Search provider implementations

## Date Created

2026-01-17
