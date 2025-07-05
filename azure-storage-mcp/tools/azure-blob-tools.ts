import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { z } from 'zod';

const AzureBlobConfigSchema = z.object({
  connectionString: z.string().optional(),
  accountName: z.string().optional(),
}).refine(data => data.connectionString || data.accountName, {
  message: "Either connectionString or accountName must be provided"
});

const BlobOperationResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  errorType: z.string().optional(),
});

type AzureBlobConfig = z.infer<typeof AzureBlobConfigSchema>;
type BlobOperationResult = z.infer<typeof BlobOperationResultSchema>;

export class AzureBlobTools {
  private blobServiceClient: BlobServiceClient;
  private config: AzureBlobConfig;

  constructor(config: AzureBlobConfig) {
    // Validation Zod de la configuration
    const validatedConfig = AzureBlobConfigSchema.parse(config);
    this.config = validatedConfig;
    
    if (validatedConfig.connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(validatedConfig.connectionString);
    } else if (validatedConfig.accountName) {
      const credential = new DefaultAzureCredential();
      this.blobServiceClient = new BlobServiceClient(
        `https://${validatedConfig.accountName}.blob.core.windows.net`,
        credential
      );
    }
  }

  async listContainers(): Promise<BlobOperationResult> {
    try {
      const containers = [];
      for await (const container of this.blobServiceClient.listContainers()) {
        containers.push({
          name: container.name,
          lastModified: container.properties.lastModified,
          etag: container.properties.etag,
          publicAccess: container.properties.publicAccess,
          hasImmutabilityPolicy: container.properties.hasImmutabilityPolicy,
          hasLegalHold: container.properties.hasLegalHold
        });
      }
      
      return {
        success: true,
        data: {
          containers,
          count: containers.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'ListContainersError'
      };
    }
  }

  async createContainer(containerName: string, options?: { publicAccess?: 'container' | 'blob' }): Promise<BlobOperationResult> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const response = await containerClient.create({
        access: options?.publicAccess
      });
      
      return {
        success: true,
        data: {
          containerName,
          etag: response.etag,
          lastModified: response.lastModified,
          created: true
        }
      };
    } catch (error: any) {
      if (error.statusCode === 409) {
        return {
          success: false,
          error: `Container '${containerName}' already exists`,
          errorType: 'ContainerAlreadyExists'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'CreateContainerError'
      };
    }
  }

  async deleteContainer(containerName: string): Promise<BlobOperationResult> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      await containerClient.delete();
      
      return {
        success: true,
        data: {
          containerName,
          deleted: true
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Container '${containerName}' not found`,
          errorType: 'ContainerNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'DeleteContainerError'
      };
    }
  }

  async listBlobs(containerName: string, prefix?: string): Promise<BlobOperationResult> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobs = [];
      
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        blobs.push({
          name: blob.name,
          lastModified: blob.properties.lastModified,
          contentLength: blob.properties.contentLength,
          contentType: blob.properties.contentType,
          etag: blob.properties.etag,
          blobType: blob.properties.blobType,
          accessTier: blob.properties.accessTier,
          metadata: blob.metadata
        });
      }
      
      return {
        success: true,
        data: {
          containerName,
          blobs,
          count: blobs.length,
          prefix
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Container '${containerName}' not found`,
          errorType: 'ContainerNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'ListBlobsError'
      };
    }
  }

  async uploadBlob(containerName: string, blobName: string, data: string | Buffer, options?: {
    contentType?: string;
    metadata?: Record<string, string>;
    overwrite?: boolean;
  }): Promise<BlobOperationResult> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlockBlobClient(blobName);
      
      const uploadOptions: any = {
        blobHTTPHeaders: options?.contentType ? { blobContentType: options.contentType } : undefined,
        metadata: options?.metadata
      };
      
      if (!options?.overwrite) {
        const exists = await blobClient.exists();
        if (exists) {
          return {
            success: false,
            error: `Blob '${blobName}' already exists in container '${containerName}'`,
            errorType: 'BlobAlreadyExists'
          };
        }
      }
      
      const response = await blobClient.upload(data, typeof data === 'string' ? Buffer.byteLength(data) : data.length, uploadOptions);
      
      return {
        success: true,
        data: {
          containerName,
          blobName,
          etag: response.etag,
          lastModified: response.lastModified,
          contentLength: typeof data === 'string' ? Buffer.byteLength(data) : data.length,
          uploaded: true
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Container '${containerName}' not found`,
          errorType: 'ContainerNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'UploadBlobError'
      };
    }
  }

  async downloadBlob(containerName: string, blobName: string): Promise<BlobOperationResult> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);
      
      const response = await blobClient.download();
      const content = await this.streamToBuffer(response.readableStreamBody!);
      
      return {
        success: true,
        data: {
          containerName,
          blobName,
          content: content.toString(),
          contentLength: response.contentLength,
          contentType: response.contentType,
          lastModified: response.lastModified,
          etag: response.etag,
          metadata: response.metadata
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Blob '${blobName}' not found in container '${containerName}'`,
          errorType: 'BlobNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'DownloadBlobError'
      };
    }
  }

  async deleteBlob(containerName: string, blobName: string): Promise<BlobOperationResult> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);
      
      await blobClient.delete();
      
      return {
        success: true,
        data: {
          containerName,
          blobName,
          deleted: true
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Blob '${blobName}' not found in container '${containerName}'`,
          errorType: 'BlobNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'DeleteBlobError'
      };
    }
  }

  async getBlobProperties(containerName: string, blobName: string): Promise<BlobOperationResult> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);
      
      const properties = await blobClient.getProperties();
      
      return {
        success: true,
        data: {
          containerName,
          blobName,
          properties: {
            lastModified: properties.lastModified,
            contentLength: properties.contentLength,
            contentType: properties.contentType,
            etag: properties.etag,
            blobType: properties.blobType,
            accessTier: properties.accessTier,
            createdOn: properties.createdOn,
            metadata: properties.metadata
          }
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Blob '${blobName}' not found in container '${containerName}'`,
          errorType: 'BlobNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'GetBlobPropertiesError'
      };
    }
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      stream.on('error', reject);
    });
  }
}