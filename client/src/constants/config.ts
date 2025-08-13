import { AppConfig } from '../types';

export const APP_CONFIG: AppConfig = {
  startRenderUrl: process.env.REACT_APP_START_RENDER_URL!,
  renderStatusUrl: process.env.REACT_APP_RENDER_STATUS_URL!,
  awsRegion: process.env.REACT_APP_AWS_REGION || 'eu-west-1',
  s3PublicBase: process.env.REACT_APP_S3_PUBLIC_BASE || '',
  assetBucket: process.env.REACT_APP_ASSET_BUCKET || '',
  pollIntervalMs: Number(process.env.REACT_APP_POLL_INTERVAL_MS || 2000),
  maxPollAttempts: Number(process.env.REACT_APP_MAX_POLL_ATTEMPTS || 300),
};

export const FORMATION_POSITIONS = {
  goalkeeper: { top: '80%', left: '50%' },
  defenders: [
    { top: '65%', left: '10%' },
    { top: '65%', left: '30%' },
    { top: '65%', left: '50%' },
    { top: '65%', left: '70%' },
    { top: '65%', left: '90%' },
  ],
  midfielders: [
    { top: '50%', left: '10%' },
    { top: '50%', left: '30%' },
    { top: '50%', left: '50%' },
    { top: '50%', left: '70%' },
    { top: '50%', left: '90%' },
  ],
  attackingMidfielders: [
    { top: '35%', left: '30%' },
    { top: '35%', left: '50%' },
    { top: '35%', left: '70%' },
  ],
  forwards: [
    { top: '20%', left: '10%' },
    { top: '20%', left: '30%' },
    { top: '20%', left: '50%' },
    { top: '20%', left: '70%' },
    { top: '20%', left: '90%' },
  ],
};
