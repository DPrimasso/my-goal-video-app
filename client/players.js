const players = [
  // Giocatori esistenti
  {
    id: 'davide_fava',
    name: 'Davide Fava',
    image: 'players/davide_fava.png',
    position: 'forward'
  },
  {
    id: 'lorenzo_campagnari',
    name: 'Lorenzo Campagnari',
    image: 'players/lorenzo_campagnari.png',
    position: 'midfielder'
  },
  {
    id: 'davide_scalmana',
    name: 'Davide Scalmana',
    image: 'players/davide_scalmana.png',
    position: 'goalkeeper'
  },
  
  // Nuovi giocatori
  {
    id: 'saif_ardhaoui',
    name: 'Saif Ardhaoui',
    image: 'players/saif_ardhaoui.png',
    position: 'forward'
  },
  {
    id: 'nicolo_castellini',
    name: 'Nicolò Castellini',
    image: 'players/nicolo_castellini.png',
    position: 'midfielder'
  },
  {
    id: 'andrea_contesini',
    name: 'Andrea Contesini',
    image: 'players/andrea_contesini.png',
    position: 'defender'
  },
  {
    id: 'davide_di_roberto',
    name: 'Davide Di Roberto',
    image: 'players/davide_di_roberto.png',
    position: 'midfielder'
  },
  {
    id: 'francesco_gabusi',
    name: 'Francesco Gabusi',
    image: 'players/francesco_gabusi.png',
    position: 'forward'
  },
  {
    id: 'massimiliano_gandellini',
    name: 'Massimiliano Gandellini',
    image: 'players/massimiliano_gandellini.png',
    position: 'defender'
  },
  {
    id: 'lorenzo_gobbi',
    name: 'Lorenzo Gobbi',
    image: 'players/lorenzo_gobbi.png',
    position: 'midfielder'
  },
  {
    id: 'davide_goffi',
    name: 'Davide Goffi',
    image: 'players/davide_goffi.png',
    position: 'defender'
  },
  {
    id: 'antonio_inglese',
    name: 'Antonio Inglese',
    image: 'players/antonio_inglese.png',
    position: 'midfielder'
  },
  {
    id: 'vase_jakimovski',
    name: 'Vase Jakimovski',
    image: 'players/vase_jakimovski.png',
    position: 'forward'
  },
  {
    id: 'filippo_lodetti',
    name: 'Filippo Lodetti',
    image: 'players/filippo_lodetti.png',
    position: 'midfielder'
  },
  {
    id: 'braian_marchi',
    name: 'Braian Marchi',
    image: 'players/braian_marchi.png',
    position: 'forward'
  },
  {
    id: 'vincenzo_marino',
    name: 'Vincenzo Marino',
    image: 'players/vincenzo_marino.png',
    position: 'defender'
  },
  {
    id: 'rosario_nastasi',
    name: 'Rosario Nastasi',
    image: 'players/rosario_nastasi.png',
    position: 'midfielder'
  },
  {
    id: 'david_perosi',
    name: 'David Perosi',
    image: 'players/david_perosi.png',
    position: 'forward'
  },
  {
    id: 'michael_pezzi',
    name: 'Michael Pezzi',
    image: 'players/michael_pezzi.png',
    position: 'midfielder'
  },
  {
    id: 'lorenzo_piccinelli',
    name: 'Lorenzo Piccinelli',
    image: 'players/lorenzo_piccinelli.png',
    position: 'defender'
  },
  {
    id: 'matteo_pinelli',
    name: 'Matteo Pinelli',
    image: 'players/matteo_pinelli.png',
    position: 'midfielder'
  },
  {
    id: 'sebastiano_pretto',
    name: 'Sebastiano Pretto',
    image: 'players/sebastiano_pretto.png',
    position: 'forward'
  },
  {
    id: 'daniele_primasso',
    name: 'Daniele Primasso',
    image: 'players/daniele_primasso.png',
    position: 'defender'
  },
  {
    id: 'cristian_ramponi',
    name: 'Cristian Ramponi',
    image: 'players/cristian_ramponi.png',
    position: 'midfielder'
  },
  {
    id: 'fabio_rampulla',
    name: 'Fabio Rampulla',
    image: 'players/fabio_rampulla.png',
    position: 'defender'
  },
  {
    id: 'daniele_rossetto',
    name: 'Daniele Rossetto',
    image: 'players/daniele_rossetto.png',
    position: 'midfielder'
  },
  {
    id: 'andrea_serpellini',
    name: 'Andrea Serpellini',
    image: 'players/andrea_serpellini.png',
    position: 'defender'
  },
  {
    id: 'davide_sipolo',
    name: 'Davide Sipolo',
    image: 'players/davide_sipolo.png',
    position: 'forward'
  },
  {
    id: 'marco_turini',
    name: 'Marco Turini',
    image: 'players/marco_turini.png',
    position: 'midfielder'
  },
  {
    id: 'marco_vaccari',
    name: 'Marco Vaccari',
    image: 'players/marco_vaccari.png',
    position: 'midfielder'
  },
  {
    id: 'alberto_viola',
    name: 'Alberto Viola',
    image: 'players/alberto_viola.png',
    position: 'defender'
  }
];

const getSurname = (fullName) => {
  return fullName.split(' ').pop();
};

module.exports = {
  players,
  getSurname
};
