# Docker Secrets Directory

This directory contains AWS credential files used by Docker Compose secrets.

## Required Files

Create the following files in this directory (they are gitignored for security):

### `aws_client_id`
Contains your AWS Access Key ID. Single line, no trailing newline.

Example:
```
AKIAIOSFODNN7EXAMPLE
```

### `aws_client_secret`
Contains your AWS Secret Access Key. Single line, no trailing newline.

Example:
```
wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## Security Notes

- Never commit actual credential files to version control
- The `.gitignore` in this directory prevents accidental commits
- These files are mounted as Docker secrets at `/run/secrets/`
- The entrypoint script reads these and exports as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
