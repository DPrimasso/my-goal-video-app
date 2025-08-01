import React from 'react';
import {AbsoluteFill, Video} from 'remotion';

export type MyGoalVideoProps = {
  playerName: string;
  goalClip: string;
};

export const MyGoalVideo: React.FC<MyGoalVideoProps> = ({playerName, goalClip}) => {
  return (
    <AbsoluteFill>
      <Video src={goalClip} />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: 80,
          fontWeight: 'bold',
          textShadow: '0 0 10px black',
          textAlign: 'center',
        }}
      >
        <div>GOOOOAL!</div>
        <div style={{fontSize: 60}}>{playerName}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
