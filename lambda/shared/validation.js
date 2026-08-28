const { getPlayer } = require('./catalog');
const { HttpError } = require('./http');

function text(value, field, maxLength = 80) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new HttpError(400, 'INVALID_FIELD', `${field} è obbligatorio.`);
  if (normalized.length > maxLength) throw new HttpError(400, 'INVALID_FIELD', `${field} supera ${maxLength} caratteri.`);
  return normalized;
}

function integer(value, field, minimum, maximum) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < minimum || normalized > maximum) {
    throw new HttpError(400, 'INVALID_FIELD', `${field} deve essere un intero compreso tra ${minimum} e ${maximum}.`);
  }
  return normalized;
}

function differentTeams(homeTeam, awayTeam) {
  if (homeTeam.localeCompare(awayTeam, 'it', { sensitivity: 'accent' }) === 0) {
    throw new HttpError(400, 'SAME_TEAMS', 'Le due squadre devono essere differenti.');
  }
}

function validateGoal(payload) {
  const playerId = text(payload.playerId, 'playerId', 64);
  const player = getPlayer(playerId);
  if (!player) throw new HttpError(400, 'UNKNOWN_PLAYER', 'Il giocatore selezionato non esiste nel catalogo.');
  const homeTeam = text(payload.homeTeam, 'homeTeam');
  const awayTeam = text(payload.awayTeam, 'awayTeam');
  differentTeams(homeTeam, awayTeam);
  const homeScore = integer(payload.homeScore, 'homeScore', 0, 99);
  const awayScore = integer(payload.awayScore, 'awayScore', 0, 99);
  if (homeScore === 0 && awayScore === 0) throw new HttpError(400, 'INVALID_SCORE', 'Il parziale deve contenere almeno un gol.');
  return { player, minuteGoal: integer(payload.minuteGoal, 'minuteGoal', 1, 150), homeTeam, homeScore, awayTeam, awayScore };
}

function validateLineup(payload) {
  if (!Array.isArray(payload.players) || payload.players.length !== 11) {
    throw new HttpError(400, 'INVALID_LINEUP', 'La formazione deve contenere esattamente undici giocatori.');
  }
  const players = payload.players.map((entry, index) => {
    const playerId = text(entry?.playerId, `players[${index}].playerId`, 64);
    const player = getPlayer(playerId);
    if (!player) throw new HttpError(400, 'UNKNOWN_PLAYER', `Il giocatore in posizione ${index + 1} non esiste nel catalogo.`);
    return { player, number: integer(entry.number, `players[${index}].number`, 1, 99), isCaptain: Boolean(entry.isCaptain) };
  });
  if (new Set(players.map((entry) => entry.player.id)).size !== 11) {
    throw new HttpError(400, 'DUPLICATE_PLAYERS', 'Ogni giocatore può comparire una sola volta.');
  }
  if (players.filter((entry) => entry.isCaptain).length > 1) {
    throw new HttpError(400, 'MULTIPLE_CAPTAINS', 'È possibile selezionare un solo capitano.');
  }
  return { players, opponentTeam: text(payload.opponentTeam, 'opponentTeam') };
}

function validateFinalResult(payload) {
  const homeTeam = text(payload.homeTeam, 'homeTeam');
  const awayTeam = text(payload.awayTeam, 'awayTeam');
  differentTeams(homeTeam, awayTeam);
  const homeScore = integer(payload.homeScore, 'homeScore', 0, 99);
  const awayScore = integer(payload.awayScore, 'awayScore', 0, 99);
  if (!Array.isArray(payload.scorerLines) || payload.scorerLines.length > 40) {
    throw new HttpError(400, 'INVALID_SCORERS', 'scorerLines deve contenere al massimo 40 righe.');
  }
  const scorerLines = payload.scorerLines.map((line, index) => text(line, `scorerLines[${index}]`, 80));
  const scorersUnder = payload.scorersUnder;
  if (scorersUnder !== 'home' && scorersUnder !== 'away') {
    throw new HttpError(400, 'INVALID_FIELD', 'scorersUnder deve essere home oppure away.');
  }
  return { homeTeam, awayTeam, homeScore, awayScore, scorerLines, scorersUnder };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { validateGoal, validateLineup, validateFinalResult, escapeHtml };
