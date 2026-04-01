const bannedWords = ['spam', 'abuse', 'hate'];

export function filterContent(text: string): {
  clean: string;
  flagged: boolean;
} {
  const lower = text.toLowerCase();
  
  const flagged = bannedWords.some(word => lower.includes(word));
  
  if (flagged) {
    return { clean: text, flagged: true };
  }
  
  return { clean: text, flagged: false };
}