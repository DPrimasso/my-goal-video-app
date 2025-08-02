import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MyGoalVideo, MyGoalVideoProps} from './MyGoalVideo';
import {FormationVideo, FormationVideoProps} from './FormationVideo';

const RemotionRoot: React.FC = () => {
  const defaultProps: MyGoalVideoProps = {
    playerName: 'Player Name',
    minuteGoal: '90+2',
    goalClip: 'clips/goal.mp4',
    overlayImage: 'logo192.png',
  };

  const formationDefaults: FormationVideoProps = {
    goalkeeper: { name: 'Portiere', image: 'players/davide_fava.png' },
    defenders: [],
    midfielders: [],
    forwards: [],
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
      <Composition
        id="FormationComp"
        component={FormationVideo}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={formationDefaults}
      />
    </>
  );
};

registerRoot(RemotionRoot);
