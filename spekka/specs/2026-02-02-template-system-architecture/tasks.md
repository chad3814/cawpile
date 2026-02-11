# Task Breakdown: Template System Architecture

## Overview
Total Tasks: 29

This feature implements a template abstraction layer that allows video styles and structural layouts to be defined via inline JSON at render time. The implementation progresses from core type definitions through validation, React context, component migration, and finally API integration.

## Task List

### Core Type Definitions

#### Task Group 1: Template Type System
**Dependencies:** None

- [x] 1.0 Complete template type definitions
  - [x] 1.1 Write 4-6 focused tests for template types and merging
    - Test `getEffectiveTemplate()` merges partial templates over defaults
    - Test missing sections in template resolve to defaults
    - Test deeply nested partial overrides (e.g., only `global.colors.accent`)
    - Test complete template passes through unchanged
  - [x] 1.2 Create `src/lib/template-types.ts` with VideoTemplate interface
    - Define `GlobalTemplateConfig` with optional `colors`, `fonts`, `timing` sections
    - Define sequence config interfaces: `IntroConfig`, `BookRevealConfig`, `StatsRevealConfig`, `ComingSoonConfig`, `OutroConfig`
    - Each sequence config has optional `layout` property with union of supported layout strings
    - Include styling properties matching current theme structure
    - All properties optional for partial template support
  - [x] 1.3 Create default template constant from current theme
    - Export `DEFAULT_TEMPLATE` constant in `src/lib/template-types.ts`
    - Values directly mirror `COLORS`, `FONTS`, `TIMING` from `theme.ts`
    - Include default `layout` values for each sequence (current behavior)
  - [x] 1.4 Implement `getEffectiveTemplate()` merge function
    - Deep merge provided template over `DEFAULT_TEMPLATE`
    - Handle undefined sections gracefully
    - Return complete template with all values populated
  - [x] 1.5 Ensure template type tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify merge logic handles edge cases

**Acceptance Criteria:**
- The 4-6 tests written in 1.1 pass
- `VideoTemplate` interface covers all customizable aspects
- `getEffectiveTemplate()` correctly merges partial templates
- Default template matches current hardcoded theme behavior

---

### Validation Layer

#### Task Group 2: Permissive Template Validation
**Dependencies:** Task Group 1

- [x] 2.0 Complete template validation layer
  - [x] 2.1 Write 4-6 focused tests for template validation
    - Test valid template passes validation
    - Test unknown top-level properties are stripped
    - Test deeply nested unknown properties are stripped
    - Test invalid types within known properties produce errors
    - Test empty/null template returns valid result with empty object
  - [x] 2.2 Create `server/lib/template-validation.ts`
    - Follow `ValidationResult` pattern from `server/lib/validation.ts`
    - Define `TemplateValidationResult` type for success/failure
    - Create `validateTemplate()` function that sanitizes input
  - [x] 2.3 Implement property stripping logic
    - Recursively traverse template object
    - Compare against known schema properties
    - Strip any properties not in `VideoTemplate` interface
  - [x] 2.4 Add development mode warnings for stripped properties
    - Log warnings when `NODE_ENV === 'development'`
    - Include path to unknown property in warning message
    - No warnings in production mode
  - [x] 2.5 Ensure validation tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify permissive behavior with various malformed inputs

**Acceptance Criteria:**
- The 4-6 tests written in 2.1 pass
- Unknown properties stripped without rejection
- Development mode logs helpful warnings
- Valid templates pass through correctly

---

### React Context System

#### Task Group 3: TemplateContext and useTemplate Hook
**Dependencies:** Task Group 1

- [x] 3.0 Complete React context for template distribution
  - [x] 3.1 Write 4-6 focused tests for TemplateContext
    - Test `useTemplate()` returns merged template values
    - Test context with partial template provides defaults for missing values
    - Test `useColors()`, `useFonts()`, `useTiming()` convenience hooks
    - Test error when `useTemplate()` called outside provider
  - [x] 3.2 Create `src/lib/TemplateContext.tsx`
    - Define `TemplateContextValue` interface
    - Create React context with undefined default
    - Export `TemplateProvider` component accepting `template` prop
  - [x] 3.3 Implement `useTemplate()` hook
    - Throws descriptive error if used outside `TemplateProvider`
    - Returns full resolved template object
  - [x] 3.4 Add convenience hooks for common access patterns
    - `useColors()` returns `template.global.colors`
    - `useFonts()` returns `template.global.fonts`
    - `useTiming()` returns `template.global.timing`
    - `useSequenceConfig(sequenceName)` returns specific sequence config
  - [x] 3.5 Update `getRatingColor()` and `convertToStars()` to use context
    - Create `useRatingColor()` hook that uses template colors
    - Maintain backward-compatible function versions for non-React code
  - [x] 3.6 Ensure context tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Verify hooks work correctly with provider

