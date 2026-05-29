export interface TenantContext {
  tenantId: string;
  legalEntityId?: string;
  locale?: string;
  timezone?: string;
}

export class TenantResolver {
  fromHeaders(headers: Record<string, string | string[] | undefined>): TenantContext {
    const tenantId = String(headers['x-tenant-id'] ?? '').trim();
    if (!tenantId) {
      throw new Error('Missing tenant context');
    }

    return {
      tenantId,
      legalEntityId: asOptionalString(headers['x-legal-entity-id']),
      locale: asOptionalString(headers['x-locale']),
      timezone: asOptionalString(headers['x-timezone']),
    };
  }
}

function asOptionalString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

