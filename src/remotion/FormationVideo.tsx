import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import './FormationVideo.css';

export interface FormationPlayer {
  name: string;
  image: string;
}

export interface FormationVideoProps extends Record<string, unknown> {
  goalkeeper: FormationPlayer;
  defenders: FormationPlayer[];
  midfielders: FormationPlayer[];
  forwards: FormationPlayer[];
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
      <div>{player.name}</div>
    </div>
  );
};

const GroupIntro: React.FC<{
  players: FormationPlayer[];
  finalPositions: PlayerPosition[];
}> = ({players, finalPositions}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const progress = spring({frame, fps, config: {damping: 200}});

  const lineY = height - 200;

  return (
    <>
      {players.map((p, i) => {
        const startX = width / 2 + (i - (players.length - 1) / 2) * 180;
        const startY = lineY;
        const end = finalPositions[i];
        const x = interpolate(progress, [0, 1], [startX, end.x]);
        const y = interpolate(progress, [0, 1], [startY, end.y]);
        const scale = interpolate(progress, [0, 1], [2, 1]);
        return <PlayerVisual key={i} player={p} x={x} y={y} scale={scale} />;
      })}
    </>
  );
};

export const FormationVideo: React.FC<FormationVideoProps> = ({
  goalkeeper,
  defenders,
  midfielders,
  forwards,
}) => {
  const {fps, width, height} = useVideoConfig();
  const intro = fps; // initial empty field
  const groupDuration = fps * 3; // 3 seconds per group

  const positions = {
    goalkeeper: [{x: width / 2, y: height - 300}],
    defenders: defenders.map((_, i) => ({x: ((i + 1) * width) / (defenders.length + 1), y: height - 600})),
    midfielders: midfielders.map((_, i) => ({x: ((i + 1) * width) / (midfielders.length + 1), y: height - 1000})),
    forwards: forwards.map((_, i) => ({x: ((i + 1) * width) / (forwards.length + 1), y: height - 1400})),
  };

  let current = intro;
  const sequences: React.ReactNode[] = [];

  sequences.push(
    <Sequence from={current} durationInFrames={groupDuration} key="goalkeeper">
      <GroupIntro players={[goalkeeper]} finalPositions={positions.goalkeeper} />
    </Sequence>
  );
  current += groupDuration;

  if (defenders.length) {
    sequences.push(
      <Sequence from={current} durationInFrames={groupDuration} key="defenders">
        <GroupIntro players={defenders} finalPositions={positions.defenders} />
      </Sequence>
    );
    current += groupDuration;
  }

  if (midfielders.length) {
    sequences.push(
      <Sequence from={current} durationInFrames={groupDuration} key="midfielders">
        <GroupIntro players={midfielders} finalPositions={positions.midfielders} />
      </Sequence>
    );
    current += groupDuration;
  }

  if (forwards.length) {
    sequences.push(
      <Sequence from={current} durationInFrames={groupDuration} key="forwards">
        <GroupIntro players={forwards} finalPositions={positions.forwards} />
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
