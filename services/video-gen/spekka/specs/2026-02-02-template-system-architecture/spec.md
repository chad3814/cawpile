# Specification: Template System Architecture

## Goal
Design and implement a template abstraction layer that allows different video styles and structural layouts to be defined via inline JSON at render time, enabling the same book data to generate videos with different visual themes, layouts, and animation styles.

## User Stories
- As an API consumer, I want to pass an optional JSON template in my render request so that I can customize the video's visual style and layout without code changes
- As the Cawpile platform, I want to manage templates externally and pass them inline so that template creation and storage remains decoupled from the video generator

## Specific Requirements

**Template JSON Schema Definition**
- Define a TypeScript interface `VideoTemplate` that encompasses all customizable aspects of the video
- Template contains optional sections for each sequence: `intro`, `bookReveal`, `statsReveal`, `comingSoon`, `outro`
- Include a `global` section for shared styling (colors, fonts) that applies across all sequences
- Each sequence section allows both visual styling and structural/layout configuration
- Use optional properties throughout so partial templates work (missing values use defaults)

**Permissive Template Validation**
- Create a validation function that strips unknown properties rather than rejecting
- Log warnings for unknown properties in development mode for debugging
- Return a sanitized template object with only recognized properties
- Follow the existing validation pattern in `server/lib/validation.ts`

**Default Template from Current Theme**
- Current `COLORS`, `FONTS`, and `TIMING` values in `theme.ts` become the default template
- When no template is provided, behavior matches current implementation exactly
- Create a `getEffectiveTemplate()` function that merges provided template over defaults

**Template Integration with Render Endpoints**
- Extend `RenderRequest` interface to include optional `template?: VideoTemplate` field
- Update `/render` endpoint to accept and process template from request body
- Update `/render-stream` endpoint to accept template via query parameter (URL-encoded JSON)
- Pass resolved template through to composition via `inputProps`

**Sequence-Level Structural Configuration**
- Each sequence config supports a `layout` property to select between structural variants
- BookReveal supports layouts like `sequential` (current), `grid` (all covers at once), `carousel`
- IntroSequence supports layouts like `centered` (current), `split`, `minimal`
- Layout changes affect component structure, not just styling

**Global Styling Configuration**
- Template `global.colors` overrides any value from `COLORS` constant
- Template `global.fonts` overrides any value from `FONTS` constant
- Template `global.timing` overrides any value from `TIMING` constant (frame counts only)
- Components read from resolved template context rather than importing theme directly

**React Context for Template Distribution**
- Create `TemplateContext` to provide resolved template values to all components
- Create `useTemplate()` hook for components to access template values
- Wrap composition in `TemplateProvider` that receives merged template via props
- Components migrate from direct `COLORS`/`FONTS` imports to `useTemplate()` hook

**Duration Calculation with Templates**
- Update `calculateDuration()` to accept optional template parameter
- Duration calculation uses timing values from template when provided
- Structural layouts (e.g., grid showing all books at once) may require different duration formulas

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`src/lib/theme.ts` - Current Theme Constants**
- Contains `COLORS`, `FONTS`, `TIMING`, and `VIDEO_CONFIG` that define current defaults
- `getRatingColor()` and `convertToStars()` functions should continue working with template colors
- Structure of these constants informs the template schema design

**`server/lib/validation.ts` - Validation Pattern**
- `ValidationResult` type pattern for success/failure results
- `parseRenderStreamQuery()` shows how to validate and parse JSON from query params
- Pattern of returning either valid data or error message should be replicated for template validation

**`src/lib/types.ts` - Type Definitions**
- `RenderRequest` interface to extend with template field
- Type organization pattern to follow for new template types
- Keep template types in a new `src/lib/template-types.ts` file for organization

**`src/compositions/MonthlyRecap/index.tsx` - Composition Orchestration**
- Shows how sequences are composed with timing calculations
- `calculateDuration()` function that needs template awareness
- `MonthlyRecapProps` interface to extend with template

**Sequence Components Pattern**
- All five sequences import `COLORS`, `FONTS`, `TIMING` directly from theme
- Components use frame-based animation with Remotion hooks
- Migration path: replace direct imports with `useTemplate()` hook calls

## Out of Scope
- Named template registry or template storage (handled by external Cawpile project)
- Template management UI or editing interface
- Changing video dimensions from 1080x1920
- Changing frame rate from 30fps
- Changing video codec from H.264
- Changing sequence order (Intro -> BookReveal -> StatsReveal -> ComingSoon -> Outro)
- Template inheritance or layering system
- Real-time template preview in Remotion Studio
- Template versioning or migration
- Audio/music customization via templates
