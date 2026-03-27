import { getDb } from "./db";
import { activityLog } from "../drizzle/schema";

export interface AuditLogEntry {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
}

/**
 * Log an admin action to the audit trail.
 * Fire-and-forget — errors are caught and logged, never thrown.
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(activityLog).values({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? undefined,
      details: entry.details ?? undefined,
      ipAddress: entry.ipAddress ?? undefined,
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write audit entry:", err);
  }
}

/**
 * Extract client IP from request, handling proxied requests.
 */
export function getClientIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0].split(",")[0].trim();
  return req.ip || "unknown";
}