**Acceptance Criteria:**
- The 4-6 tests written in 3.1 pass
- `useTemplate()` hook provides access to merged template
- Convenience hooks simplify common access patterns
- Error handling for missing provider is clear

---

### Component Migration

#### Task Group 4: Migrate Sequence Components to useTemplate
**Dependencies:** Task Group 3

- [x] 4.0 Complete component migration to template context
  - [x] 4.1 Write 5-8 focused tests for migrated components
    - Test IntroSequence renders with custom template colors
    - Test BookReveal uses template timing values
    - Test StatsReveal applies template fonts
    - Test custom template overrides default styling
    - Test component renders identically with default template vs no template
  - [x] 4.2 Wrap MonthlyRecap composition in TemplateProvider
    - Add `template` to `MonthlyRecapProps` interface
    - Wrap `AbsoluteFill` contents in `TemplateProvider`
    - Call `getEffectiveTemplate()` to merge before passing to provider
  - [x] 4.3 Migrate IntroSequence to use template hooks
    - Replace `COLORS` import with `useColors()` hook
    - Replace `FONTS` import with `useFonts()` hook
    - Replace `TIMING` references with `useTiming()` hook
    - Add `layout` support for `centered`, `split`, `minimal` variants
  - [x] 4.4 Migrate BookReveal to use template hooks
    - Replace direct theme imports with template hooks
    - Add `layout` support for `sequential`, `grid`, `carousel` variants
    - Use `useSequenceConfig('bookReveal')` for sequence-specific settings
  - [x] 4.5 Migrate StatsReveal to use template hooks
    - Replace direct theme imports with template hooks
    - Add layout variant support if applicable
  - [x] 4.6 Migrate ComingSoonSequence to use template hooks
    - Replace direct theme imports with template hooks
    - Add layout variant support if applicable
  - [x] 4.7 Migrate OutroSequence to use template hooks
    - Replace direct theme imports with template hooks
    - Add layout variant support if applicable
  - [x] 4.8 Ensure component migration tests pass
    - Run ONLY the 5-8 tests written in 4.1
    - Verify visual output matches with default template

**Acceptance Criteria:**
- The 5-8 tests written in 4.1 pass
- All five sequence components use `useTemplate()` hooks
- Components support layout property for structural variants
- Default template produces identical output to current implementation

---

### Duration Calculation

#### Task Group 5: Template-Aware Duration Calculation
**Dependencies:** Task Groups 1, 4

- [x] 5.0 Complete template-aware duration calculation
  - [x] 5.1 Write 3-5 focused tests for duration calculation
    - Test `calculateDuration()` with default template matches current behavior
    - Test custom timing values affect duration correctly
    - Test grid layout calculates different duration than sequential
  - [x] 5.2 Update `calculateDuration()` signature
    - Add optional `template?: VideoTemplate` parameter
    - Extract timing values from template when provided
    - Fall back to defaults when template not provided (backward compatibility)
  - [x] 5.3 Implement layout-specific duration formulas
    - Sequential layout: current formula (per-book timing)
    - Grid layout: single reveal for all books (shorter duration)
    - Carousel layout: may need adjusted timing per book
  - [x] 5.4 Update MonthlyRecap to use template-aware duration
    - Pass template to `calculateDuration()` in composition
    - Ensure frame calculations use template timing values
  - [x] 5.5 Ensure duration tests pass
    - Run ONLY the 3-5 tests written in 5.1
    - Verify duration calculations are correct

**Acceptance Criteria:**
- The 3-5 tests written in 5.1 pass
- Duration calculation respects template timing values
- Layout variants produce appropriate durations
- Backward compatibility maintained when no template provided

---

### API Integration

#### Task Group 6: Extend Render Endpoints
**Dependencies:** Task Groups 2, 4, 5

