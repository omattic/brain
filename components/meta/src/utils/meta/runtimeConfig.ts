import { getRuntimeConfig } from "brain-sdk";

const BRAIN_CONFIG_NAMESPACE = "brainConfig";

export type TenantMetaAccountCacheEntry = {
  tenantId: string;
  provider: string;
  accountId: string;
  username?: string | null;
  label?: string | null;
  status?: string | null;
};

export type TenantComponentConfigValue = {
  value: unknown;
  isSecret?: boolean;
  updatedAt?: string;
};

function getBrainConfigNamespace() {
  const cloudflare = getRuntimeConfig().cloudflare;
  return cloudflare?.kv?.[BRAIN_CONFIG_NAMESPACE] || cloudflare?.resolveKV?.(BRAIN_CONFIG_NAMESPACE);
}

function normalizeComponentName(component: string) {
  return `${component || "unknown"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function normalizeConfigKey(key: string) {
  return `${key || ""}`.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, "_");
}

async function getJsonFromBrainConfig<T>(key: string): Promise<T | null> {
  const namespace = getBrainConfigNamespace();
  if (!namespace) {
    return null;
  }

  const rawValue = await namespace.get(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.warn(`Invalid JSON in BRAIN_CONFIG at ${key}`, error);
    return null;
  }
}

export async function getTenantMetaAccount(accountId?: string | null) {
  if (!accountId) {
    return null;
  }

  return getJsonFromBrainConfig<TenantMetaAccountCacheEntry>(`tenant-meta-account/${accountId}`);
}

export async function getTenantComponentConfig(tenantId: string, component: string) {
  return (
    (await getJsonFromBrainConfig<Record<string, TenantComponentConfigValue>>(
      `tenant-config/${tenantId}/${normalizeComponentName(component)}`
    )) || {}
  );
}

export async function getTenantComponentConfigValue(
  tenantId: string,
  component: string,
  key: string
) {
  const aggregate = await getTenantComponentConfig(tenantId, component);
  return aggregate[normalizeConfigKey(key)] || null;
}

export async function getTenantComponentConfigValueByAccount(
  accountId: string | undefined | null,
  component: string,
  key: string
) {
  const account = await getTenantMetaAccount(accountId);
  if (!account?.tenantId) {
    return null;
  }

  return getTenantComponentConfigValue(account.tenantId, component, key);
}
