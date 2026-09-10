import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const basePath = process.env.R2_BASE_PATH;

if (!accountId) {
  throw new Error("Missing R2_ACCOUNT_ID");
}

if (!accessKeyId) {
  throw new Error("Missing R2_ACCESS_KEY_ID");
}

if (!secretAccessKey) {
  throw new Error("Missing R2_SECRET_ACCESS_KEY");
}

if (!bucketName) {
  throw new Error("Missing R2_BUCKET_NAME");
}

if (!basePath) {
  throw new Error("Missing R2_BASE_PATH");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const R2_CONFIG = {
  bucket: bucketName,
  basePath: basePath.replace(/^\/|\/$/g, ""),
};

export function r2Key(path: string): string {
  const cleanPath = path.replace(/^\/+/, "");
  return `${R2_CONFIG.basePath}/${cleanPath}`;
}

export async function getR2Object(path: string) {
  return r2.send(
    new GetObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: r2Key(path),
    }),
  );
}

export async function putR2Object(
  path: string,
  body: Uint8Array | Buffer | string,
  contentType: string,
) {
  return r2.send(
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: r2Key(path),
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteR2Object(path: string) {
  return r2.send(
    new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: r2Key(path),
    }),
  );
}