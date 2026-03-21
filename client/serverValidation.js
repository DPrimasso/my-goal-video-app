/**
 * Payload validation for API routes.
 * Returns { ok: true } or { ok: false, error: string }.
 */

function validateGoalImagePayload(body) {
  const b = body || {};
  if (!b.minuteGoal || !b.playerName || !String(b.playerName).trim()) {
    return { ok: false, error: 'Missing minuteGoal or playerName' };
  }
  if (!b.homeTeam || !String(b.homeTeam).trim()) {
    return { ok: false, error: 'Missing homeTeam or awayTeam' };
  }
  if (!b.awayTeam || !String(b.awayTeam).trim()) {
    return { ok: false, error: 'Missing homeTeam or awayTeam' };
  }
  if (b.homeScore === undefined || b.homeScore === null) {
    return { ok: false, error: 'Missing homeScore or awayScore' };
  }
  if (b.awayScore === undefined || b.awayScore === null) {
    return { ok: false, error: 'Missing homeScore or awayScore' };
  }
  return { ok: true };
}

function validateLineupPayload(body) {
  const b = body || {};
  if (!b.players || !Array.isArray(b.players) || b.players.length !== 11) {
    return { ok: false, error: 'Missing or invalid players data. Expected exactly 11 players.' };
  }
  if (!b.opponentTeam || !String(b.opponentTeam).trim()) {
    return { ok: false, error: 'Missing opponent team name' };
  }
  return { ok: true };
}

function validateFinalResultImagePayload(body) {
  const b = body || {};
  if (!b.homeTeam || !String(b.homeTeam).trim()) {
    return { ok: false, error: 'Missing homeTeam or awayTeam' };
  }
  if (!b.awayTeam || !String(b.awayTeam).trim()) {
    return { ok: false, error: 'Missing homeTeam or awayTeam' };
  }
  if (b.homeScore === undefined || b.homeScore === null || Number.isNaN(Number(b.homeScore))) {
    return { ok: false, error: 'Missing or invalid homeScore or awayScore' };
  }
  if (b.awayScore === undefined || b.awayScore === null || Number.isNaN(Number(b.awayScore))) {
    return { ok: false, error: 'Missing or invalid homeScore or awayScore' };
  }
  const hs = Number(b.homeScore);
  const as = Number(b.awayScore);
  if (hs < 0 || as < 0) {
    return { ok: false, error: 'Scores cannot be negative' };
  }
  if (!Array.isArray(b.scorerLines)) {
    return { ok: false, error: 'scorerLines must be an array of strings' };
  }
  if (
    b.scorersUnder !== undefined &&
    b.scorersUnder !== null &&
    b.scorersUnder !== 'home' &&
    b.scorersUnder !== 'away'
  ) {
    return { ok: false, error: 'scorersUnder must be "home" or "away"' };
  }
  return { ok: true };
}

module.exports = {
  validateGoalImagePayload,
  validateLineupPayload,
  validateFinalResultImagePayload,
};
