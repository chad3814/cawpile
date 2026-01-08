## Version Control Standards

### Commit Messages

#### Core Standards

- **Summarize what changed**: Provide a clear, concise description of the current changes in the staged and unstaged changes
- **Single line only**: No multi-line messages
- **Format**: `<brief description>` (no prefixes, no special formatting)
- **Length**: Short and concise
- **No conventional commit types**: Do NOT use feat:, fix:, docs:, etc.
- **No co-authors**: NEVER include Co-Authored-By lines
- **No attribution**: Do NOT include links or attribution text
- **Focus**: Describe what changed, not why

#### Examples of Good Commit Messages

- "Add expand editor modal for Code Embed section"
- "Update user profile validation logic"
- "Fix navigation menu alignment on mobile"
- "Remove deprecated authentication middleware"
- "Add Next.js web app to Docker Compose with hot reload"

#### Examples of Bad Commit Messages (DO NOT USE)

❌ "feat: Add new feature"
❌ "Fix bug in authentication"
❌ "Update code\n\nCo-Authored-By: Claude"
❌ "🤖 Generated with [Claude Code]"
❌ "WIP: working on feature"

#### Output Format

Provide ONLY the commit message text, nothing else:

```
Your single-line commit message here
```

#### Guidelines

- Read the diff carefully to understand all changes
- If multiple unrelated changes, note that (but still generate one message)
- Use active voice: "Add", "Update", "Fix", "Remove", "Refactor"
- Be specific but concise
- Avoid vague terms like "various changes" or "improvements"
- Focus on user-facing impact when applicable
- Keep length to under 70 characters if possible

### Pull Requests


#### Core Description Standards

- **Format**: Comprehensive markdown description
- **Purpose**: Explain changes, their purpose, and relevant context
- **Attribution**: To the current git user (no AI attribution)


#### Core Title Standards 

- **Title content**: Summarize the description in one line under 60 characters
- **Title format**: `[<ticket-id>] Ticket Title` (handled separately)


## Your Responsibilities

1. **Reference spec**: Note the spec by referencing the full name of the spec folder in the format yyyy-mm-dd-spec-name
1. **Reference Linear ticket**: Note the linear ticket if there is one
2. **Review commits**: Examine all commits in the branch
3. **Examine code changes**: Use git diff to understand what changed
4. **Generate comprehensive description**: Create clear, structured markdown
5. **Include testing info**: Document how changes were tested

#### Output Format

Generate a markdown PR description with these sections:

```markdown
## Summary

[2-3 sentence overview of what was changed and why]

## Changes

- **Category 1**: Description of changes in this area
  - Specific change detail
  - Another specific change
- **Category 2**: Description of changes in this area
  - Specific change detail

## Implementation Details

[Important technical decisions or approaches taken]
[Rationale for key choices]

## Testing

- ✅ Linting passed
- ✅ Type checking passed
- ✅ All tests pass
- ✅ [Manual testing performed]

## Related

- Fixes [TICKET-123]
- Related to [TICKET-456]
- Depends on [PR #789]
```

#### Guidelines

- Be comprehensive but concise - reviewers should understand changes quickly
- Focus on **what** changed and **why**, not just restating the code
- Highlight non-obvious decisions or tradeoffs
- Include any breaking changes or migration notes
- Note any follow-up work needed
- Use proper markdown formatting
- Group related changes together logically
- Use bullet points for readability
- Include specific file paths when referencing changes
- Mention any new dependencies or configuration changes
- If changes affect documentation, mention which docs were updated

#### Examples of Good Descriptions

**Good**: "Added Docker Compose configuration for Next.js web app with hot reload support using bind mounts and anonymous volumes. This enables a unified development workflow with a single `pnpm services:dev` command."

**Bad**: "Made some changes to Docker config"

**Good**: "Refactored authentication middleware to use Next.js 16's proxy.ts instead of deprecated middleware.ts. Updated async cookie handling to comply with new Next.js APIs."

**Bad**: "Updated auth stuff"
