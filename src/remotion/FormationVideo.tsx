import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useVideoConfig} from 'remotion';
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

export const FormationVideo: React.FC<FormationVideoProps> = ({
                                                                goalkeeper,
                                                                defenders,
                                                                midfielders,
                                                                forwards,
                                                              }) => {
  const {fps} = useVideoConfig();
  const slot = fps; // 1 second per item
  const groups = [
    {title: 'Portiere', players: [goalkeeper]},
    {title: 'Difensori', players: defenders},
    {title: 'Centrocampisti', players: midfielders},
    {title: 'Attaccanti', players: forwards},
  ];

  let current = 0;
  const sequences: React.ReactNode[] = [];

  groups.forEach(({title, players}) => {
    sequences.push(
        <Sequence from={current} durationInFrames={slot} key={`title-${current}`}>
          <AbsoluteFill className="group-title">{title}</AbsoluteFill>
        </Sequence>
    );
    current += slot;
    players.forEach((p, i) => {
      sequences.push(
          <Sequence from={current} durationInFrames={slot} key={`player-${current}`}>
            <AbsoluteFill className="player-container">
              <Img src={staticFile(p.image)} className="player-image" />
              <div>{p.name}</div>
            </AbsoluteFill>
          </Sequence>
      );
      current += slot;
    });
  });

  return (
      <AbsoluteFill>
        <Img src={staticFile('field.svg')} className="field-image" />
        {sequences}
      </AbsoluteFill>
  );
};