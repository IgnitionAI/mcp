import { QueueServiceClient, QueueClient } from '@azure/storage-queue';
import { DefaultAzureCredential } from '@azure/identity';
import { z } from 'zod';

const AzureStorageQueueConfigSchema = z.object({
  connectionString: z.string().optional(),
  accountName: z.string().optional(),
}).refine(data => data.connectionString || data.accountName, {
  message: "Either connectionString or accountName must be provided"
});

const StorageQueueOperationResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  errorType: z.string().optional(),
});

type AzureStorageQueueConfig = z.infer<typeof AzureStorageQueueConfigSchema>;
type StorageQueueOperationResult = z.infer<typeof StorageQueueOperationResultSchema>;

export class AzureStorageQueueTools {
  private queueServiceClient: QueueServiceClient;
  private config: AzureStorageQueueConfig;

  constructor(config: AzureStorageQueueConfig) {
    const validatedConfig = AzureStorageQueueConfigSchema.parse(config);
    this.config = validatedConfig;
    
    if (validatedConfig.connectionString) {
      this.queueServiceClient = QueueServiceClient.fromConnectionString(validatedConfig.connectionString);
    } else if (validatedConfig.accountName) {
      const credential = new DefaultAzureCredential();
      const url = `https://${validatedConfig.accountName}.queue.core.windows.net`;
      this.queueServiceClient = new QueueServiceClient(url, credential);
    }
  }

  async listQueues(): Promise<StorageQueueOperationResult> {
    try {
      const queues = [];
      for await (const queue of this.queueServiceClient.listQueues()) {
        queues.push({
          name: queue.name,
          metadata: queue.metadata
        });
      }
      
      return {
        success: true,
        data: {
          queues,
          count: queues.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'ListQueuesError'
      };
    }
  }

  async createQueue(queueName: string, options?: {
    metadata?: Record<string, string>;
  }): Promise<StorageQueueOperationResult> {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      
      const createResponse = await queueClient.create({
        metadata: options?.metadata
      });
      
      return {
        success: true,
        data: {
          queueName,
          created: true,
          requestId: createResponse.requestId,
          date: createResponse.date
        }
      };
    } catch (error: any) {
      if (error.statusCode === 409) {
        return {
          success: false,
          error: `Queue '${queueName}' already exists`,
          errorType: 'QueueAlreadyExists'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'CreateQueueError'
      };
    }
  }

  async deleteQueue(queueName: string): Promise<StorageQueueOperationResult> {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      await queueClient.delete();
      
      return {
        success: true,
        data: {
          queueName,
          deleted: true
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Queue '${queueName}' not found`,
          errorType: 'QueueNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'DeleteQueueError'
      };
    }
  }

  async sendMessage(queueName: string, messageText: string, options?: {
    visibilityTimeoutInSeconds?: number;
    messageTimeToLiveInSeconds?: number;
  }): Promise<StorageQueueOperationResult> {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      
      const sendResponse = await queueClient.sendMessage(messageText);
      
      return {
        success: true,
        data: {
          queueName,
          messageId: sendResponse.messageId,
          popReceipt: sendResponse.popReceipt,
          nextVisibleOn: sendResponse.nextVisibleOn,
          insertedOn: sendResponse.insertedOn,
          expiresOn: sendResponse.expiresOn
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Queue '${queueName}' not found`,
          errorType: 'QueueNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'SendMessageError'
      };
    }
  }

  async receiveMessages(queueName: string, options?: {
    numberOfMessages?: number;
    visibilityTimeoutInSeconds?: number;
  }): Promise<StorageQueueOperationResult> {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      
      const response = await queueClient.receiveMessages({
        numberOfMessages: options?.numberOfMessages || 1
      });
      
      const messages = response.receivedMessageItems.map(msg => ({
        messageId: msg.messageId,
        messageText: msg.messageText,
        popReceipt: msg.popReceipt,
        insertedOn: msg.insertedOn,
        expiresOn: msg.expiresOn,
        nextVisibleOn: msg.nextVisibleOn,
        dequeueCount: msg.dequeueCount
      }));
      
      return {
        success: true,
        data: {
          queueName,
          messages,
          count: messages.length
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Queue '${queueName}' not found`,
          errorType: 'QueueNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'ReceiveMessagesError'
      };
    }
  }

  async peekMessages(queueName: string, options?: {
    numberOfMessages?: number;
  }): Promise<StorageQueueOperationResult> {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      
      const response = await queueClient.peekMessages({
        numberOfMessages: options?.numberOfMessages || 1
      });
      
      const messages = response.peekedMessageItems.map(msg => ({
        messageId: msg.messageId,
        messageText: msg.messageText,
        insertedOn: msg.insertedOn,
        expiresOn: msg.expiresOn,
        dequeueCount: msg.dequeueCount
      }));
      
      return {
        success: true,
        data: {
          queueName,
          messages,
          count: messages.length
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Queue '${queueName}' not found`,
          errorType: 'QueueNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'PeekMessagesError'
      };
    }
  }

  async deleteMessage(queueName: string, messageId: string, popReceipt: string): Promise<StorageQueueOperationResult> {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      
      await queueClient.deleteMessage(messageId, popReceipt);
      
      return {
        success: true,
        data: {
          queueName,
          messageId,
          deleted: true
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Queue '${queueName}' or message not found`,
          errorType: 'QueueOrMessageNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'DeleteMessageError'
      };
    }
  }

  async clearMessages(queueName: string): Promise<StorageQueueOperationResult> {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      
      await queueClient.clearMessages();
      
      return {
        success: true,
        data: {
          queueName,
          cleared: true
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Queue '${queueName}' not found`,
          errorType: 'QueueNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'ClearMessagesError'
      };
    }
  }

  async getQueueProperties(queueName: string): Promise<StorageQueueOperationResult> {
    try {
      const queueClient = this.queueServiceClient.getQueueClient(queueName);
      
      const properties = await queueClient.getProperties();
      
      return {
        success: true,
        data: {
          queueName,
          approximateMessagesCount: properties.approximateMessagesCount,
          metadata: properties.metadata,
          requestId: properties.requestId,
          date: properties.date
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: `Queue '${queueName}' not found`,
          errorType: 'QueueNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'GetQueuePropertiesError'
      };
    }
  }
}