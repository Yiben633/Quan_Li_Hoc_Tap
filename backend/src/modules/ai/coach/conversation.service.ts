import type { AiConversationStatus, AiMessageRole, Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import { serviceError } from '../../../utils/service-error.js';

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

export type ConversationPageQuery = {
  page: number;
  limit: number;
  status?: AiConversationStatus;
};

export type MessagePageQuery = {
  page: number;
  limit: number;
};

export type CreateConversationInput = {
  title?: string | null;
};

export type AddMessageInput = {
  role: AiMessageRole;
  content: string;
  metadata?: Prisma.InputJsonValue;
};

const conversationSummaryInclude = {
  _count: {
    select: {
      messages: true,
      drafts: true,
    },
  },
} satisfies Prisma.AiConversationInclude;

async function ownedConversation(userId: string, conversationId: string) {
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, userId },
    include: conversationSummaryInclude,
  });

  if (!conversation) throw serviceError('Conversation not found', 404);
  return conversation;
}

async function log(userId: string, action: string, entityId: string, context?: AuditContext) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entityType: 'ai_conversation',
      entityId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    },
  });
}

export async function createConversation(userId: string, input: CreateConversationInput = {}, context?: AuditContext) {
  const title = input.title?.trim() || null;
  const conversation = await prisma.aiConversation.create({
    data: { userId, title },
    include: conversationSummaryInclude,
  });

  await log(userId, 'ai.conversation_created', conversation.id, context);
  return conversation;
}

export async function listConversations(userId: string, query: ConversationPageQuery) {
  const where: Prisma.AiConversationWhereInput = {
    userId,
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.aiConversation.findMany({
      where,
      include: conversationSummaryInclude,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.aiConversation.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getConversation(userId: string, conversationId: string) {
  return ownedConversation(userId, conversationId);
}

export async function addMessage(userId: string, conversationId: string, input: AddMessageInput, context?: AuditContext) {
  const content = input.content.trim();
  if (!content) throw serviceError('Message content is required', 422);

  return prisma.$transaction(async (tx) => {
    const conversation = await tx.aiConversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!conversation) throw serviceError('Conversation not found', 404);

    const message = await tx.aiMessage.create({
      data: {
        conversationId,
        role: input.role,
        content,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      },
    });

    await tx.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.message_added',
        entityType: 'ai_conversation',
        entityId: conversationId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: { role: input.role, messageId: message.id },
      },
    });

    return message;
  });
}

export async function listMessages(userId: string, conversationId: string, query: MessagePageQuery) {
  await ownedConversation(userId, conversationId);
  const where: Prisma.AiMessageWhereInput = { conversationId };
  const [items, total] = await Promise.all([
    prisma.aiMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.aiMessage.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function deleteConversation(userId: string, conversationId: string, context?: AuditContext) {
  await ownedConversation(userId, conversationId);

  await prisma.$transaction([
    prisma.aiConversation.delete({ where: { id: conversationId } }),
    prisma.activityLog.create({
      data: {
        userId,
        action: 'ai.conversation_deleted',
        entityType: 'ai_conversation',
        entityId: conversationId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    }),
  ]);

  return { id: conversationId };
}
