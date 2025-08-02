export interface Team {
  id: string;
  name: string;
  logo: string; // relative path in public folder
}

export const teams: Team[] = [
  { id: 'casalpoglio', name: 'Casalpoglio', logo: 'logo_casalpoglio.png' },
  { id: 'amatori_club', name: 'Amatori Club', logo: 'logo_amatori_club.png' },
  { id: 'team2', name: 'Team 2', logo: 'logo192.png' },
];

export default teams;
