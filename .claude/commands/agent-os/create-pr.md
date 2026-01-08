# Create Pull Request

You are helping me create a pull request for changes I've made. Follow these steps in sequence:

## Step 1: Switch to or Create Branch

The branch name should match the spec folder name format: `YYYY-MM-DD-spec-name`

First, check if the branch exists and switch to it, or create it if needed:

```bash
# Determine the branch name (use spec name or derive from description)
BRANCH_NAME="[YYYY-MM-DD-spec-name]"

# Check if branch exists locally
if git branch --list "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
  git checkout "$BRANCH_NAME"
elif git branch -r --list "origin/$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
  git fetch origin
  git checkout -b "$BRANCH_NAME" "origin/$BRANCH_NAME"
else
  git checkout main
  git pull origin main
  git checkout -b "$BRANCH_NAME"
fi

# Verify current branch
git branch --show-current
```

## Step 2: Create Commit

Use the create-commit command to create a commit:

/agent-os:create-commit

## Step 3: Create Pull Request

Push the branch and create a PR following the standards defined in `standards/global/version-control.md`:

```bash
# Get current branch name
BRANCH_NAME=$(git branch --show-current)

# Review all commits that will be in the PR
git log main..HEAD --oneline
git diff main...HEAD

# Push branch to remote
git push -u origin "$BRANCH_NAME"

# Create PR targeting main
# Title and description format per standards/global/version-control.md
gh pr create --title "[concise PR title]" --body "$(cat <<'EOF'
[PR description per standards/global/version-control.md]
EOF
)"
```

## Important Notes

- Branch names follow `YYYY-MM-DD-spec-name` format
- Always branch off `main`
- Analyze ALL commits in the branch for the PR description, not just the latest
- Follow all commit message and PR standards in `standards/global/version-control.md`
- PRs target `main` by default
- Return the PR URL to the user when created
