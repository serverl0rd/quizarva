#!/bin/bash

# Load environment variables from .env.local
export $(grep -E "^(DATABASE_URL|POSTGRES_URL|PRISMA_DATABASE_URL)=" .env.local | xargs)

# Remove quotes from DATABASE_URL if present
if [[ -n "$DATABASE_URL" ]]; then
    export DATABASE_URL=$(echo "$DATABASE_URL" | tr -d '"')
elif [[ -n "$POSTGRES_URL" ]]; then
    export DATABASE_URL=$(echo "$POSTGRES_URL" | tr -d '"')
elif [[ -n "$PRISMA_DATABASE_URL" ]]; then
    export DATABASE_URL=$(echo "$PRISMA_DATABASE_URL" | tr -d '"')
fi

echo "🔍 Checking database connection..."

# Run Prisma commands
npx prisma migrate deploy
npx prisma generate

echo "✅ Migrations complete!"