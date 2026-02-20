// Re-export book type detection from shared package.
// The shared package uses standalone string union types instead of @prisma/client enums.
// The return type ('FICTION' | 'NONFICTION') is compatible with Prisma's BookType enum.
export { detectBookType, isNonFictionCategory, NON_FICTION_CATEGORIES } from '@cawpile/shared';