- [x] 6.0 Complete API integration for templates
  - [x] 6.1 Write 4-6 focused tests for API template handling
    - Test `/render` accepts optional template in body
    - Test `/render-stream` accepts template via query parameter
    - Test invalid template returns validation error
    - Test unknown template properties are stripped (not rejected)
    - Test render without template uses defaults
  - [x] 6.2 Extend `RenderRequest` interface
    - Add optional `template?: VideoTemplate` field to `src/lib/types.ts`
    - Update any TypeScript types that depend on `RenderRequest`
  - [x] 6.3 Update `/render` endpoint in `server/index.ts`
    - Extract `template` from request body
    - Call `validateTemplate()` on provided template
    - Pass validated template to composition via `inputProps`
  - [x] 6.4 Update `/render-stream` endpoint
    - Accept `template` query parameter (URL-encoded JSON)
    - Parse and validate template from query string
    - Pass validated template through SSE render flow
  - [x] 6.5 Update `parseRenderStreamQuery()` validation
    - Add optional `queryTemplate` parameter
    - Parse URL-encoded JSON template from query
    - Return validated template in `RenderRequest` result
  - [x] 6.6 Ensure API tests pass
    - Run ONLY the 4-6 tests written in 6.1
    - Verify end-to-end render with custom template

**Acceptance Criteria:**
- The 4-6 tests written in 6.1 pass
- Both `/render` and `/render-stream` accept templates
- Invalid templates return appropriate error responses
- Unknown properties stripped with permissive validation

---

### Testing

#### Task Group 7: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-6

- [x] 7.0 Review existing tests and fill critical gaps only
  - [x] 7.1 Review tests from Task Groups 1-6
    - Review the 4-6 tests written for template types (Task 1.1)
    - Review the 4-6 tests written for validation (Task 2.1)
    - Review the 4-6 tests written for context (Task 3.1)
    - Review the 5-8 tests written for component migration (Task 4.1)
    - Review the 3-5 tests written for duration calculation (Task 5.1)
    - Review the 4-6 tests written for API integration (Task 6.1)
    - Total existing tests: approximately 24-37 tests
  - [x] 7.2 Analyze test coverage gaps for template system only
    - Identify critical template workflows lacking coverage
    - Focus ONLY on gaps related to this spec's feature requirements
    - Prioritize end-to-end template rendering over unit test gaps
  - [x] 7.3 Write up to 10 additional strategic tests maximum
    - Add maximum of 10 new tests to fill identified critical gaps
    - Focus on integration points (template through full render pipeline)
    - Test edge cases: empty template, template with only one section
    - Test visual output consistency with default vs explicit default template
  - [x] 7.4 Run feature-specific tests only
    - Run ONLY tests related to template system (tests from 1.1-6.1 and 7.3)
    - Expected total: approximately 34-47 tests maximum
    - Do NOT run the entire application test suite
    - Verify critical template workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 34-47 tests total)
- Critical template workflows are covered end-to-end
- No more than 10 additional tests added when filling gaps
- Testing focused exclusively on template system requirements

---

## Execution Order

Recommended implementation sequence:

1. **Core Type Definitions (Task Group 1)** - Foundation for all other work; defines the template schema and merge behavior
2. **Validation Layer (Task Group 2)** - Required before API can accept templates; can run in parallel with Task Group 3
3. **React Context System (Task Group 3)** - Required for component migration; can run in parallel with Task Group 2
4. **Component Migration (Task Group 4)** - Depends on context system; largest body of work
5. **Duration Calculation (Task Group 5)** - Depends on types and migrated components
6. **API Integration (Task Group 6)** - Final integration; depends on validation and component readiness
7. **Test Review and Gap Analysis (Task Group 7)** - Final verification after all implementation complete

## File Changes Summary

**New Files:**
- `src/lib/template-types.ts` - VideoTemplate interface, DEFAULT_TEMPLATE, getEffectiveTemplate()
- `src/lib/TemplateContext.tsx` - React context, TemplateProvider, useTemplate hook
- `server/lib/template-validation.ts` - validateTemplate() with permissive validation

**Modified Files:**
- `src/lib/types.ts` - Extend RenderRequest with template field
- `src/lib/theme.ts` - Add useRatingColor() hook, maintain backward compatibility
- `src/compositions/MonthlyRecap/index.tsx` - Add TemplateProvider wrapper, template-aware duration
- `src/compositions/MonthlyRecap/IntroSequence.tsx` - Migrate to useTemplate hooks
- `src/compositions/MonthlyRecap/BookReveal.tsx` - Migrate to useTemplate hooks
- `src/compositions/MonthlyRecap/StatsReveal.tsx` - Migrate to useTemplate hooks
- `src/compositions/MonthlyRecap/ComingSoonSequence.tsx` - Migrate to useTemplate hooks
- `src/compositions/MonthlyRecap/OutroSequence.tsx` - Migrate to useTemplate hooks
- `server/index.ts` - Update /render and /render-stream endpoints
- `server/lib/validation.ts` - Update parseRenderStreamQuery for template parameter
