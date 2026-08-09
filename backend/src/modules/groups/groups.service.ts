import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';
async function groupAccess(userId: string, id: string, ownerOnly = false) { const group = await prisma.studyGroup.findUnique({ where: { id }, include: { members: true, tasks: true } }); if (!group || (ownerOnly ? group.ownerId !== userId : group.ownerId !== userId && !group.members.some((m) => m.userId === userId && m.status === 'accepted'))) throw serviceError('Study group not found or access denied', 404); return group; }
export async function list(userId: string) { return prisma.studyGroup.findMany({ where: { OR: [{ ownerId: userId }, { members: { some: { userId, status: 'accepted' } } }] }, include: { _count: { select: { members: { where: { status: 'accepted' } }, tasks: true } } }, orderBy: { updatedAt: 'desc' } }); }
export async function invitations(userId: string) { return prisma.groupMember.findMany({ where: { userId, status: 'pending' }, select: { id: true, role: true, status: true, studyGroup: { select: { id: true, name: true, description: true, owner: { select: { id: true, fullName: true, avatarUrl: true } } } } } }); }
export async function create(userId: string, input: { name: string; description?: string | null }) { return prisma.studyGroup.create({ data: { ...input, ownerId: userId, members: { create: { userId, role: 'leader', status: 'accepted', joinedAt: new Date() } } }, include: { members: true } }); }
export async function detail(userId: string, id: string) { const group = await groupAccess(userId, id); return prisma.studyGroup.findUnique({ where: { id }, include: { members: { where: group.ownerId === userId ? {} : { status: 'accepted' }, include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } }, tasks: true } }); }
export async function update(userId: string, id: string, input: { name?: string; description?: string | null }) { await groupAccess(userId, id, true); return prisma.studyGroup.update({ where: { id }, data: input }); }
export async function remove(userId: string, id: string) { await groupAccess(userId, id, true); await prisma.studyGroup.delete({ where: { id } }); return { id }; }
export async function invite(userId: string, id: string, email: string) {
  const group = await groupAccess(userId, id, true);
  const [user, inviter] = await Promise.all([
    prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null }, select: { id: true, fullName: true, avatarUrl: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } }),
  ]);
  if (!user) throw serviceError('No active account matches this email', 404);
  if (user.id === userId) throw serviceError('The group owner is already a member', 409);

  const member = await prisma.$transaction(async (tx) => {
    const invitation = await tx.groupMember.upsert({
      where: { studyGroupId_userId: { studyGroupId: id, userId: user.id } },
      create: { studyGroupId: id, userId: user.id },
      update: { status: 'pending', joinedAt: null },
    });
    const unreadNotification = await tx.notification.findFirst({
      where: { userId: user.id, relatedEntityType: 'study_group_invitation', relatedEntityId: invitation.id, isRead: false },
    });
    if (!unreadNotification) {
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'system',
          title: 'Lời mời tham gia nhóm',
          message: `${inviter.fullName} đã mời bạn tham gia nhóm “${group.name}”.`,
          relatedEntityType: 'study_group_invitation',
          relatedEntityId: invitation.id,
          channel: 'in_app',
        },
      });
    }
    return invitation;
  });

  return { id: member.id, role: member.role, status: member.status, user };
}
export async function accept(userId: string, id: string, memberId: string) {
  const member = await prisma.groupMember.findFirst({ where: { id: memberId, studyGroupId: id, userId, status: 'pending' } });
  if (!member) throw serviceError('Invitation not found', 404);
  return prisma.$transaction(async (tx) => {
    const accepted = await tx.groupMember.update({ where: { id: memberId }, data: { status: 'accepted', joinedAt: new Date() } });
    await tx.notification.updateMany({ where: { userId, relatedEntityType: 'study_group_invitation', relatedEntityId: memberId, isRead: false }, data: { isRead: true } });
    return accepted;
  });
}
export async function reject(userId: string, id: string, memberId: string) {
  const member = await prisma.groupMember.findFirst({ where: { id: memberId, studyGroupId: id, userId, status: 'pending' } });
  if (!member) throw serviceError('Invitation not found', 404);
  return prisma.$transaction(async (tx) => {
    const rejected = await tx.groupMember.update({ where: { id: memberId }, data: { status: 'rejected', joinedAt: null } });
    await tx.notification.updateMany({ where: { userId, relatedEntityType: 'study_group_invitation', relatedEntityId: memberId, isRead: false }, data: { isRead: true } });
    return rejected;
  });
}
export async function createTask(userId: string, groupId: string, input: { assignedUserId?: string | null; title: string; description?: string | null; dueDate?: Date | null; status?: 'todo' | 'in_progress' | 'waiting' | 'done' }) { const group = await groupAccess(userId, groupId); if (input.assignedUserId && !group.members.some((m) => m.userId === input.assignedUserId && m.status === 'accepted')) throw serviceError('Assigned user is not an active member', 422); return prisma.groupTask.create({ data: { ...input, studyGroupId: groupId } }); }
export async function updateTask(userId: string, id: string, input: { assignedUserId?: string | null; title?: string; description?: string | null; dueDate?: Date | null; status?: 'todo' | 'in_progress' | 'waiting' | 'done' }) { const task = await prisma.groupTask.findUnique({ where: { id } }); if (!task) throw serviceError('Group task not found', 404); const group = await groupAccess(userId, task.studyGroupId); if (input.assignedUserId && !group.members.some((member) => member.userId === input.assignedUserId && member.status === 'accepted')) throw serviceError('Assigned user is not an active member', 422); return prisma.groupTask.update({ where: { id }, data: input }); }
export async function progress(userId: string, id: string) { const group = await groupAccess(userId, id); const total = group.tasks.length; const done = group.tasks.filter((task) => task.status === 'done').length; return { groupId: id, totalTasks: total, doneTasks: done, progressPercent: total ? Math.round(done / total * 10000) / 100 : 0 }; }
