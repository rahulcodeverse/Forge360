/**
 * @typedef {{ id: string; actorId: string; action: string; resourceType: string; resourceId: string; beforeValue: unknown; afterValue: unknown; ip?: string; createdAt: string; immutable: true }} AuditEvent
 */

/**
 * @param {{ actorId: string; action: string; resourceType: string; resourceId: string; beforeValue?: unknown; afterValue?: unknown; ip?: string; }} input
 * @returns {AuditEvent}
 */
export function appendAuditEvent(input) {
  /** @type {AuditEvent} */
  const event = {
    id: `audit_${crypto.randomUUID()}`,
    actorId: input.actorId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    beforeValue: input.beforeValue ?? null,
    afterValue: input.afterValue ?? null,
    createdAt: new Date().toISOString(),
    immutable: true,
  };
  if (input.ip !== undefined) {
    /** @type {AuditEvent} */
    const eventWithIp = { ...event, ip: input.ip };
    return eventWithIp;
  }
  return event;
}
