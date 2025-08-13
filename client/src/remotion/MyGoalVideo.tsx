import React from 'react';
import {AbsoluteFill, Video, Img, spring, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {resolveAsset} from './resolveAsset';
import './MyGoalVideo.css';

export interface MyGoalVideoProps extends Record<string, unknown> {
    playerName: string;
    minuteGoal: string;
    goalClip: string;
    overlayImage?: string;
    s3PlayerUrl?: string; // URL completo (pubblico o presigned) dell'immagine del giocatore
    partialScore?: string; // Risultato parziale (es. "2-1")
    textColor?: string;
    titleSize?: number;
    playerSize?: number;
    textShadow?: string;
}

export const MyGoalVideo: React.FC<MyGoalVideoProps> = ({
                                                            playerName,
                                                            minuteGoal,
                                                            goalClip,
                                                            overlayImage,
                                                            s3PlayerUrl,
                                                            partialScore,
                                                            textColor = 'white',
                                                            titleSize = 80,
                                                            playerSize = 110,
                                                            textShadow = '0 0 10px black',
                                                        }) => {
    // Debug logging
    console.log('MyGoalVideo props:', { playerName, minuteGoal, partialScore });
    console.log('Partial score type:', typeof partialScore, 'value:', partialScore);
    
    // Animation hooks
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    const isAbsoluteUrl = (u?: string): u is string => !!u && /^https?:\//i.test(u);

    // Video: se goalClip è una URL assoluta la uso, altrimenti risolvo dall'asset bundle
    const videoSrc = goalClip ? (isAbsoluteUrl(goalClip) ? goalClip : resolveAsset(goalClip)) : '';

    // Overlay giocatore: priorità a s3PlayerUrl (URL runtime), poi overlayImage (URL assoluta o asset locale)
    const overlaySrc = s3PlayerUrl
      ? s3PlayerUrl
      : overlayImage
        ? (isAbsoluteUrl(overlayImage) ? overlayImage : resolveAsset(overlayImage))
        : undefined;

    // Springs for entry animations
    const textSpring = spring({ frame, fps });
    const imageSpring = spring({ frame: frame - 10, fps });
    const scoreSpring = spring({ frame: frame - 20, fps }); // Delayed animation for score

    // Interpolated values
    const textTranslate = interpolate(textSpring, [0, 1], [200, 0]);
    const imageTranslate = interpolate(imageSpring, [0, 1], [200, 0]);
    const scoreTranslate = interpolate(scoreSpring, [0, 1], [200, 0]);

    return (
        <AbsoluteFill>
            {videoSrc && (
                <Video
                    src={videoSrc}
                    style={{
                        objectFit: 'cover',
                        zIndex: 0,
                        width: '100%',
                        height: '100%',
                    }}
                />
            )}
            {overlaySrc && (
                <Img
                    src={overlaySrc}
                    className="overlay-image"
                    style={{
                        transform: `translateX(${imageTranslate}px)`,
                        opacity: imageSpring,
                    }}
                />
            )}
            <div
                className="goal-container"
                style={{
                    transform: `translateY(${textTranslate}px)`,
                    opacity: textSpring,
                }}
            >
                <AbsoluteFill
                    style={{
                        '--text-color': textColor,
                        '--title-size': `${titleSize}px`,
                        '--player-size': `${playerSize}px`,
                        '--text-shadow': textShadow,
                    } as React.CSSProperties}
                >
                    <div className="goal-text player-name-goal">{playerName}</div>
                    <div className="goal-text goal-minute">{minuteGoal}°</div>
                    {partialScore && partialScore.trim() !== '' && (
                        <div
                            className="score-section"
                            style={{
                                transform: `translateY(${scoreTranslate}px)`,
                                opacity: scoreSpring,
                            }}
                        >
                            <div className="goal-text partial-score">Risultato parziale</div>
                            <div className="goal-text score-value">{partialScore}</div>
                        </div>
                    )}
                </AbsoluteFill>
            </div>
        </AbsoluteFill>
    );
};
