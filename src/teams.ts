export interface Team {
  id: string;
  name: string;
  logo: string;
}

const ASSET_BASE = process.env.REACT_APP_ASSET_BASE;

export const teams: Team[] = [
  { id: 'casalpoglio', name: 'Casalpoglio', logo: `${ASSET_BASE}/logo_casalpoglio.png` },
  { id: 'amatori_club', name: 'Amatori Club', logo: `${ASSET_BASE}/logo_amatori_club.png` },
  { id: 'team2', name: 'Team 2', logo: `${ASSET_BASE}/logo192.png` },
];

export default teams;
