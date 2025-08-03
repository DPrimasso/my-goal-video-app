import {staticFile} from 'remotion';
export const resolveAsset = (p: string) =>
  /^https?:/.test(p) ? p : staticFile(p);

