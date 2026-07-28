import prisma from './prisma';

export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId || null,
        details: details || undefined,
      },
    });
  } catch (error) {
    console.error('Erreur audit log:', error);
  }
}
