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
  delayRender,
  continueRender,
} from 'remotion';
import {resolveAsset} from './resolveAsset';
import {videoService} from '../services/videoService';
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
  teamALogoPath?: string; // URL completo per il logo della squadra A
  teamBLogoPath?: string; // URL completo per il logo della squadra B
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
  // Handle image loading with extended timeout for large logos
  const [imagesLoaded, setImagesLoaded] = React.useState(false);
  const handle = React.useRef<number | null>(null);
  
  React.useEffect(() => {
    // Set a longer timeout for image loading (60 seconds instead of default 28)
    handle.current = delayRender('Loading team logos', {
      timeoutInMilliseconds: 60000 // 60 seconds timeout
    });
    
    // Let Remotion handle the image loading naturally
    // We'll call continueRender when images are actually loaded
    const checkImagesLoaded = () => {
      // Check if both images are loaded by trying to access them
      const teamAImg = new Image();
      const teamBImg = new Image();
      let loadedCount = 0;
      
      const onLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          setImagesLoaded(true);
          if (handle.current !== null) {
            continueRender(handle.current);
          }
        }
      };
      
      const onError = () => {
        // Even if there's an error, continue rendering to avoid infinite wait
        if (handle.current !== null) {
          continueRender(handle.current);
        }
      };
      
      teamAImg.onload = onLoad;
      teamAImg.onerror = onError;
      teamBImg.onload = onLoad;
      teamBImg.onerror = onError;
      
      // Use staticFile paths
      teamAImg.src = teamALogoPath ? staticFile(teamALogoPath) : staticFile('logo192.png');
      teamBImg.src = teamBLogoPath ? staticFile(teamBLogoPath) : staticFile('logo192.png');
    };
    
    // Small delay to let staticFile resolve, then check loading
    const timer = setTimeout(checkImagesLoaded, 100);
    
    return () => {
      clearTimeout(timer);
      if (handle.current !== null) {
        continueRender(handle.current);
      }
    };
  }, [teamALogoPath, teamBLogoPath]);


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

  // Use staticFile directly for team logos, same approach as MyGoalVideo
  const teamALogoUrl = teamALogoPath ? staticFile(teamALogoPath) : staticFile('logo192.png');
  const teamBLogoUrl = teamBLogoPath ? staticFile(teamBLogoPath) : staticFile('logo192.png');
  
  // Debug logging for image paths
  console.log('🔍 FinalResultVideo - Image paths:');
  console.log('  teamALogoPath:', teamALogoPath);
  console.log('  teamBLogoPath:', teamBLogoPath);
  console.log('  teamALogoUrl:', teamALogoUrl);
  console.log('  teamBLogoUrl:', teamBLogoUrl);

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
                src={teamALogoUrl}
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
                src={teamBLogoUrl}
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
