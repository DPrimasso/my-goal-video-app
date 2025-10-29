import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MyGoalVideo, MyGoalVideoProps} from './MyGoalVideo';
import {FinalResultVideo, FinalResultVideoProps} from './FinalResultVideo';
import {FormationVideo} from '../archived/FormationVideo';
import {Ping} from './Ping';

const RemotionRoot: React.FC = () => {
  const defaultProps: MyGoalVideoProps = {
    playerName: 'Player Name',
    minuteGoal: '90+2',
    // Usa un asset locale del site per il preview; a runtime potrai passare s3PlayerUrl
    goalClip: 'clips/goal.mp4',
    overlayImage: 'logo192.png',
    // URL completo (pubblico o presigned) dell'immagine del giocatore; vuoto nel preview
    s3PlayerUrl: '',
    partialScore: '2-1',
  };

  return (
    <>
        <Composition<any, MyGoalVideoProps>
            id="GoalComp"
            component={MyGoalVideo}
            durationInFrames={300}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={defaultProps}
        />
        <Composition<any, FinalResultVideoProps>
            id="FinalResultComp"
            component={FinalResultVideo}
            durationInFrames={300}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{
              teamA: {name: '', logo: ''},
              teamB: {name: '', logo: ''},
              scoreA: 0,
              scoreB: 0,
              scorers: [],
              casalpoglioIsHome: false,
              casalpoglioIsAway: false,
            }}
        />
        <Composition
            id="FormationComp"
            component={FormationVideo}
            durationInFrames={300}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{
              goalkeeper: {name: '', image: 'players/default_player.png'},
              defenders: [],
              midfielders: [],
              attackingMidfielders: [],
              forwards: [],
            }}
        />
        <Composition
            id="PingComp"
            component={Ping}
            durationInFrames={90}
            fps={30}
            width={1280}
            height={720}
        />
    </>
  );
};

registerRoot(RemotionRoot);
