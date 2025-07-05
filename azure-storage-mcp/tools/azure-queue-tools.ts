import { ServiceBusClient, ServiceBusAdministrationClient, ServiceBusSender, ServiceBusReceiver } from '@azure/service-bus';
import { DefaultAzureCredential } from '@azure/identity';
import { z } from 'zod';

const AzureQueueConfigSchema = z.object({
  connectionString: z.string().optional(),
  namespaceName: z.string().optional(),
}).refine(data => data.connectionString || data.namespaceName, {
  message: "Either connectionString or namespaceName must be provided"
});

const QueueOperationResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  errorType: z.string().optional(),
});

type AzureQueueConfig = z.infer<typeof AzureQueueConfigSchema>;
type QueueOperationResult = z.infer<typeof QueueOperationResultSchema>;

export class AzureQueueTools {
  private serviceBusClient: ServiceBusClient;
  private adminClient: ServiceBusAdministrationClient;
  private config: AzureQueueConfig;

  constructor(config: AzureQueueConfig) {
    // Validation Zod de la configuration
    const validatedConfig = AzureQueueConfigSchema.parse(config);
    this.config = validatedConfig;
    
    if (validatedConfig.connectionString) {
      this.serviceBusClient = new ServiceBusClient(validatedConfig.connectionString);
      this.adminClient = new ServiceBusAdministrationClient(validatedConfig.connectionString);
    } else if (validatedConfig.namespaceName) {
      const credential = new DefaultAzureCredential();
      const fullyQualifiedNamespace = `${validatedConfig.namespaceName}.servicebus.windows.net`;
      this.serviceBusClient = new ServiceBusClient(fullyQualifiedNamespace, credential);
      this.adminClient = new ServiceBusAdministrationClient(fullyQualifiedNamespace, credential);
    }
  }

