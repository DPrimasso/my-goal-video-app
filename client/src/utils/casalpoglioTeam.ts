const CLUB_NAME = 'casalpoglio';
const CLUB_PREFIXES = new Set(['polisportiva', 'pol', 'asd', 'ac', 'fc', 'us', 'ssd']);

function similarity(candidate: string): number {
  if (!candidate) return 0;
  let previous = Array.from({ length: CLUB_NAME.length + 1 }, (_, index) => index);
  for (let row = 1; row <= candidate.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= CLUB_NAME.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (candidate[row - 1] === CLUB_NAME[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return 1 - previous[CLUB_NAME.length] / Math.max(candidate.length, CLUB_NAME.length);
}

function clubSimilarity(teamName: string): number {
  const words = teamName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('it-IT')
    .replace(/\./g, '')
    .match(/[a-z]+/g) || [];
  const meaningfulWords = words.filter((word) => !CLUB_PREFIXES.has(word));
  // Compare both individual words and the joined name (e.g. "Casal Poglio").
  return Math.max(0, ...meaningfulWords.map(similarity), similarity(meaningfulWords.join('')));
}

/** One of the two teams is always Casalpoglio; prefer home when scores tie. */
export function getCasalpoglioSide(homeTeam: string, awayTeam: string): 'home' | 'away' | null {
  if (!homeTeam.trim() && !awayTeam.trim()) return null;
  if (!homeTeam.trim()) return 'away';
  if (!awayTeam.trim()) return 'home';
  return clubSimilarity(homeTeam) >= clubSimilarity(awayTeam) ? 'home' : 'away';
}
