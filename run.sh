#!/bin/sh

if [ ! -f /app/data/production.db ]; then
  echo "Bootstrapping production database..."
  cp /app/prisma/bootstrap.db /app/data/production.db
fi

# Make sure the production database schema is up to date
npx prisma migrate deploy

# Start the application
npm start