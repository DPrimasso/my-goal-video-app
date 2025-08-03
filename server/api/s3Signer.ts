// @ts-nocheck
import {GetObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {s3Client} from './awsClient';

export type GetSignedS3UrlOptions = {
  bucket: string;
  key: string;
  expiresIn?: number;
};

export const getSignedS3Url = async ({
  bucket,
  key,
  expiresIn = 3600,
}: GetSignedS3UrlOptions): Promise<string> => {
  const command = new GetObjectCommand({Bucket: bucket, Key: key});
  return await getSignedUrl(s3Client, command, {expiresIn});
};
