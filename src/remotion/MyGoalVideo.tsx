import React from 'react';
import {AbsoluteFill, Video} from 'remotion';
import './MyGoalVideo.css';

export type MyGoalVideoProps = {
  playerName: string;
  goalClip: string;
  overlayImage?: string;
  textColor?: string;
  titleSize?: number;
  playerSize?: number;
  textShadow?: string;
};

export const MyGoalVideo: React.FC<MyGoalVideoProps> = ({
  playerName,
  goalClip,
  overlayImage,
  textColor = 'white',
  titleSize = 80,
  playerSize = 60,
  textShadow = '0 0 10px black',
}) => {
  return (
    <AbsoluteFill>
      <Video
        src={goalClip}
        style={{
          objectFit: 'cover',
          zIndex: 0,
          width: '100%',
          height: '100%',
        }}
      />
      {overlayImage && (
        <img src={overlayImage} className="overlay-image" />
      )}
      <AbsoluteFill
        className="goal-container"
        style={{
          '--text-color': textColor,
          '--title-size': `${titleSize}px`,
          '--player-size': `${playerSize}px`,
          '--text-shadow': textShadow,
        } as React.CSSProperties}
      >
        <div className="goal-text goal-title">GOOOOAL!</div>
        <div className="goal-text player-name">{playerName}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
