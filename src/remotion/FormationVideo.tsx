import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
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

const PlayerVisual: React.FC<{player: FormationPlayer; x: number; y: number; scale: number}> = ({player, x, y, scale}) => {
  return (
    <div
      className="player-container"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <Img src={staticFile(player.image)} className="player-image" />
      <div className="player-name">{player.name.replace(/\s+/g, '\n')}</div>
    </div>
  );
};

const GroupIntro: React.FC<{
  players: (FormationPlayer | null)[];
  finalPositions: PlayerPosition[];
  duration: number;
}> = ({players, finalPositions, duration}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const progress = spring({frame, fps, durationInFrames: duration, config: {damping: 200}});

  const lineY = height - 200;

  const withPositions = players
    .map((p, idx) => ({player: p, idx}))
    .filter((p): p is {player: FormationPlayer; idx: number} => Boolean(p.player));

  return (
    <>
      {withPositions.map(({player, idx}, i) => {
        const startX = width / 2 + (i - (withPositions.length - 1) / 2) * 180;
        const startY = lineY;
        const end = finalPositions[idx];
        const x = interpolate(progress, [0, 1], [startX, end.x], {extrapolateRight: 'clamp'});
        const y = interpolate(progress, [0, 1], [startY, end.y], {extrapolateRight: 'clamp'});
        const scale = interpolate(progress, [0, 1], [2, 1], {extrapolateRight: 'clamp'});
        return <PlayerVisual key={idx} player={player} x={x} y={y} scale={scale} />;
      })}
    </>
  );
};

export const FormationVideo: React.FC<FormationVideoProps> = ({
  goalkeeper,
  defenders,
  midfielders,
  attackingMidfielders,
  forwards,
}) => {
  const {fps, width, height} = useVideoConfig();
  const intro = fps; // initial empty field
  const groupDuration = fps * 3; // 3 seconds per group

  const positions = {
    goalkeeper: [{x: width / 2, y: height - 300}],
    defenders: [
      {x: width * 0.1, y: height - 600},
      {x: width * 0.3, y: height - 600},
      {x: width * 0.5, y: height - 600},
      {x: width * 0.7, y: height - 600},
      {x: width * 0.9, y: height - 600},
    ],
    midfielders: [
      {x: width * 0.1, y: height - 1000},
      {x: width * 0.3, y: height - 1000},
      {x: width * 0.5, y: height - 1000},
      {x: width * 0.7, y: height - 1000},
      {x: width * 0.9, y: height - 1000},
    ],
    attackingMidfielders: [
      {x: width * 0.3, y: height - 1200},
      {x: width * 0.5, y: height - 1200},
      {x: width * 0.7, y: height - 1200},
    ],
    forwards: [
      {x: width * 0.3, y: height - 1400},
      {x: width * 0.5, y: height - 1400},
      {x: width * 0.7, y: height - 1400},
    ],
  };

  let current = intro;
  const sequences: React.ReactNode[] = [];

  sequences.push(
    <Sequence from={current} key="goalkeeper">
      <GroupIntro players={[goalkeeper]} finalPositions={positions.goalkeeper} duration={groupDuration} />
    </Sequence>
  );
  current += groupDuration;

  if (defenders.some(Boolean)) {
    sequences.push(
      <Sequence from={current} key="defenders">
        <GroupIntro players={defenders} finalPositions={positions.defenders} duration={groupDuration} />
      </Sequence>
    );
    current += groupDuration;
  }

  if (midfielders.some(Boolean)) {
    sequences.push(
      <Sequence from={current} key="midfielders">
        <GroupIntro players={midfielders} finalPositions={positions.midfielders} duration={groupDuration} />
      </Sequence>
    );
    current += groupDuration;
  }

  if (attackingMidfielders.some(Boolean)) {
    sequences.push(
      <Sequence from={current} key="attackingMidfielders">
        <GroupIntro
          players={attackingMidfielders}
          finalPositions={positions.attackingMidfielders}
          duration={groupDuration}
        />
      </Sequence>
    );
    current += groupDuration;
  }

  if (forwards.some(Boolean)) {
    sequences.push(
      <Sequence from={current} key="forwards">
        <GroupIntro players={forwards} finalPositions={positions.forwards} duration={groupDuration} />
      </Sequence>
    );
    current += groupDuration;
  }

  return (
    <AbsoluteFill>
      <Img src={staticFile('campo_da_calcio.jpg')} className="field-image" />
      {sequences}
    </AbsoluteFill>
  );
};
