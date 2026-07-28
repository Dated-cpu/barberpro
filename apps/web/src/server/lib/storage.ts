import type { MediaProvider } from '@prisma/client';

export interface StorageConfig {
  provider: MediaProvider;
  bucket: string;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  thumbnailUrl?: string;
}

export interface StorageAdapter {
  upload(filename: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;
  private publicUrl: string;

  constructor(config: StorageConfig) {
    this.basePath = process.env.LOCAL_STORAGE_PATH ?? './public/uploads';
    this.publicUrl = config.publicUrl ?? '/uploads';
  }

  async upload(filename: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { nanoid } = await import('nanoid');

    const ext = path.extname(filename);
    const key = `${nanoid(12)}${ext}`;
    const dir = path.join(this.basePath, new Date().toISOString().slice(0, 10));

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, key), buffer);

    return {
      key: `${new Date().toISOString().slice(0, 10)}/${key}`,
      url: `${this.publicUrl}/${new Date().toISOString().slice(0, 10)}/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.unlink(path.join(this.basePath, key)).catch(() => {});
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

class S3StorageAdapter implements StorageAdapter {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async upload(filename: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { nanoid } = await import('nanoid');
    const path = await import('path');

    const ext = path.extname(filename);
    const key = `uploads/${nanoid(12)}${ext}`;

    const client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
      },
      forcePathStyle: this.config.provider === 'MINIO' || this.config.provider === 'R2',
    });

    await client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    const url = this.config.publicUrl
      ? `${this.config.publicUrl}/${key}`
      : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;

    return { key, url };
  }

  async delete(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
      },
    });

    await client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  getUrl(key: string): string {
    if (this.config.publicUrl) return `${this.config.publicUrl}/${key}`;
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}

let adapter: StorageAdapter | null = null;

function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER ?? 'LOCAL') as MediaProvider;

  return {
    provider,
    bucket: process.env.STORAGE_BUCKET ?? 'barberpro',
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION ?? 'ru-central1',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    publicUrl: process.env.STORAGE_PUBLIC_URL,
  };
}

export function getStorageAdapter(): StorageAdapter {
  if (adapter) return adapter;

  const config = getStorageConfig();

  switch (config.provider) {
    case 'LOCAL':
      adapter = new LocalStorageAdapter(config);
      break;
    case 'S3':
    case 'R2':
    case 'MINIO':
      adapter = new S3StorageAdapter(config);
      break;
    default:
      adapter = new LocalStorageAdapter(config);
  }

  return adapter;
}
