# Create Commit

You are helping me create a git commit. Follow these steps:

## Step 1: Review Changes

Review the current state of the repository:

```bash
# See all untracked and modified files
git status

# View detailed changes
git diff

# View changes for staged files (if any)
git diff --staged
```

## Step 2: Stage Changes

Stage all changes (excluding secrets):

```bash
# Stage all changes
git add .
```

**Important**: Do not stage files that likely contain secrets:
- `.env` files
- `credentials.json` or similar credential files
- API keys or tokens
- Private keys

If such files are present, warn and exclude them from staging.

## Step 3: Draft Commit Message

Review recent commits to understand the project's commit message style:

```bash
# View recent commit messages
git log --oneline -10
```

Draft a commit message following the standards defined in `standards/global/version-control.md`.

## Step 4: Create Commit

Create the commit with the drafted message:

```bash
git commit -m "$(cat <<'EOF'
[your concise commit message here]
EOF
)"
```

## Step 5: Verify Commit

Confirm the commit was created successfully:

```bash
# Check git status after commit
git status

# View the commit details
git log -1 --format='[%h] %s'
```

Output the commit hash and message to the user.
