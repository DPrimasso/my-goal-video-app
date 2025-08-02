export interface Player {
  id: string;
  name: string;
  image: string;
}

export const players: Player[] = [
  {
    id: 'davide_fava',
    name: 'Davide Fava',
    image: 'players/davide_fava.png',
  },
  {
    id: 'lorenzo_campagnari',
    name: 'Lorenzo Campagnari',
    image: 'players/lorenzo_campagnari.png',
  },
  {
    id: 'davide_scalmana',
    name: 'Davide Scalmana',
    image: 'players/davide_scalmana.png',
  },
];

export default players;
