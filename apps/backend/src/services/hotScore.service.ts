export function calculateHotScore(
  upvotes: number,
  downvotes: number,
  createdAt: Date
): number {
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign  = score > 0 ? 1 : score < 0 ? -1 : 0;
  const epoch = new Date('2024-01-01').getTime() / 1000;
  const seconds = createdAt.getTime() / 1000 - epoch;
  return parseFloat((sign * order + seconds / 45000).toFixed(7));
}