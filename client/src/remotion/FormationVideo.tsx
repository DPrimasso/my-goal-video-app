import React from 'react';
import {AbsoluteFill, Img, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile} from 'remotion';
import {resolveAsset} from './resolveAsset';
import './FormationVideo.css';

export interface FormationPlayer {
  name: string;
  image: string;
}

export interface FormationVideoProps extends Record<string, unknown> {
  goalkeeper: FormationPlayer;
  defenders: (FormationPlayer | null)[];
  midfielders: (FormationPlayer | null)[];
  attackingMidfielders: (FormationPlayer | null)[];
  forwards: (FormationPlayer | null)[];
}

interface PlayerPosition {
  x: number;
  y: number;
}

const PlayerVisual: React.FC<{player: FormationPlayer; x: number; y: number; imageScale: number; nameScale: number, nameMarginTop: number; zIndex: number; blur: number}> = ({player, x, y, imageScale, nameScale, nameMarginTop, zIndex, blur}) => {
  // Protezione per assicurarsi che player.name sia sempre definito
  const playerName = player?.name || 'Unknown Player';
  
  return (
    <div
      className="player-container"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%)`,
        zIndex: zIndex,
        filter: `blur(${blur}px)`,
      }}
    >
      <Img 
        src={staticFile(player.image)} 
        className="player-image" 
        style={{
          transform: `scale(${imageScale})`,
        }}
      />
      <div 
        className="player-name"
        style={{
          transform: `scale(${nameScale})`,
          marginTop: `${nameMarginTop}px`, // Distanza fissa basata sulla scala del nome
        }}
      >
        {playerName.split(' ').pop()}
      </div>
    </div>
  );
};

const GroupIntro: React.FC<{
  players: (FormationPlayer | null)[];
  finalPositions: PlayerPosition[];
  duration: number;
  finalBlur: number;
}> = ({players, finalPositions, duration, finalBlur}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  
  // I giocatori rimangono fermi al centro per 2 secondi
  const holdDuration = fps * 2;
  const moveDuration = duration - holdDuration;
  
  // Progress per la fase di movimento (dopo i 2 secondi di attesa)
  const moveProgress = frame < holdDuration ? 0 : 
    spring({
      frame: frame - holdDuration, 
      fps, 
      durationInFrames: moveDuration, 
      config: {damping: 100} // Ridotto ulteriormente per velocizzare ancora di più
    });

  // Posizione centrale dello schermo dove appaiono i giocatori
  const centerX = width / 2;
  const centerY = height / 2;

  // Filtra i giocatori validi e mantieni la loro posizione originale nell'array
  const validPlayersWithPositions = players
    .map((player, originalIndex) => ({player, originalIndex}))
    .filter((item): item is {player: FormationPlayer; originalIndex: number} => item.player !== null);

  // DEBUG: Log della mappatura
  console.log('🔍 REMOTION DEBUG - Players mapping:');
  validPlayersWithPositions.forEach(({player, originalIndex}) => {
    console.log(`  ${player.name}: originalIndex=${originalIndex}, finalPosition=${JSON.stringify(finalPositions[originalIndex])}`);
  });

  return (
    <>
      {validPlayersWithPositions.map(({player, originalIndex}, i) => {
        // Usa la posizione originale nell'array per mappare correttamente alle posizioni finali
        const end = finalPositions[originalIndex];
        
        // Calcola la posizione iniziale in riga al centro con più spazio
        const totalPlayers = validPlayersWithPositions.length;
        const spacing = 250; // Spazio ridotto per evitare sovrapposizioni
        const startX = centerX + (i - (totalPlayers - 1) / 2) * spacing;
        const startY = centerY;
        
        // I giocatori partono dalla riga centrale e vanno alla posizione finale
        const x = interpolate(moveProgress, [0, 1], [startX, end.x], {extrapolateRight: 'clamp'});
        const y = interpolate(moveProgress, [0, 1], [startY, end.y], {extrapolateRight: 'clamp'});
        
        // Scala: partono grandi (2x) e finiscono piccoli (0.5x) - solo per l'immagine
        const imageScale = interpolate(moveProgress, [0, 1], [2, 1], {extrapolateRight: 'clamp'});
        
        // Nome: mantiene sempre la stessa dimensione
        const nameScale = 1;
        const nameMarginTop = interpolate(moveProgress, [0, 1], [40, 5], {extrapolateRight: 'clamp'});
        
        // Z-index: i giocatori sono sempre sopra la sfocatura, ma la sfocatura viene applicata direttamente a loro
        const zIndex = 10;
        // Sfocatura applicata direttamente ai giocatori: durante il movimento + fade out finale
        const playerBlur = moveProgress < 0.5 ? 0 : finalBlur;
        
        return <PlayerVisual key={`${originalIndex}-${player.name}`} player={player} x={x} y={y} imageScale={imageScale} nameScale={nameScale} nameMarginTop={nameMarginTop} zIndex={zIndex} blur={playerBlur} />;
      })}
    </>
  );
};

// Componente per l'effetto sfocato
const BlurOverlay: React.FC<{blurIntensity: number}> = ({blurIntensity}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backdropFilter: `blur(${blurIntensity}px)`,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export const FormationVideo: React.FC<FormationVideoProps> = ({
  goalkeeper,
  defenders,
  midfielders,
  attackingMidfielders,
  forwards,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  
  const intro = fps; // initial empty field
  const groupDuration = fps * 3; // 3 secondi per gruppo - modifica questo valore per cambiare la durata

  const positions = {
    goalkeeper: [{x: width / 2, y: height - 300}],
    defenders: [
      {x: width * 0.1, y: height - 700},
      {x: width * 0.35, y: height - 600},
      {x: width * 0.5, y: height - 700},
      {x: width * 0.65, y: height - 600},
      {x: width * 0.9, y: height - 700},
    ],
    midfielders: [
      {x: width * 0.1, y: height - 1000},
      {x: width * 0.35, y: height - 900},
      {x: width * 0.5, y: height - 800},
      {x: width * 0.65, y: height - 900},
      {x: width * 0.9, y: height - 1000},
    ],
    attackingMidfielders: [
      {x: width * 0.3, y: height - 1100},
      {x: width * 0.5, y: height - 1100},
      {x: width * 0.7, y: height - 1100},
    ],
    forwards: [
      {x: width * 0.1, y: height - 1300}, // Esterno sx
      {x: width * 0.3, y: height - 1400}, // Attaccante sx
      {x: width * 0.5, y: height - 1400}, // Attaccante cr
      {x: width * 0.7, y: height - 1400}, // Attaccante dx
      {x: width * 0.9, y: height - 1300}, // Esterno dx
    ],
  };

  // Calcola la durata totale prima per poter calcolare il blur finale
  let current = intro;
  let totalDuration = current;
  
  // Calcola la durata totale
  totalDuration += groupDuration; // goalkeeper
  if (defenders.some(player => player !== null)) totalDuration += groupDuration;
  if (midfielders.some(player => player !== null)) totalDuration += groupDuration;
  if (attackingMidfielders.some(player => player !== null)) totalDuration += groupDuration;
  if (forwards.some(player => player !== null)) totalDuration += groupDuration;
  
  // Calcola l'intensità della sfocatura finale
  const blurFadeOutStart = totalDuration - fps * 2; // Inizia a ridurre la sfocatura 2 secondi prima della fine
  const blurFadeOutDuration = fps * 2; // 2 secondi per rimuovere completamente la sfocatura
  
  let blurIntensity = 15; // Intensità massima della sfocatura
  
  if (frame >= blurFadeOutStart) {
    const fadeProgress = (frame - blurFadeOutStart) / blurFadeOutDuration;
    blurIntensity = interpolate(fadeProgress, [0, 1], [15, 0], {extrapolateRight: 'clamp'});
  }

  current = intro;
  const sequences: React.ReactNode[] = [];

  sequences.push(
    <Sequence from={current} key="goalkeeper">
      <GroupIntro players={[goalkeeper]} finalPositions={positions.goalkeeper} duration={groupDuration} finalBlur={blurIntensity} />
    </Sequence>
  );
  current += groupDuration;

  if (defenders.some(player => player !== null)) {
    sequences.push(
      <Sequence from={current} key="defenders">
        <GroupIntro players={defenders} finalPositions={positions.defenders} duration={groupDuration} finalBlur={blurIntensity} />
      </Sequence>
    );
    current += groupDuration;
  }

  if (midfielders.some(player => player !== null)) {
    sequences.push(
      <Sequence from={current} key="midfielders">
        <GroupIntro players={midfielders} finalPositions={positions.midfielders} duration={groupDuration} finalBlur={blurIntensity} />
      </Sequence>
    );
    current += groupDuration;
  }

  if (attackingMidfielders.some(player => player !== null)) {
    sequences.push(
      <Sequence from={current} key="attackingMidfielders">
        <GroupIntro players={attackingMidfielders} finalPositions={positions.attackingMidfielders} duration={groupDuration} finalBlur={blurIntensity} />
      </Sequence>
    );
    current += groupDuration;
  }

  if (forwards.some(player => player !== null)) {
    sequences.push(
      <Sequence from={current} key="forwards">
        <GroupIntro players={forwards} finalPositions={positions.forwards} duration={groupDuration} finalBlur={blurIntensity} />
      </Sequence>
    );
    current += groupDuration;
  }

  return (
    <AbsoluteFill>
      <Img src={staticFile('campo_da_calcio.png')} className="field-image" />
      <BlurOverlay blurIntensity={blurIntensity} />
      {sequences}
    </AbsoluteFill>
  );
};
