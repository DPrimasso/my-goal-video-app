export interface Team {
  id: string;
  name: string;
  logo: string; // relative path in public folder
}

const assetBase = process.env.REACT_APP_ASSET_BASE || '';
const asset = (p: string) => (assetBase ? `${assetBase}/${p}` : p);

export const teams: Team[] = [
  { id: 'casalpoglio', name: 'Casalpoglio', logo: asset('logo_casalpoglio.png') },
  { id: 'amatori_club', name: 'Amatori Club', logo: asset('logo_amatori_club.png') },
  { id: 'team2', name: 'Team 2', logo: asset('logo192.png') },
];

export default teams;
