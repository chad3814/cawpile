import type { CawpileFacet, CawpileRating, CawpileSemanticColor } from '../types/cawpile';
import type { BookType } from '../types/enums';

export const FICTION_FACETS: CawpileFacet[] = [
  {
    name: "Characters",
    key: "characters",
    description: "Character development and memorability",
    questions: [
      "Are they memorable?",
      "Were the secondary characters distinguishable/important/additive to the story?",
      "Did you care about what happens to the characters?",
      "Were they flat/one dimensional?",
      "Do you have a good idea of their personality?"
    ]
  },
  {
    name: "Atmosphere",
    key: "atmosphere",
    description: "Immersion and world-building",
    questions: [
      "How immersive was the read?",
      "Were you able to picture the setting, the characters, creatures?",
      "Was the energy in the scenes palpable?",
      "Was it convincing?"
    ]
  },
  {
    name: "Writing",
    key: "writing",
    description: "Writing style and prose quality",
    questions: [
      "Did you enjoy the writing style?",
      "Was the prose to your liking/unique?",
      "Was it hard to follow?",
      "How was the dialogue to narration ratio?",
      "Did it flow easily and feel beautiful but effortless?",
      "Would you read another book from this author?"
    ]
  },
  {
    name: "Plot",
    key: "plot",
    description: "Story structure and pacing",
    questions: [
      "Was the pacing good?",
      "Were there any parts where things dragged on?",
      "Was the overall plot satisfying?",
      "Were the reveals worth the journey?",
      "Was this plot unique from other books you've read?",
      "Did it surprise you in any way?",
      "Was it too complex, too bland, or just right?"
    ]
  },
  {
    name: "Intrigue",
    key: "intrigue",
    description: "Engagement and page-turning quality",
    questions: [
      "Were you wishing you could be reading this book instead of doing other things?",
      "Did it take mental convincing to pick it back up?",
      "Were you intrigued to see where the story goes?",
      "Did the story hold your attention throughout?"
    ]
  },
  {
    name: "Logic",
    key: "logic",
    description: "Internal consistency and coherence",
    questions: [
      "Were the characters acting in accordance with their motives?",
      "Were you able to follow the rules of the world?",
      "Did you find any plot holes?",
      "Was the world building sufficient/overwhelming/clear?",
      "Did everything fit the story, setting, motives perfectly?"
    ]
  },
  {
    name: "Enjoyment",
    key: "enjoyment",
    description: "Overall satisfaction",
    questions: [
      "Did you enjoy the book overall?",
      "Was your enjoyment consistent throughout?"
    ]
  }
];

export const NONFICTION_FACETS: CawpileFacet[] = [
  {
    name: "Credibility/Research",
    key: "characters",
    description: "Trustworthiness and research quality",
    questions: [
      "Was the author credible and trustworthy?",
      "Was the reporting unbiased?",
      "Were sources and references provided?",
      "Was the demographic representation inclusive?"
    ]
  },
  {
    name: "Authenticity/Uniqueness",
    key: "atmosphere",
    description: "New perspectives and differentiation",
    questions: [
      "Did it offer new perspectives?",
      "How did it differentiate from other books on the topic?",
      "Was the approach unique or innovative?"
    ]
  },
  {
    name: "Writing",
    key: "writing",
    description: "Accessibility and presentation style",
    questions: [
      "Was it accessible to the intended audience?",
      "Was the presentation style engaging?",
      "Was it too dry or academic?",
      "Did it flow well?"
    ]
  },
  {
    name: "Personal Impact",
    key: "plot",
    description: "Takeaways and lasting impact",
    questions: [
      "What were your key takeaways?",
      "How useful was the information?",
      "Will it have a lasting impact on you?",
      "Did it change your perspective?"
    ]
  },
  {
    name: "Intrigue",
    key: "intrigue",
    description: "Engagement and attention-holding",
    questions: [
      "Did it hold your attention throughout?",
      "Were you eager to continue reading?",
      "Did it make you want to learn more?"
    ]
  },
  {
    name: "Logic/Informativeness",
    key: "logic",
    description: "Clarity and knowledge density",
    questions: [
      "Was the information clearly presented?",
      "Was there good knowledge density vs filler?",
      "Were the arguments logical and well-structured?",
      "Did it avoid unnecessary repetition?"
    ]
  },
  {
    name: "Enjoyment",
    key: "enjoyment",
    description: "Overall satisfaction",
    questions: [
      "Did you enjoy reading this book?",
      "Would you recommend it to others?"
    ]
  }
];

export const RATING_SCALE_GUIDE = [
  { value: 10, label: "One of my favourites ever" },
  { value: 9, label: "Excellent. Maybe one little problem" },
  { value: 8, label: "Great. A couple of problems, but nothing major" },
  { value: 7, label: "Good. Has issues, but enjoyable" },
  { value: 6, label: "Ok. Good outweighs bad" },
  { value: 5, label: "Mediocre. Equal good and bad" },
  { value: 4, label: "Poor. Bad outweighs good" },
  { value: 3, label: "Bad. A few good things but not enjoyable" },
  { value: 2, label: "Horrible. Not enough to redeem" },
  { value: 1, label: "Abysmal. Shouldn't have been published" }
];

export function getFacetConfig(bookType: BookType): CawpileFacet[] {
  return bookType === 'NONFICTION' ? NONFICTION_FACETS : FICTION_FACETS;
}

const RATING_KEYS = ['character', 'atmospher', 'writing', 'plot', 'intrigue', 'enjoyment'];

export function calculateCawpileAverage(rating: CawpileRating): number {
  const values = Object.entries(rating).filter(
    ([key, val]: [string, string | number | null]) =>
      RATING_KEYS.includes(key) && 'number' === typeof val
  ).map(([, val]) => val as number);

  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Number((sum / values.length).toFixed(1));
}

export function convertToStars(average: number): number {
  if (average <= 1.0) return 0;
  if (average <= 2.2) return 1;
  if (average <= 4.5) return 2;
  if (average <= 6.9) return 3;
  if (average <= 8.9) return 4;
  return 5;
}

export function getCawpileGrade(average: number): string {
  if (average >= 9) return 'A+';
  if (average >= 8.5) return 'A';
  if (average >= 8) return 'A-';
  if (average >= 7.5) return 'B+';
  if (average >= 7) return 'B';
  if (average >= 6.5) return 'B-';
  if (average >= 6) return 'C+';
  if (average >= 5.5) return 'C';
  if (average >= 5) return 'C-';
  if (average >= 4.5) return 'D+';
  if (average >= 4) return 'D';
  return 'F';
}

/**
 * Returns a semantic color name for a CAWPILE rating value.
 * Platform-specific rendering (Tailwind classes, hex codes, etc.)
 * should map these semantic names to actual colors.
 */
export function getCawpileColor(value: number): CawpileSemanticColor {
  if (value >= 8) return 'green';
  if (value >= 6) return 'yellow';
  if (value >= 4) return 'orange';
  return 'red';
}
