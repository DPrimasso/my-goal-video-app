export interface Team {
  id: string;
  name: string;
  logo: string; // relative path in public folder
}

export const teams: Team[] = [
  { id: 'casalpoglio', name: 'Casalpoglio', logo: 'logo192.png' },
  { id: 'team1', name: 'Team 1', logo: 'logo192.png' },
  { id: 'team2', name: 'Team 2', logo: 'logo192.png' },
];

export default teams;
