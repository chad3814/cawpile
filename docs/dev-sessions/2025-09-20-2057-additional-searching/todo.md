# Dev Session TODO: Additional Search Providers

## Phase 1: Provider Architecture Foundation
- [ ] Create `src/lib/search/types.ts` with SearchProvider interface
- [ ] Create `src/lib/search/BaseSearchProvider.ts` abstract class
- [ ] Define SearchProviderResult type with source metadata

## Phase 2: Core Providers
- [ ] Implement `LocalDatabaseProvider.ts` for Books/Editions search
- [ ] Create `GoogleBooksProvider.ts` wrapping existing implementation
- [ ] Test both providers work independently

## Phase 3: Result Processing
- [ ] Create `fuzzyMatch.ts` utility for author matching
- [ ] Create `resultMerger.ts` for deduplication and merging
- [ ] Test deduplication with ISBN and fuzzy matching

## Phase 4: Orchestration Layer
- [ ] Create `SearchOrchestrator.ts` with parallel execution
- [ ] Implement 5-second timeout per provider
- [ ] Test orchestrator with local and Google providers

## Phase 5: External Providers
- [ ] Create `ibdbClient.ts` HTTP client
- [ ] Implement `IBDBProvider.ts` with weight 4
- [ ] Create `hardcoverClient.ts` GraphQL client
- [ ] Implement `HardcoverProvider.ts` with weight 6
- [ ] Test all external providers

## Phase 6: Integration
- [ ] Update `/api/books/search/route.ts` to use orchestrator
- [ ] Register all four providers in correct weight order
- [ ] Verify backwards compatibility
- [ ] Test complete search flow with all providers

## Phase 7: Validation
- [ ] Test deduplication across all sources
- [ ] Verify timeout behavior
- [ ] Confirm partial failure handling
- [ ] Validate response format unchanged

## Notes
- Local DB weight: 10 (highest)
- Hardcover weight: 6
- Google Books weight: 5
- IBDB weight: 4
- All searches run in parallel with 5s timeout each
- Silent failure - no user notification if a source fails