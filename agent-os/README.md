# Getting Started

## Project Config

- Configure core project info
    - In Claude Code, run: `/agent-os:plan-product`
    - Generates `agent-os/project/{mission,roadmap,tech-stack}.md`

- Customize standards for your tech stack
    - In Claude Code, run: `/agent-os:customize-standards-for-tech-stack`
    - Generates `agent-os/standards/**/*.md`  (review these carefully!)

## Build a feature

- Create the spec
    - In Claude Code, run: `/agent-os:create-spec`
    - Asks clarifying questions
    - Generates
        - `spec/my-new-feauture/requirements.md`
        - `spec/my-new-feauture/spec.md` (review this carefully!)
- Create the tasks
    - In Claude Code, run: `/agent-os:create-tasks`
    - Generates `spec/my-new-feauture/tasks.md`
- Implement the tasks
    - In Claude Code, run: `/agent-os:implement-tasks`
    - Generates code for your feature (review this carefully!)
    