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
    name: p.name.split(" ")[1], // Use only the last name
    image: p.image,
  });

  const formationDefaults: FormationVideoProps = {
    goalkeeper: mapFormationPlayer(players[0] || {name: '', image: ''}),
    defenders: [players[1], players[2], players[0], players[1], null]
      .map((p) => (p ? mapFormationPlayer(p) : null)),
    midfielders: [null, players[2], players[0], players[1], null]
      .map((p) => (p ? mapFormationPlayer(p) : null)),
    attackingMidfielders: [null, players[1], null].map((p) =>
      p ? mapFormationPlayer(p) : null
    ),
    forwards: [players[0], null, players[2]]
      .map((p) => (p ? mapFormationPlayer(p) : null)),
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
