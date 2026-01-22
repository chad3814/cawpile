---
name: Prisma Migrations
description: Standards for Prisma database migrations. Use when modifying prisma/schema.prisma, creating new models, adding fields, or running migration commands.
---

# Prisma Migrations

## When to use this skill:
- Adding or modifying models in `prisma/schema.prisma`
- Creating database migrations
- Adding new fields to existing tables
- Setting up relations between models
- Running migration commands

## Schema Modification Workflow

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Verify generated migration in `prisma/migrations/`
4. Update TypeScript types with `npx prisma generate`

## Adding a New Model

```prisma
// prisma/schema.prisma
model NewModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Required fields
  name      String

  // Optional fields
  description String?

  // Relations
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

## Adding Fields to Existing Models

```prisma
// Adding required field with default
model User {
  // ... existing fields
  newField String @default("default_value")
}

// Adding optional field (no default needed)
model User {
  // ... existing fields
  optionalField String?
}
```

## Relation Patterns

```prisma
// One-to-Many (User has many Books)
model User {
  id        String     @id @default(cuid())
  userBooks UserBook[]
}

model UserBook {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// One-to-One
model UserBook {
  id       String         @id @default(cuid())
  rating   CawpileRating?
}

model CawpileRating {
  id         String   @id @default(cuid())
  userBookId String   @unique
  userBook   UserBook @relation(fields: [userBookId], references: [id], onDelete: Cascade)
}
```

## Unique Constraints

```prisma
// Single field unique
model Edition {
  isbn String @unique
}

// Composite unique
model UserBook {
  userId    String
  editionId String

  @@unique([userId, editionId])
}
```

## Migration Commands

```bash
# Create and apply migration (development)
npx prisma migrate dev --name add_new_field

# Apply migrations (production)
npx prisma migrate deploy

# Push schema without migration (prototyping only)
npx prisma db push

# Reset database (destroys data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## Migration Naming Convention

Use snake_case with descriptive names:
- `add_cover_image_to_edition`
- `create_reading_session_model`
- `add_user_preferences`
- `remove_deprecated_field`

## Handling Breaking Changes

For required fields on existing data:
```prisma
// Step 1: Add as optional
newField String?

// Step 2: Run migration, backfill data

// Step 3: Make required in next migration
newField String
```
