import type { BookType } from './enums';

export interface CawpileFacet {
  name: string;
  key: keyof CawpileRating;
  description: string;
  questions: string[];
}

export interface CawpileRating {
  characters: number | null;
  atmosphere: number | null;
  writing: number | null;
  plot: number | null;
  intrigue: number | null;
  logic: number | null;
  enjoyment: number | null;
}

export type CawpileSemanticColor = 'green' | 'yellow' | 'orange' | 'red';

// Re-export BookType for convenience (it was originally defined in cawpile.ts in the web app)
export type { BookType } from './enums';
