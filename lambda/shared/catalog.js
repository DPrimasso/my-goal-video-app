const catalog = require('./catalog.json');

const playersById = new Map(catalog.players.map((player) => [player.id, Object.freeze(player)]));
const teamsById = new Map(catalog.teams.map((team) => [team.id, Object.freeze(team)]));

function getPlayer(playerId) {
  return playersById.get(playerId);
}

function getTeam(teamId) {
  return teamsById.get(teamId);
}

module.exports = {
  catalog: Object.freeze(catalog),
  getPlayer,
  getTeam,
};
