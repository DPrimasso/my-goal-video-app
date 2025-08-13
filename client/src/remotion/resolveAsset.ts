import {staticFile} from 'remotion';
export const resolveAsset = (p?: string) => {
  if (!p) return '';
  return /^https?:/.test(p) ? p : staticFile(p);
};

