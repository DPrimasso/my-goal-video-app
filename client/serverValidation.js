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

module.exports = {
  validateGoalImagePayload,
  validateLineupPayload,
};
