#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="cawpile-postgres"
VOLUME_NAME="cawpile-postgres-data"
DB_NAME="cawpile"
DB_USER="cawpile"
START_PORT=5432
MAX_PORT=5532
ENV_FILE=".env"

echo -e "${GREEN}Setting up PostgreSQL for Cawpile...${NC}"

# Function to check if port is available
is_port_available() {
    ! lsof -i ":$1" >/dev/null 2>&1
}

# Function to generate random password
generate_password() {
    openssl rand -hex 16
}

# Function to read value from .env file
read_env_value() {
    local key=$1
    if [ -f "$ENV_FILE" ]; then
        grep "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || echo ""
    else
        echo ""
    fi
}

# Check if volume already exists
VOLUME_EXISTS=false
if docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
    VOLUME_EXISTS=true
    echo -e "${YELLOW}Detected existing volume: ${VOLUME_NAME}${NC}"
fi

# Check if .env exists and read existing credentials
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Reading existing configuration from ${ENV_FILE}...${NC}"
    EXISTING_PASSWORD=$(read_env_value "POSTGRES_PASSWORD")
    EXISTING_PORT=$(read_env_value "POSTGRES_PORT")
    EXISTING_USER=$(read_env_value "POSTGRES_USER")
    EXISTING_DB=$(read_env_value "POSTGRES_DB")

    if [ -n "$EXISTING_PASSWORD" ]; then
        echo -e "${GREEN}Using existing password from ${ENV_FILE}${NC}"
        DB_PASSWORD="$EXISTING_PASSWORD"
    fi

    if [ -n "$EXISTING_USER" ]; then
        DB_USER="$EXISTING_USER"
    fi

    if [ -n "$EXISTING_DB" ]; then
        DB_NAME="$EXISTING_DB"
    fi
fi

# If volume exists but we don't have a password, that's a problem
if [ "$VOLUME_EXISTS" = true ] && [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}ERROR: Volume exists but no password found in ${ENV_FILE}${NC}"
    echo -e "${RED}Cannot recover password from existing PostgreSQL data.${NC}"
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  1. If you have the password, add it to ${ENV_FILE} as POSTGRES_PASSWORD=<password>"
    echo -e "  2. Delete the volume to start fresh: docker volume rm ${VOLUME_NAME}"
    exit 1
fi

# Generate new password only if we don't have one
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Generating new password...${NC}"
    DB_PASSWORD=$(generate_password)
else
    echo -e "${GREEN}Reusing existing credentials${NC}"
fi

# Find available port (prefer existing port if specified)
echo -e "${YELLOW}Finding available port...${NC}"
if [ -n "$EXISTING_PORT" ] && is_port_available "$EXISTING_PORT"; then
    POSTGRES_PORT=$EXISTING_PORT
    echo -e "${GREEN}Reusing port: $POSTGRES_PORT${NC}"
else
    POSTGRES_PORT=$START_PORT
    while [ $POSTGRES_PORT -le $MAX_PORT ]; do
        if is_port_available $POSTGRES_PORT; then
            echo -e "${GREEN}Found available port: $POSTGRES_PORT${NC}"
            break
        fi
        POSTGRES_PORT=$((POSTGRES_PORT + 1))
    done

    if [ $POSTGRES_PORT -gt $MAX_PORT ]; then
        echo -e "${RED}No available ports found between $START_PORT and $MAX_PORT${NC}"
        exit 1
    fi
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Container ${CONTAINER_NAME} already exists. Stopping and removing...${NC}"
    docker stop ${CONTAINER_NAME} >/dev/null 2>&1 || true
    docker rm ${CONTAINER_NAME} >/dev/null 2>&1 || true
fi

# Create volume if it doesn't exist (we already checked above)
if [ "$VOLUME_EXISTS" = false ]; then
    echo -e "${YELLOW}Creating Docker volume: ${VOLUME_NAME}${NC}"
    docker volume create ${VOLUME_NAME}
else
    echo -e "${GREEN}Using existing Docker volume with existing data${NC}"
fi

# Start PostgreSQL container
echo -e "${YELLOW}Starting PostgreSQL container...${NC}"
docker run -d \
    --name ${CONTAINER_NAME} \
    -e POSTGRES_PASSWORD=${DB_PASSWORD} \
    -e POSTGRES_USER=postgres \
    -p ${POSTGRES_PORT}:5432 \
    -v ${VOLUME_NAME}:/var/lib/postgresql/data \
    postgres:16-alpine

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec ${CONTAINER_NAME} pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL is ready!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}PostgreSQL failed to start within the expected time${NC}"
        exit 1
    fi
    sleep 1
done

# Create database if it doesn't exist
echo -e "${YELLOW}Creating database '${DB_NAME}' if it doesn't exist...${NC}"
docker exec ${CONTAINER_NAME} psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
    docker exec ${CONTAINER_NAME} psql -U postgres -c "CREATE DATABASE ${DB_NAME};"

# Create user if it doesn't exist and grant privileges
echo -e "${YELLOW}Creating user '${DB_USER}' if it doesn't exist...${NC}"
docker exec ${CONTAINER_NAME} psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'" | grep -q 1 || \
    docker exec ${CONTAINER_NAME} psql -U postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"

# Grant privileges
echo -e "${YELLOW}Granting privileges...${NC}"
docker exec ${CONTAINER_NAME} psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
docker exec ${CONTAINER_NAME} psql -U postgres -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"
docker exec ${CONTAINER_NAME} psql -U postgres -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};"

# Create or update .env file
echo -e "${YELLOW}Creating/updating ${ENV_FILE}...${NC}"

# Build DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${POSTGRES_PORT}/${DB_NAME}"

# Create .env file
cat >> ${ENV_FILE} << EOF
# PostgreSQL Configuration (Auto-generated by setup-postgres.sh)
# Container: ${CONTAINER_NAME}
# Volume: ${VOLUME_NAME}

# Database Connection
DATABASE_URL=${DATABASE_URL}

# Database Credentials
POSTGRES_HOST=localhost
POSTGRES_PORT=${POSTGRES_PORT}
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}

# Docker Configuration
POSTGRES_CONTAINER=${CONTAINER_NAME}
POSTGRES_VOLUME=${VOLUME_NAME}

# Migration Instructions:
# 1. Generate migration: npm run db:generate
# 2. Apply migration: npm run db:migrate
# 3. Seed data (optional): npm run db:seed

# To connect to the database:
# psql "${DATABASE_URL}"
# or
# docker exec -it ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}
EOF

echo -e "${GREEN}✓ PostgreSQL setup complete!${NC}"
echo ""
echo -e "${GREEN}Configuration saved to ${ENV_FILE}${NC}"
echo -e "${GREEN}Container: ${CONTAINER_NAME}${NC}"
echo -e "${GREEN}Port: ${POSTGRES_PORT}${NC}"
echo -e "${GREEN}Database: ${DB_NAME}${NC}"
echo -e "${GREEN}User: ${DB_USER}${NC}"
echo -e "${GREEN}Volume: ${VOLUME_NAME}${NC}"
echo ""
echo -e "${YELLOW}Connection string:${NC}"
echo -e "${DATABASE_URL}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  Stop container:    docker stop ${CONTAINER_NAME}"
echo -e "  Start container:   docker start ${CONTAINER_NAME}"
echo -e "  View logs:         docker logs ${CONTAINER_NAME}"
echo -e "  Connect to DB:     psql \"${DATABASE_URL}\""
echo -e "  Or:                docker exec -it ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}"
