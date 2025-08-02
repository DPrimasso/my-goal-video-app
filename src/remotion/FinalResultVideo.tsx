import React from 'react';
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
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
}

export const FinalResultVideo: React.FC<FinalResultVideoProps> = ({
  teamA,
  teamB,
  scoreA,
  scoreB,
  scorers,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoSpring = spring({frame, fps});
  const translateA = interpolate(logoSpring, [0, 1], [-400, 0]);
  const translateB = interpolate(logoSpring, [0, 1], [400, 0]);

  const scoreSpring = spring({frame: frame - 30, fps});
  const currentA = Math.round(
    interpolate(scoreSpring, [0, 1], [0, scoreA])
  );
  const currentB = Math.round(
    interpolate(scoreSpring, [0, 1], [0, scoreB])
  );

  return (
    <AbsoluteFill className="result-root">
      <div className="teams-row">
        <div className="team-block">
          <Img
            src={staticFile(teamA.logo)}
            className="team-logo"
            style={{transform: `translateX(${translateA}px)`}}
          />
          <div
            className="team-name"
            style={{transform: `translateX(${translateA}px)`}}
          >
            {teamA.name}
          </div>
          {teamA.name === 'Casalpoglio' && (
            <div className="scorers-list">
              {scorers.map((s, i) => {
                const sSpring = spring({
                  frame: frame - 90 - i * 10,
                  fps,
                });
                const sTrans = interpolate(sSpring, [0, 1], [-200, 0]);
                return (
                  <div
                    key={i}
                    className="scorer"
                    style={{
                      transform: `translateX(${sTrans}px)`,
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
        <div className="team-block">
          <Img
            src={staticFile(teamB.logo)}
            className="team-logo"
            style={{transform: `translateX(${translateB}px)`}}
          />
          <div
            className="team-name"
            style={{transform: `translateX(${translateB}px)`}}
          >
            {teamB.name}
          </div>
          {teamB.name === 'Casalpoglio' && (
            <div className="scorers-list">
              {scorers.map((s, i) => {
                const sSpring = spring({
                  frame: frame - 90 - i * 10,
                  fps,
                });
                const sTrans = interpolate(sSpring, [0, 1], [-200, 0]);
                return (
                  <div
                    key={i}
                    className="scorer"
                    style={{
                      transform: `translateX(${sTrans}px)`,
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
      <div className="score-text">
        {currentA} - {currentB}
      </div>
    </AbsoluteFill>
  );
};
