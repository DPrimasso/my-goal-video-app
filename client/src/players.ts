export interface Player {
  id: string;
  name: string;
  image: string;
}

// Funzione per ottenere l'immagine del giocatore o l'immagine di default
export const getPlayerImage = (playerName: string): string => {
  // Converti il nome in formato filename (lowercase, underscore)
  const filename = playerName.toLowerCase().replace(/\s+/g, '_');
  const imagePath = `/players/${filename}.png`;
  
  // Lista delle immagini disponibili
  const availableImages = [
    'davide_fava',
    'lorenzo_campagnari', 
    'davide_scalmana'
  ];
  
  // Se l'immagine esiste, restituiscila, altrimenti usa quella di default
  if (availableImages.includes(filename)) {
    return imagePath;
  }
  
  return `/players/default_player.png`;
};

// Funzione per ottenere solo il cognome del giocatore
export const getSurname = (fullName: string): string => {
  const nameParts = fullName.split(' ');
  // Prendi tutti i pezzi tranne il primo (nome)
  return nameParts.slice(1).join(' ') || fullName;
};

export const players: Player[] = [
  // Giocatori esistenti
  {
    id: 'davide_fava',
    name: 'Davide Fava',
    image: getPlayerImage('Davide Fava'),
  },
  {
    id: 'lorenzo_campagnari',
    name: 'Lorenzo Campagnari',
    image: getPlayerImage('Lorenzo Campagnari'),
  },
  {
    id: 'davide_scalmana',
    name: 'Davide Scalmana',
    image: getPlayerImage('Davide Scalmana'),
  },
  {
    id: 'saif_ardhaoui',
    name: 'Saif Ardhaoui',
    image: getPlayerImage('Saif Ardhaoui'),
  },
  {
    id: 'nicolo_castellini',
    name: 'Nicolò Castellini',
    image: getPlayerImage('Nicolò Castellini'),
  },
  {
    id: 'andrea_contesini',
    name: 'Andrea Contesini',
    image: getPlayerImage('Andrea Contesini'),
  },
  {
    id: 'davide_di_roberto',
    name: 'Davide Di Roberto',
    image: getPlayerImage('Davide Di Roberto'),
  },
  {
    id: 'francesco_gabusi',
    name: 'Francesco Gabusi',
    image: getPlayerImage('Francesco Gabusi'),
  },
  {
    id: 'massimiliano_gandellini',
    name: 'Massimiliano Gandellini',
    image: getPlayerImage('Massimiliano Gandellini'),
  },
  {
    id: 'lorenzo_gobbi',
    name: 'Lorenzo Gobbi',
    image: getPlayerImage('Lorenzo Gobbi'),
  },
  {
    id: 'antonio_inglese',
    name: 'Antonio Inglese',
    image: getPlayerImage('Antonio Inglese'),
  },
  {
    id: 'vase_jakimovski',
    name: 'Vase Jakimovski',
    image: getPlayerImage('Vase Jakimovski'),
  },
  {
    id: 'filippo_lodetti',
    name: 'Filippo Lodetti',
    image: getPlayerImage('Filippo Lodetti'),
  },
  {
    id: 'braian_marchi',
    name: 'Braian Marchi',
    image: getPlayerImage('Braian Marchi'),
  },
  {
    id: 'vincenzo_marino',
    name: 'Vincenzo Marino',
    image: getPlayerImage('Vincenzo Marino'),
  },
  {
    id: 'rosario_nastasi',
    name: 'Rosario Nastasi',
    image: getPlayerImage('Rosario Nastasi'),
  },
  {
    id: 'david_perosi',
    name: 'David Perosi',
    image: getPlayerImage('David Perosi'),
  },
  {
    id: 'michael_pezzi',
    name: 'Michael Pezzi',
    image: getPlayerImage('Michael Pezzi'),
  },
  {
    id: 'lorenzo_piccinelli',
    name: 'Lorenzo Piccinelli',
    image: getPlayerImage('Lorenzo Piccinelli'),
  },
  {
    id: 'matteo_pinelli',
    name: 'Matteo Pinelli',
    image: getPlayerImage('Matteo Pinelli'),
  },
  {
    id: 'sebastiano_pretto',
    name: 'Sebastiano Pretto',
    image: getPlayerImage('Sebastiano Pretto'),
  },
  {
    id: 'daniele_primasso',
    name: 'Daniele Primasso',
    image: getPlayerImage('Daniele Primasso'),
  },
  {
    id: 'cristian_ramponi',
    name: 'Cristian Ramponi',
    image: getPlayerImage('Cristian Ramponi'),
  },
  {
    id: 'fabio_rampulla',
    name: 'Fabio Rampulla',
    image: getPlayerImage('Fabio Rampulla'),
  },
  {
    id: 'daniele_rossetto',
    name: 'Daniele Rossetto',
    image: getPlayerImage('Daniele Rossetto'),
  },
  {
    id: 'andrea_serpellini',
    name: 'Andrea Serpellini',
    image: getPlayerImage('Andrea Serpellini'),
  },
  {
    id: 'davide_sipolo',
    name: 'Davide Sipolo',
    image: getPlayerImage('Davide Sipolo'),
  },
  {
    id: 'marco_turini',
    name: 'Marco Turini',
    image: getPlayerImage('Marco Turini'),
  },
  {
    id: 'alberto_viola',
    name: 'Alberto Viola',
    image: getPlayerImage('Alberto Viola'),
  },
];

export default players;
