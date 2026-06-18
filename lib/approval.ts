import { prisma } from "@/lib/prisma";

export async function createApprovalRequest(
  entityType: string,
  entityId: string | null,
  action: "CREATE" | "UPDATE" | "DELETE",
  managerId: string,
  managerName: string,
  previousData: unknown = null,
  newData: unknown = null
) {
  // Get auto-approval days
  const settings = await prisma.systemSetting.findUnique({ where: { key: "AUTO_APPROVAL_DAYS" } });
  const days = settings ? parseInt(settings.value) : 3;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return await prisma.approvalRequest.create({
    data: {
      entityType,
      entityId,
      action,
      managerId,
      managerName,
      previousData: previousData ? JSON.stringify(previousData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      expiresAt,
    }
  });
}
