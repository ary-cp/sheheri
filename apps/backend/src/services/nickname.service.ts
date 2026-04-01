const adjectives = [
  'ghost', 'shadow', 'silent', 'hidden', 'dark',
  'mystic', 'secret', 'urban', 'street', 'night',
  'lost', 'wandering', 'unknown', 'masked', 'quiet',
  'rebel', 'rogue', 'stealth', 'blur', 'phantom'
];

const nouns = [
  'walker', 'rider', 'hunter', 'seeker', 'drifter',
  'watcher', 'runner', 'voice', 'soul', 'mind',
  'eye', 'hand', 'crow', 'wolf', 'fox',
  'hawk', 'raven', 'echo', 'signal', 'cipher'
];

export function generateNickname(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999) + 1;
  return `${adj}_${noun}_${num}`;
}

// Check karo nickname valid hai — only letters, numbers, underscore
export function isValidNickname(nickname: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(nickname);
}