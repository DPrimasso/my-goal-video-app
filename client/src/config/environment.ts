// Unified configuration for the entire application
export const APP_CONFIG = {
  // Environment: 'dev' for local video generation, 'prod' for Lambda function
  environment: process.env.REACT_APP_ENVIRONMENT || 'dev',
  
  // Lambda function URLs (only needed for production)
  startRenderUrl: process.env.REACT_APP_START_RENDER_URL || '',
  renderStatusUrl: process.env.REACT_APP_RENDER_STATUS_URL || '',
  
  // Polling configuration
  pollIntervalMs: Number(process.env.REACT_APP_POLL_INTERVAL_MS || 2000),
  maxPollAttempts: Number(process.env.REACT_APP_MAX_POLL_ATTEMPTS || 300),
  
  // Server ports
  ports: {
    reactApp: 3000,
    videoServer: 4000,
    lambda: 443,
  },
  
  // Server URLs
  serverUrls: {
    reactApp: (port: number = 3000) => `http://localhost:${port}`,
    videoServer: (port: number = 4000) => `http://localhost:${port}`,
  },
};

// Helper functions
export const isDevelopment = () => APP_CONFIG.environment === 'dev';
export const isProduction = () => APP_CONFIG.environment === 'prod';

// Formation positions for the app
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

// Validation
export const validateConfig = () => {
  if (isProduction()) {
    if (!APP_CONFIG.startRenderUrl || !APP_CONFIG.renderStatusUrl) {
      console.warn('Production environment detected but Lambda URLs are not configured');
    }
  }
  
  if (isDevelopment()) {
    console.log('Development environment detected - using local video generation');
  }
};
