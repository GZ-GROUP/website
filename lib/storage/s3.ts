import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { serverEnv } from "@/lib/env";

// The app's only door to object storage (ADR 0008). Anything S3-compatible
// works; locally it is RustFS from docker-compose. The bucket stays private:
// files are served through /media/[...key].

let client: S3Client | undefined;

function config() {
  const env = serverEnv();
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error("Object storage is not configured: set S3_ENDPOINT, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.");
  }
  return env;
}

function s3(): S3Client {
  if (client) return client;
  const env = config();
  client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE, // RustFS only supports path-style addressing
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
  });
  return client;
}

const bucket = () => config().S3_BUCKET;

export function isStorageConfigured(): boolean {
  const env = serverEnv();
  return Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

export type StoredObject = {
  body: ReadableStream;
  contentType: string;
  contentLength?: number;
  etag?: string;
};

/** Returns null when the key does not exist. */
export async function getObject(key: string): Promise<StoredObject | null> {
  try {
    const result = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if (!result.Body) return null;
    return {
      body: result.Body.transformToWebStream(),
      contentType: result.ContentType ?? "application/octet-stream",
      contentLength: result.ContentLength,
      etag: result.ETag,
    };
  } catch (error) {
    if (error instanceof NoSuchKey) return null;
    if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) return null;
    throw error;
  }
}

/** Creates the bucket when missing. Idempotent; runs at server start. */
export async function ensureBucket(): Promise<"exists" | "created"> {
  try {
    await s3().send(new HeadBucketCommand({ Bucket: bucket() }));
    return "exists";
  } catch (error) {
    const status = error instanceof S3ServiceException ? error.$metadata.httpStatusCode : undefined;
    if (status !== 404) throw error;
  }
  await s3().send(new CreateBucketCommand({ Bucket: bucket() }));
  return "created";
}
