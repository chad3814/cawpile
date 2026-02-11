# Product Roadmap

1. [x] (No dependent roadmap items) Template System Architecture — Design and implement a template abstraction layer that allows different video styles to be defined and selected at render time, enabling the same book data to generate videos with different visual themes, layouts, and animation styles. Each template should be able to be specified in JSON, and calls to `/render` or `/render-stream` can optionally include a JSON template. `M`

2. [ ] (Dependent on roadmap item 1) Alternative Template Implementation — Develop a second complete video template with different visual style (e.g., minimal/clean vs. current bold/kinetic) to validate the template system architecture and demonstrate template flexibility. `L`

3. [ ] (Dependent on roadmap item 1) Video Metadata & Versioning — Add metadata tracking to rendered videos including template used, render timestamp, data hash, and version information, enabling better debugging and cache invalidation strategies. `S`

4. [ ] Advanced Animation Library — Expand the animation utilities with additional easing functions, transition effects, and composite animations to provide richer motion design options for current and future templates. Low priority. `M`

5. [ ] Performance Optimization — Profile and optimize rendering performance focusing on bundling speed, memory usage during rendering, and S3 upload efficiency, targeting sub-30-second render times for typical monthly recaps. Low priority. `M`
