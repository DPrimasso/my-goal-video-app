import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from 'remotion';
import {resolveAsset} from './resolveAsset';
import './FinalResultVideo.css';

export interface TeamInfo {
  name: string;
  logo: string;
}

export interface FinalResultVideoProps extends Record<string, unknown> {
  teamA: TeamInfo;
  teamB: TeamInfo;
  scoreA: number;
  scoreB: number;
  scorers: string[];
  casalpoglioIsHome?: boolean;
  casalpoglioIsAway?: boolean;
  teamALogoPath?: string; // S3 URL for team A logo
  teamBLogoPath?: string; // S3 URL for team B logo
}

export const FinalResultVideo: React.FC<FinalResultVideoProps> = ({
  teamA,
  teamB,
  scoreA,
  scoreB,
  scorers,
  casalpoglioIsHome = false,
  casalpoglioIsAway = false,
  teamALogoPath,
  teamBLogoPath,
}) => {


  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const delay = fps * 2; // 1 second delay
  const springOpts = {fps, durationInFrames: fps * 2};
  const scoreDelay = 55; // delay for scores after logos
  const playerDelay = 75; // delay for player after logos

  const logoSpring = spring({
    ...springOpts,
    frame: Math.max(0, frame - delay),
  });
  const translateA = interpolate(logoSpring, [0, 1], [-600, 0]);
  const translateB = interpolate(logoSpring, [0, 1], [600, 0]);

  // Appear scores after logos
  const scoreSpring = spring({
    ...springOpts,
    frame: Math.max(0, frame - delay - scoreDelay),
  });
  const currentA = Math.round(
    interpolate(scoreSpring, [0, 1], [0, scoreA])
  );
  const currentB = Math.round(
    interpolate(scoreSpring, [0, 1], [0, scoreB])
  );

  // FIXED ASSET RESOLUTION: Use staticFile directly for Lambda compatibility
  // This ensures assets are properly bundled and accessible in Lambda
  const teamALogo = teamALogoPath || staticFile(teamA.logo);
  const teamBLogo = teamBLogoPath || staticFile(teamB.logo);

  // Force specific logo paths for known teams to ensure they load
  const getTeamLogo = (teamName: string, defaultLogo: string) => {
    if (teamName === 'Amatori Club') {
      return staticFile('logo_amatori_club.png');
    }
    if (teamName === 'Casalpoglio') {
      return staticFile('logo_casalpoglio.png');
    }
    return defaultLogo;
  };

  const finalTeamALogo = getTeamLogo(teamA.name, teamALogo);
  const finalTeamBLogo = getTeamLogo(teamB.name, teamBLogo);



  return (
    <AbsoluteFill>
      <Video
        src={staticFile('final_score.mp4')}
        className="background-video"
      />
      <AbsoluteFill className="result-root">
        <div className="teams-row">
          <div className="team-block">
            <Img
              src={finalTeamALogo}
              className="team-logo"
              style={{transform: `translateX(${translateA}px)`}}
            />
            <div
              className="team-name"
              style={{transform: `translateX(${translateA}px)`}}
            >
              {teamA.name}
            </div>
          </div>
          <div className="team-block">
            <Img
              src={finalTeamBLogo}
              className="team-logo"
              style={{transform: `translateX(${translateB}px)`}}
            />
            <div
              className="team-name"
              style={{transform: `translateX(${translateB}px)`}}
            >
              {teamB.name}
            </div>
          </div>
        </div>
        <div className="score-row">
          <div className="score-block">
            <div className="score-number score-number-1" style={{opacity: scoreSpring}}>
              {currentA}
            </div>
            {/* Show scorers for Casalpoglio if they are the home team */}
            {casalpoglioIsHome && scorers.length > 0 && (
              <div className="scorers-list scorers-list-position-1">
                {scorers.map((s: string, i: number) => {
                  const sSpring = spring({
                    ...springOpts,
                    frame: Math.max(0, frame - delay - playerDelay - i * 15),
                  });
                  const sTrans = interpolate(sSpring, [0, 1], [20, 0]);
                  return (
                    <div
                      key={i}
                      className="scorer"
                      style={{
                        transform: `translateY(${sTrans}px)`,
                        opacity: sSpring,
                      }}
                    >
                      {s}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/*<div className="score-separator">-</div>*/}
          <div className="score-block">
            <div className="score-number score-number-2" style={{opacity: scoreSpring}}>
              {currentB}
            </div>
            {/* Show scorers for Casalpoglio if they are the away team */}
            {casalpoglioIsAway && scorers.length > 0 && (
              <div className="scorers-list scorers-list-position-2">
                {scorers.map((s: string, i: number) => {
                  const sSpring = spring({
                    ...springOpts,
                    frame: Math.max(0, frame - delay - playerDelay - i * 15),
                  });
                  const sTrans = interpolate(sSpring, [0, 1], [20, 0]);
                  return (
                    <div
                      key={i}
                      className="scorer"
                      style={{
                        transform: `translateY(${sTrans}px)`,
                        opacity: sSpring,
                      }}
                    >
                      {s}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
