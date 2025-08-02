import React from 'react';
import {AbsoluteFill, Video, spring, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import './MyGoalVideo.css';

export type MyGoalVideoProps = {
    playerName: string;
    minuteGoal: string;
    goalClip: string;
    overlayImage?: string;
    textColor?: string;
    titleSize?: number;
    playerSize?: number;
    textShadow?: string;
};

export const MyGoalVideo: React.FC<MyGoalVideoProps> = ({
                                                            playerName,
                                                            minuteGoal,
                                                            goalClip,
                                                            overlayImage,
                                                            textColor = 'white',
                                                            titleSize = 80,
                                                            playerSize = 110,
                                                            textShadow = '0 0 10px black',
                                                        }) => {
    // Animation hooks
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    // Springs for entry animations
    const textSpring = spring({ frame, fps });
    const imageSpring = spring({ frame: frame - 10, fps });

    // Interpolated values
    const textTranslate = interpolate(textSpring, [0, 1], [200, 0]);
    const imageTranslate = interpolate(imageSpring, [0, 1], [200, 0]);

    return (
        <AbsoluteFill>
            <Video
                src={goalClip}
                style={{
                    objectFit: 'cover',
                    zIndex: 0,
                    width: '100%',
                    height: '100%',
                }}
            />
            {overlayImage && (
                <img
                    src={overlayImage}
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
                    <div className="goal-text player-name">{playerName}</div>
                    <div className="goal-text goal-minute">{minuteGoal}</div>
                </AbsoluteFill>
            </div>
        </AbsoluteFill>
    );
};