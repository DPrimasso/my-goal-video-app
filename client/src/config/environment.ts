export type ImageEndpointName = 'lineup' | 'goal' | 'finalResult';

export const APP_CONFIG: Readonly<Record<ImageEndpointName, string>> = Object.freeze({
  lineup: (import.meta.env.VITE_LINEUP_IMAGE_URL || '').trim(),
  goal: (import.meta.env.VITE_GOAL_IMAGE_URL || '').trim(),
  finalResult: (import.meta.env.VITE_FINAL_RESULT_IMAGE_URL || '').trim(),
});

export const INSTAGRAM_PUBLISH_URL = (import.meta.env.VITE_INSTAGRAM_PUBLISH_URL || '').trim();
export const INSTAGRAM_DIRECT_PUBLISH_ENABLED = (import.meta.env.VITE_INSTAGRAM_DIRECT_PUBLISH_ENABLED || '')
  .trim()
  .toLowerCase() === 'true';

const endpointLabels: Record<ImageEndpointName, string> = {
  lineup: 'Formazione',
  goal: 'Goal',
  finalResult: 'Risultato finale',
};

export function getEndpoint(name: ImageEndpointName): string {
  const endpoint = APP_CONFIG[name];
  if (!endpoint) {
    throw new Error(`Endpoint ${endpointLabels[name]} non configurato. Controlla le variabili VITE_*_IMAGE_URL.`);
  }
  return endpoint;
}

export function getConfigurationErrors(): string[] {
  return (Object.keys(APP_CONFIG) as ImageEndpointName[])
    .filter((name) => !APP_CONFIG[name])
    .map((name) => `Endpoint ${endpointLabels[name]} non configurato`);
}
