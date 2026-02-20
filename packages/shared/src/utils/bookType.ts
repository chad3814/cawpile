import type { BookType } from '../types/enums';

// Non-fiction categories from Google Books
export const NON_FICTION_CATEGORIES = [
  'Biography & Autobiography',
  'Business & Economics',
  'Computers & Technology',
  'Cooking & Food',
  'Health & Fitness',
  'History',
  'Law',
  'Medical',
  'Philosophy',
  'Psychology',
  'Religion & Spirituality',
  'Science & Mathematics',
  'Self-Help',
  'Social Science',
  'Sports & Recreation',
  'Travel',
  'True Crime',
  'Reference & Study Aids',
  'Politics & Government',
  'Essays & Literary Criticism',
  'Education',
  'Architecture',
  'Art',
  'Music',
  'Photography',
  'Gardening',
  'Crafts & Hobbies',
  'Nature',
  'Pets',
  'Transportation',
  'Language Arts & Disciplines',
  'Performing Arts',
  'Design',
  'Technology & Engineering',
  'Computers',
  'Mathematics',
  'Science',
  'Biography',
  'Autobiography',
  'Memoir',
  'Business',
  'Economics',
  'Finance',
  'Cooking',
  'Health',
  'Fitness',
  'Diet',
  'Psychology & Counseling',
  'Religion',
  'Spirituality',
  'Social Sciences',
  'Political Science',
  'Current Events',
  'Study Aids',
  'Test Preparation',
  'Reference'
];

/**
 * Detects whether a book is fiction or non-fiction based on its categories
 * @param categories Array of category strings from Google Books or other sources
 * @returns 'FICTION' or 'NONFICTION'
 */
export function detectBookType(categories: string[] | null | undefined): BookType {
  // Default to fiction if no categories provided
  if (!categories || categories.length === 0) {
    return 'FICTION';
  }

  // First, check for explicit "fiction" or "non-fiction" categories
  // These take priority over all other categorization
  const hasFictionCategory = categories.some(category => {
    const categoryLower = category.toLowerCase();
    return categoryLower === 'fiction' ||
           categoryLower.includes('fiction') && !categoryLower.includes('non-fiction') && !categoryLower.includes('nonfiction');
  });

  const hasNonFictionCategory = categories.some(category => {
    const categoryLower = category.toLowerCase();
    return categoryLower === 'non-fiction' ||
           categoryLower === 'nonfiction' ||
           categoryLower.includes('non-fiction') ||
           categoryLower.includes('nonfiction');
  });

  // Priority rules:
  // 1. If explicitly marked as "non-fiction", it's NONFICTION regardless of other categories
  if (hasNonFictionCategory) {
    return 'NONFICTION';
  }

  // 2. If explicitly marked as "fiction", it's FICTION regardless of other categories
  if (hasFictionCategory) {
    return 'FICTION';
  }

  // 3. Otherwise, check against known non-fiction categories
  const isNonFiction = categories.some(category => {
    const categoryLower = category.toLowerCase();
    return NON_FICTION_CATEGORIES.some(nonFictionCategory => {
      const nonFictionLower = nonFictionCategory.toLowerCase();
      // Check if either contains the other (partial matching)
      return categoryLower.includes(nonFictionLower) ||
             nonFictionLower.includes(categoryLower) ||
             // Also check individual words for better matching
             nonFictionLower.split(/[&\s]+/).some(word =>
               word.length > 3 && categoryLower.includes(word)
             );
    });
  });

  return isNonFiction ? 'NONFICTION' : 'FICTION';
}

/**
 * Helper to determine if a specific category string indicates non-fiction
 */
export function isNonFictionCategory(category: string): boolean {
  const categoryLower = category.toLowerCase();
  return NON_FICTION_CATEGORIES.some(nonFictionCategory => {
    const nonFictionLower = nonFictionCategory.toLowerCase();
    return categoryLower.includes(nonFictionLower) ||
           nonFictionLower.includes(categoryLower);
  });
}
