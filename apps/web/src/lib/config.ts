import { prisma } from './prisma';

export const CONFIG_KEYS = {
  PLATFORM_COMMISSION_RATE: 'platform_commission_rate', // e.g. 20 (percent)
  MIN_WALLET_RECHARGE: 'min_wallet_recharge', // e.g. 100 (INR)
  MIN_WITHDRAWAL_AMOUNT: 'min_withdrawal_amount', // e.g. 500 (INR)
  MAX_WITHDRAWAL_REQUESTS: 'max_withdrawal_requests', // e.g. 3 per day
  FREE_TRIAL_MAX_CHATS: 'free_trial_max_chats', // e.g. 3 chats for new users
  FREE_TRIAL_MAX_MINUTES: 'free_trial_max_minutes', // e.g. 5 mins per free trial chat
  DEFAULT_MONTHLY_PRICE: 'default_monthly_price', // e.g. 1000
  DEFAULT_PER_MINUTE_PRICE: 'default_per_minute_price', // e.g. 15
  DEFAULT_CALL_PRICE: 'default_call_price', // e.g. 15
  NOTIFICATIONS_ENABLED: 'notifications_enabled', // true/false
  FREE_TRIAL_ENABLED: 'free_trial_enabled', // true/false
  COMMUNITY_ENABLED: 'community_enabled', // true/false
  CONTACT_FORM_URL: 'contact_form_url', // Google Form or support embed URL
};

export const DEFAULT_CONFIGS: Record<string, { value: string; description: string; type: string }> = {
  [CONFIG_KEYS.PLATFORM_COMMISSION_RATE]: {
    value: '20',
    description: 'Platform commission percentage deducted from mentor chat & subscription earnings',
    type: 'number',
  },
  [CONFIG_KEYS.MIN_WALLET_RECHARGE]: {
    value: '100',
    description: 'Minimum wallet recharge amount in INR',
    type: 'number',
  },
  [CONFIG_KEYS.MIN_WITHDRAWAL_AMOUNT]: {
    value: '500',
    description: 'Minimum amount required for mentor withdrawal request in INR',
    type: 'number',
  },
  [CONFIG_KEYS.MAX_WITHDRAWAL_REQUESTS]: {
    value: '3',
    description: 'Maximum pending withdrawal requests allowed per mentor',
    type: 'number',
  },
  [CONFIG_KEYS.FREE_TRIAL_MAX_CHATS]: {
    value: '3',
    description: 'Maximum free trial chats allowed per new student',
    type: 'number',
  },
  [CONFIG_KEYS.FREE_TRIAL_MAX_MINUTES]: {
    value: '5',
    description: 'Maximum free trial minutes per chat session',
    type: 'number',
  },
  [CONFIG_KEYS.DEFAULT_MONTHLY_PRICE]: {
    value: '1000',
    description: 'Default recommended monthly subscription price for new mentors',
    type: 'number',
  },
  [CONFIG_KEYS.DEFAULT_PER_MINUTE_PRICE]: {
    value: '15',
    description: 'Default recommended per-minute chat rate for new mentors',
    type: 'number',
  },
  [CONFIG_KEYS.DEFAULT_CALL_PRICE]: {
    value: '15',
    description: 'Default recommended per-minute call consultation rate for new mentors',
    type: 'number',
  },
  [CONFIG_KEYS.NOTIFICATIONS_ENABLED]: {
    value: 'true',
    description: 'Global system notification status (true/false)',
    type: 'boolean',
  },
  [CONFIG_KEYS.FREE_TRIAL_ENABLED]: {
    value: 'true',
    description: 'Global free trial offer status for new users',
    type: 'boolean',
  },
  [CONFIG_KEYS.COMMUNITY_ENABLED]: {
    value: 'true',
    description: 'Enable or disable the Community feature platform-wide',
    type: 'boolean',
  },
  [CONFIG_KEYS.CONTACT_FORM_URL]: {
    value: 'https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_GOOGLE_FORM/viewform?embedded=true',
    description: 'Google Form or feedback embed URL displayed on the Contact Us page',
    type: 'string',
  },
};

/**
 * Retrieves a configuration value from DB with fallback defaults.
 */
export async function getPlatformConfig(key: string): Promise<string> {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { key },
    });

    if (config) {
      return config.value;
    }
  } catch (error) {
    console.error(`Error fetching config for key ${key}:`, error);
  }

  return DEFAULT_CONFIGS[key]?.value ?? '';
}

/**
 * Retrieves a numeric config value.
 */
export async function getPlatformConfigNumber(key: string): Promise<number> {
  const value = await getPlatformConfig(key);
  const num = parseFloat(value);
  if (isNaN(num)) {
    return parseFloat(DEFAULT_CONFIGS[key]?.value ?? '0');
  }
  return num;
}

/**
 * Retrieves a boolean config value.
 */
export async function getPlatformConfigBoolean(key: string): Promise<boolean> {
  const value = await getPlatformConfig(key);
  return value.toLowerCase() === 'true';
}

/**
 * Initializes or updates platform configs with default entries if missing.
 */
export async function seedPlatformConfigs() {
  for (const [key, meta] of Object.entries(DEFAULT_CONFIGS)) {
    await prisma.platformConfig.upsert({
      where: { key },
      update: {},
      create: {
        key,
        value: meta.value,
        description: meta.description,
        type: meta.type,
      },
    });
  }
}
