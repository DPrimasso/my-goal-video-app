import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MyGoalVideo, MyGoalVideoProps} from './MyGoalVideo';
import {FormationVideo, FormationVideoProps} from './FormationVideo';
import {players} from '../players';

const RemotionRoot: React.FC = () => {
  const defaultProps: MyGoalVideoProps = {
    playerName: 'Player Name',
    minuteGoal: '90+2',
    goalClip: 'clips/goal.mp4',
    overlayImage: 'logo192.png',
  };

  const mapFormationPlayer = (p: {name: string; image: string}) => ({
    name: p.name,
    image: p.image,
  });

  const formationDefaults: FormationVideoProps = {
    goalkeeper: mapFormationPlayer(players[0] || {name: '', image: ''}),
    defenders: [players[1], players[2], players[0], players[1]]
      .filter(Boolean)
      .map(mapFormationPlayer),
    midfielders: [players[2], players[0], players[1], players[2]]
      .filter(Boolean)
      .map(mapFormationPlayer),
    forwards: [players[0], players[1]].filter(Boolean).map(mapFormationPlayer),
  };

  return (
    <>
        <Composition<any, MyGoalVideoProps>
            id="GoalComp"
            component={MyGoalVideo}
            durationInFrames={150}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={defaultProps}
        />
        <Composition<any, FormationVideoProps>
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
