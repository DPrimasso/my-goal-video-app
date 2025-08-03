import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import {getSignedS3Url} from './s3Signer';

export type FetchGoalClipOptions = {
  /** Percorso del file fornito dall'utente */
  clipPath?: string;
  /** Tempo di inizio in secondi per il ritaglio */
  startTime?: number;
  /** Tempo di fine in secondi per il ritaglio */
  endTime?: number;
};

/**
 * Restituisce il percorso della clip da utilizzare per la fase di rendering.
 * Il file viene prelevato dal percorso indicato dall'utente oppure dalla cartella
 * `/public/clips`. Se vengono specificati `startTime` o `endTime`, viene creato
 * un file temporaneo con la porzione desiderata tramite FFmpeg.
 */
export const fetchGoalClip = async (
  options: FetchGoalClipOptions
): Promise<string> => {
  const {clipPath = '', startTime, endTime} = options;

  if (clipPath.startsWith('s3://')) {
    const [, bucket, ...keyParts] = clipPath.split('/');
    const key = keyParts.join('/');
    return await getSignedS3Url({bucket, key});
  }

  if (/^https?:/.test(clipPath)) {
    try {
      const {hostname, pathname} = new URL(clipPath);
      if (/\.s3\./.test(hostname)) {
        const bucket = hostname.split('.')[0];
        const key = pathname.replace(/^\//, '');
        return await getSignedS3Url({bucket, key});
      }
    } catch {}
    return clipPath;
  }

  const baseDir = path.join(process.cwd(), 'public', 'clips');
  const candidatePath = path.isAbsolute(clipPath)
    ? clipPath
    : path.join(baseDir, clipPath);

  if (!fs.existsSync(candidatePath)) {
    throw new Error(`Clip non trovata: ${candidatePath}`);
  }

  if (startTime === undefined && endTime === undefined) {
    return candidatePath;
  }

  const tmpName = `${path.parse(candidatePath).name}-trimmed${path.extname(
    candidatePath
  )}`;
  const outputPath = path.join(baseDir, tmpName);

  await new Promise<void>((resolve, reject) => {
    let command = ffmpeg(candidatePath).output(outputPath);
    if (startTime !== undefined) {
      command = command.setStartTime(startTime);
    }
    if (endTime !== undefined) {
      const duration =
        startTime !== undefined ? endTime - startTime : endTime;
      command = command.setDuration(duration);
    }
    command
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });

  return outputPath;
};
