---
name: Version Control
description: Git workflow and commit conventions. Use when committing changes, creating branches, or managing version control.
---

# Version Control

## When to use this skill:
- Creating commits with proper messages
- Working with feature branches
- Understanding the git workflow

## Branch Naming

```bash
# Feature branches
feature/add-reading-goals
feature/series-tracking

# Bug fixes
fix/auth-redirect-loop
fix/chart-date-parsing

# Refactoring
refactor/search-providers
refactor/modal-components
```

## Commit Message Format

```bash
# Format: <type>: <description>

# Types:
# feat:     New feature
# fix:      Bug fix
# refactor: Code restructuring (no behavior change)
# style:    Formatting, missing semicolons (no code change)
# docs:     Documentation only
# test:     Adding/updating tests
# chore:    Build, dependencies, config

# Examples:
feat: Add cover image selection to Edit Book modal
fix: Display book covers from all providers in library
refactor: Extract search result merging into utility
style: Format API routes with consistent spacing
docs: Update README with deployment instructions
test: Add tests for fuzzy matching utility
chore: Update Prisma to v6.15
```

## Commit Best Practices

```bash
# Good: Specific, describes the change
feat: Add LGBTQ+ representation tracking to book form
fix: Prevent duplicate UserBook entries via unique constraint

# Bad: Vague, doesn't explain what changed
fix: Bug fix
feat: Updates
chore: Changes
```

## Git Workflow

```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/new-feature

# Make changes and commit
git add specific-file.ts
git commit -m "feat: Add new feature component"

# Keep up to date with main
git fetch origin
git rebase origin/main

# Push feature branch
git push -u origin feature/new-feature

# After PR approval, merge via GitHub
```

## What Not to Commit

```gitignore
# Already in .gitignore:
node_modules/
.next/
.env
.env.local
*.log

# Never commit:
# - API keys or secrets
# - .env files with real credentials
# - Large binary files
# - IDE settings (.idea/, .vscode/ unless shared config)
```

## Checking Status

```bash
# Before committing, always check:
git status          # See changed files
git diff            # See unstaged changes
git diff --staged   # See staged changes

# View recent history
git log --oneline -10
```

## Undoing Changes

```bash
# Unstage a file (keep changes)
git reset HEAD file.ts

# Discard changes to a file
git checkout -- file.ts

# Amend last commit (before push)
git commit --amend -m "Updated message"

# Note: Avoid force push to shared branches
```