  async listQueues(): Promise<QueueOperationResult> {
    try {
      const queues = [];
      for await (const queue of this.adminClient.listQueues()) {
        queues.push({
          name: queue.name,
          status: queue.status,
          maxSizeInMegabytes: queue.maxSizeInMegabytes,
          defaultMessageTimeToLive: queue.defaultMessageTimeToLive,
          lockDuration: queue.lockDuration,
          requiresDuplicateDetection: queue.requiresDuplicateDetection,
          requiresSession: queue.requiresSession,
          deadLetteringOnMessageExpiration: queue.deadLetteringOnMessageExpiration
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
    maxSizeInMegabytes?: number;
    defaultMessageTimeToLive?: string;
    lockDuration?: string;
    requiresDuplicateDetection?: boolean;
    requiresSession?: boolean;
    deadLetteringOnMessageExpiration?: boolean;
  }): Promise<QueueOperationResult> {
    try {
      const queueOptions = {
        maxSizeInMegabytes: options?.maxSizeInMegabytes || 1024,
        defaultMessageTimeToLive: options?.defaultMessageTimeToLive || "P14D", // 14 days
        lockDuration: options?.lockDuration || "PT30S", // 30 seconds
        requiresDuplicateDetection: options?.requiresDuplicateDetection || false,
        requiresSession: options?.requiresSession || false,
        deadLetteringOnMessageExpiration: options?.deadLetteringOnMessageExpiration || false,
      };

      const response = await this.adminClient.createQueue(queueName, queueOptions);
      
      return {
        success: true,
        data: {
          queueName: response.name,
          status: response.status,
          maxSizeInMegabytes: response.maxSizeInMegabytes,
          defaultMessageTimeToLive: response.defaultMessageTimeToLive,
          lockDuration: response.lockDuration,
          created: true
        }
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityAlreadyExists') {
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

  async deleteQueue(queueName: string): Promise<QueueOperationResult> {
    try {
      await this.adminClient.deleteQueue(queueName);
      
      return {
        success: true,
        data: {
          queueName,
          deleted: true
        }
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
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

  async sendMessage(queueName: string, messageBody: string, options?: {
    messageId?: string;
    correlationId?: string;
    label?: string;
    timeToLive?: number;
    sessionId?: string;
    userProperties?: Record<string, any>;
  }): Promise<QueueOperationResult> {
    let sender: ServiceBusSender | undefined;
    
    try {
      sender = this.serviceBusClient.createSender(queueName);
      
      const message = {
        body: messageBody,
        messageId: options?.messageId,
        correlationId: options?.correlationId,
        subject: options?.label,
        timeToLive: options?.timeToLive,
        sessionId: options?.sessionId,
        applicationProperties: options?.userProperties,
      };

      await sender.sendMessages(message);
      
      return {
        success: true,
        data: {
          queueName,
          messageId: options?.messageId,
          correlationId: options?.correlationId,
          sent: true,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
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
    } finally {
      if (sender) {
        await sender.close();
      }
    }
  }

  async receiveMessage(queueName: string, options?: {
    maxMessageCount?: number;
    maxWaitTimeInMs?: number;
  }): Promise<QueueOperationResult> {
    let receiver: ServiceBusReceiver | undefined;
    
    try {
      receiver = this.serviceBusClient.createReceiver(queueName);
      
      const messages = await receiver.receiveMessages(
        options?.maxMessageCount || 1,
        { maxWaitTimeInMs: options?.maxWaitTimeInMs || 60000 }
      );

      const receivedMessages = messages.map(msg => ({
        messageId: msg.messageId,
        body: msg.body,
        correlationId: msg.correlationId,
        subject: msg.subject,
        sessionId: msg.sessionId,
        applicationProperties: msg.applicationProperties,
        enqueuedTimeUtc: msg.enqueuedTimeUtc,
        deliveryCount: msg.deliveryCount,
        lockToken: msg.lockToken
      }));

      // Complete the messages to remove them from the queue
      for (const message of messages) {
        await receiver.completeMessage(message);
      }
      
      return {
        success: true,
        data: {
          queueName,
          messages: receivedMessages,
          count: receivedMessages.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        return {
          success: false,
          error: `Queue '${queueName}' not found`,
          errorType: 'QueueNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'ReceiveMessageError'
      };
    } finally {
      if (receiver) {
        await receiver.close();
      }
    }
  }

  async peekMessage(queueName: string, options?: {
    maxMessageCount?: number;
  }): Promise<QueueOperationResult> {
    let receiver: ServiceBusReceiver | undefined;
    
    try {
      receiver = this.serviceBusClient.createReceiver(queueName);
      
      const messages = await receiver.peekMessages(
        options?.maxMessageCount || 1
      );

      const peekedMessages = messages.map(msg => ({
        messageId: msg.messageId,
        body: msg.body,
        correlationId: msg.correlationId,
        subject: msg.subject,
        sessionId: msg.sessionId,
        applicationProperties: msg.applicationProperties,
        enqueuedTimeUtc: msg.enqueuedTimeUtc,
        deliveryCount: msg.deliveryCount,
        sequenceNumber: msg.sequenceNumber
      }));
      
      return {
        success: true,
        data: {
          queueName,
          messages: peekedMessages,
          count: peekedMessages.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        return {
          success: false,
          error: `Queue '${queueName}' not found`,
          errorType: 'QueueNotFound'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'PeekMessageError'
      };
    } finally {
      if (receiver) {
        await receiver.close();
      }
    }
  }

  async getQueueProperties(queueName: string): Promise<QueueOperationResult> {
    try {
      const queueInfo = await this.adminClient.getQueue(queueName);
      
      return {
        success: true,
        data: {
          queueName: queueInfo.name,
          status: queueInfo.status,
          maxSizeInMegabytes: queueInfo.maxSizeInMegabytes,
          defaultMessageTimeToLive: queueInfo.defaultMessageTimeToLive,
          lockDuration: queueInfo.lockDuration,
          requiresDuplicateDetection: queueInfo.requiresDuplicateDetection,
          requiresSession: queueInfo.requiresSession,
          deadLetteringOnMessageExpiration: queueInfo.deadLetteringOnMessageExpiration
        }
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
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

  async close(): Promise<void> {
    await this.serviceBusClient.close();
  }
}