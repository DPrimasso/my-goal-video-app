import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import {S3Client, GetObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

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

  if (/^https?:/.test(clipPath)) {
    return clipPath;
  }

  if (clipPath.startsWith('s3://')) {
    const [, bucket, ...keyParts] = clipPath.split('/');
    const key = keyParts.join('/');
    const client = new S3Client({region: process.env.AWS_REGION || 'us-east-1'});
    const command = new GetObjectCommand({Bucket: bucket, Key: key});
    return await getSignedUrl(client, command, {expiresIn: 3600});
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
