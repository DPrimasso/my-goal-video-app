export interface Player {
  id: string;
  name: string;
  image: string;
}

export const players: Player[] = [
  {
    id: 'messi',
    name: 'Lionel Messi',
    image: '/logo192.png',
  },
  {
    id: 'ronaldo',
    name: 'Cristiano Ronaldo',
    image: '/logo512.png',
  },
];

export default players;
