export interface Player {
  id: string;
  name: string;
  image: string;
}

const assetBase = process.env.REACT_APP_ASSET_BASE || '';
const asset = (p: string) => (assetBase ? `${assetBase}/${p}` : p);

export const players: Player[] = [
  {
    id: 'davide_fava',
    name: 'Davide Fava',
    image: asset('players/davide_fava.png'),
  },
  {
    id: 'lorenzo_campagnari',
    name: 'Lorenzo Campagnari',
    image: asset('players/lorenzo_campagnari.png'),
  },
  {
    id: 'davide_scalmana',
    name: 'Davide Scalmana',
    image: asset('players/davide_scalmana.png'),
  },
];

export default players;
