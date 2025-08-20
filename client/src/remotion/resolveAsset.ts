import {staticFile} from 'remotion';

export const resolveAsset = (p?: string) => {
  if (!p) return '';
  
  // If it's already a full URL, return as is
  if (/^https?:/.test(p)) return p;
  
  // UNIFIED ASSET RESOLUTION: Handle all assets the same way
  // For team logos and other assets, use staticFile
  return staticFile(p);
};

