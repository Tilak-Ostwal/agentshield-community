export function calculateDifficultyScore(difficulty: string): number {
  const scores: Record<string, number> = { basic: 1, intermediate: 2, advanced: 3, expert: 4 };
  return scores[difficulty] || 1;
}
