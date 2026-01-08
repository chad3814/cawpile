## Customize standards for the project's tech stack

Update the standards under `agent-os/standards/**/*.md` based on well-known best practices for the technologies that comprise this project's tech stack.

CRITICAL EXECUTION REQUIREMENTS:
- Create a TodoWrite list with the 3 steps below BEFORE starting
- Execute steps SEQUENTIALLY - mark each as in_progress ONLY when starting
- After EACH step, verify success before proceeding to the next step
- Mark a step as completed ONLY when verified successful
- If ANY step fails, STOP IMMEDIATELY, keep it as in_progress, and report the failure to the user
- DO NOT attempt the next step until the current step is marked completed

### Step 1: Generate new name for profile

Generate a distincive, kabab-case profile that hints at the project's tech-stack. Read the details of the tech stack in `agent-os/product/tech-stack.md` and generate a 3-30 character profile name in kabob case mentions one or more of the primary aspects of the tech stack. This name does not need to exhaustively cover all aspects of the tech stack. Examples are: "react-rails", "rails-postgres", "react-rails-postgres", "nextjs-supabase", "python-pandas-dynamodb", etc.

Update the value of the property `profile` in `agent-os/config.yml` with this generated name.

### Step 2: Customize standards

The content in the files `agent-os/standards/**/*.md` can be divided into three categories:
    1. Content that can usefully be updated or extended to be specific to the technologies in this project's tech stack (`agent-os/product/tech-stack.md`). Update or extend this content in such a way that when subsequently used in a prompt to generate code, the code will comply with the well-known best practices for the relevant technologies. For example, the generic statement to "Use consistent indentation (spaces or tabs) and configure your editor/linter to enforce it" in `standards/global/coding-style.md` should be changed to make more specific recommendations for the language(s) used in the project's tech stack.
    2. Content that doesn't need to be customized because it is already applicable, as is, to the tech stack. Leave this content unchanged. For example, this category would include the all of the content in the version control standards (`standards/global/version-control.md`) for most projects.
    3. Content that should be removed because it is not applicable to the tech stack. Remove this content. For example, the recommendation to "Use Transactions for Related Changes" in `standards/backend/queries.md` should be removed for an app that has a first-class design principle of using a read-only database.

**Verification required:** Confirm customization edits were successfully applied to all relevant files before proceeding.

### Step 3: Refine standards

Next update the standards (in `agent-os/standards/**/*.md`) to comply with the guidelines below.

#### Keep standards concise

Ensure the new standards are written in such a way that they do not use any more of the token context window than necessary.

#### Keep standards modular

Use modular files that are specific and focused files rather than monolithic. 
- Bad: A monolithic file such as `agent-os/standards/all-standards.md`. 
- Good: Modules such as the following:
    - `agent-os/standards/frontend/react-hooks.md`
    - `agent-os/standards/frontend/component-props.md`
    - `agent-os/standards/frontend/state-management.md`
    - `agent-os/standards/frontend/styling.md`
    - `agent-os/standards/backend/api.md`
    - `agent-os/standards/backend/migrations.md`

#### Be specific and actionable

Keep standards clear and implementable. Bad: Vague standards such as "Write clean code with good naming". Good: Specific standards such as: "Use camelCase for variables. Use descriptive names (getUserById not getUser). Prefix booleans with is/has/should."

#### Provide Examples

Always provide concise examples of how to follow the standard

### Step 4: Improve associated skills

Run this command: `/agent-os:improve-skills improve ALL skills in the folder ~/.claude/skills/`
