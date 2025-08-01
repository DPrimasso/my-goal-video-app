import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MyGoalVideo, MyGoalVideoProps} from './MyGoalVideo';

const RemotionRoot: React.FC = () => {
  const defaultProps: MyGoalVideoProps = {
    playerName: 'Player Name',
    goalClip: '/clips/sample.mp4',
  };

  return (
    <>
      <Composition
        id="GoalComp"
        component={MyGoalVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};

registerRoot(RemotionRoot);
