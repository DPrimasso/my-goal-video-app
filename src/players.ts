export interface Player {
  id: string;
  name: string;
  image: string;
}

const ASSET_BASE = process.env.REACT_APP_ASSET_BASE;

export const players: Player[] = [
  {
    id: 'davide_fava',
    name: 'Davide Fava',
    image: `${ASSET_BASE}/players/davide_fava.png`,
  },
  {
    id: 'lorenzo_campagnari',
    name: 'Lorenzo Campagnari',
    image: `${ASSET_BASE}/players/lorenzo_campagnari.png`,
  },
  {
    id: 'davide_scalmana',
    name: 'Davide Scalmana',
    image: `${ASSET_BASE}/players/davide_scalmana.png`,
  },
];

export default players;
