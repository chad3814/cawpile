# Spec Requirements: Template System Architecture

## Initial Description
Design and implement a template abstraction layer that allows different video styles to be defined and selected at render time, enabling the same book data to generate videos with different visual themes, layouts, and animation styles. Each template should be able to be specified in JSON, and calls to `/render` or `/render-stream` can optionally include a JSON template.

## Requirements Discussion

### First Round Questions

**Q1:** I assume templates will primarily define visual styling (colors, fonts, animation timing) rather than structural changes to sequences. Is that correct, or should templates be able to define entirely different sequence layouts?
**Answer:** Templates SHOULD define structural changes to each section, for example if all the book covers were on the screen at once. Not just visual styling.

**Q2:** I'm thinking templates would be named configurations stored in the codebase (e.g., "bold-kinetic", "minimal-clean") that are referenced by name in API calls. Should we support both named templates AND inline JSON template definitions passed directly in the request body?
**Answer:** Only inline templates. The registry and any associated UI will be in the main cawpile project (external to this codebase).

**Q3:** Should templates be able to swap out entire sequence components (e.g., use a different BookReveal component), or just configure the existing components with different parameters?
**Answer:** Templates should be able to alter any sequence.

**Q4:** I assume the current hardcoded theme values in `src/lib/theme.ts` should become the "default" template that's used when no template is specified. Is that correct?
**Answer:** Yes, current hardcoded theme values become the "default" template.

**Q5:** For template validation, should the system be strict (reject unknown properties) or permissive (ignore unknown properties for forward compatibility)?
**Answer:** Permissive - ignore unknown properties for forward compatibility.

**Q6:** Should templates support inheritance/layering (e.g., a template extends "default" and overrides specific values), or should each template be completely self-contained?
**Answer:** Self-contained templates, no inheritance/layering system.

**Q7:** Is there anything that should explicitly be OUT of scope for template customization (e.g., video dimensions, fps, codec)?
**Answer:** No changing video dimensions, fps, codec, sequence order - just visual styles and structural changes within sequences as stated above.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Templates are passed inline as JSON in API requests to `/render` or `/render-stream`
- Templates can define visual styling (colors, fonts, animation timing, etc.)
- Templates can define structural changes within sequences (e.g., multiple book covers displayed simultaneously)
- Templates can alter any of the five sequences: IntroSequence, BookReveal, StatsReveal, ComingSoonSequence, OutroSequence
- When no template is provided, current hardcoded theme values serve as the default
- Unknown template properties are ignored (permissive validation for forward compatibility)
- Each template is self-contained with no inheritance or layering system

### Reusability Opportunities
- No existing similar features identified
- Current theme values in `src/lib/theme.ts` will form the basis of the default template

### Scope Boundaries
**In Scope:**
- JSON template schema definition
- Visual styling customization (colors, fonts, animations)
- Structural changes within sequences (layout variations)
- Alterations to any sequence component
- Default template based on current theme values
- Permissive validation that ignores unknown properties
- Integration with existing `/render` and `/render-stream` endpoints

**Out of Scope:**
- Named template registry (handled by external Cawpile project)
- Template management UI (handled by external Cawpile project)
- Video dimension changes (locked at 1080x1920)
- Frame rate changes (locked at 30fps)
- Codec changes (locked at H.264)
- Sequence order changes (Intro -> BookReveal -> StatsReveal -> ComingSoon -> Outro)
- Template inheritance or layering system

### Technical Considerations
- Templates passed as JSON in request body
- Must integrate with existing Remotion composition flow
- Must maintain compatibility with existing frame-based animation system
- Should allow component-level customization within sequences
- Validation should be permissive to support forward compatibility as template schema evolves
- Default behavior must match current implementation exactly when no template provided
