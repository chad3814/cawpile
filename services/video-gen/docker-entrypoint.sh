#!/bin/sh
set -e

# Docker entrypoint script for Cawpile Video Generator
# Reads AWS credentials from Docker secrets and exports them as environment variables

# Path to Docker secret files
AWS_CLIENT_ID_FILE="/run/secrets/aws_client_id"
AWS_CLIENT_SECRET_FILE="/run/secrets/aws_client_secret"

# Validate that required secret files exist
if [ ! -f "$AWS_CLIENT_ID_FILE" ]; then
    echo "Error: AWS client ID secret file not found at $AWS_CLIENT_ID_FILE"
    echo "Please ensure the aws_client_id secret is properly configured in docker-compose.yaml"
    exit 1
fi

if [ ! -f "$AWS_CLIENT_SECRET_FILE" ]; then
    echo "Error: AWS client secret file not found at $AWS_CLIENT_SECRET_FILE"
    echo "Please ensure the aws_client_secret secret is properly configured in docker-compose.yaml"
    exit 1
fi

# Read secrets and export as AWS environment variables
# Using cat and export to read file contents into environment variables
export AWS_ACCESS_KEY_ID=$(cat "$AWS_CLIENT_ID_FILE")
export AWS_SECRET_ACCESS_KEY=$(cat "$AWS_CLIENT_SECRET_FILE")

echo "[Entrypoint] AWS credentials loaded from Docker secrets"

# Use exec to replace the shell process with the Node.js process
# This ensures proper signal handling (SIGTERM, SIGINT) for graceful shutdown
exec npm run server
