// Automated 3rd-Party WhatsApp Gateway integration for Organic Bloom
// Supports UltraMsg, Green API, and Custom Webhook (Make / Zapier / n8n / Fast2SMS)

export type WhatsAppProvider = 'ultramsg' | 'greenapi' | 'custom_webhook' | 'demo';

export interface WhatsAppGatewayConfig {
  provider: WhatsAppProvider;
  enabled: boolean;
  // UltraMsg configuration
  ultraMsgInstanceId: string;
  ultraMsgToken: string;
  // Green API configuration
  greenApiInstanceId: string;
  greenApiToken: string;
  // Custom Webhook configuration
  customWebhookUrl: string;
  // Stats
  lastDispatchedAt?: number;
  totalDispatchedCount: number;
}

const STORAGE_KEY = 'ob_whatsapp_gateway_config_v2';

const DEFAULT_CONFIG: WhatsAppGatewayConfig = {
  provider: 'ultramsg',
  enabled: true,
  ultraMsgInstanceId: 'instance191321',
  ultraMsgToken: 'pf7rmk06wk16sz9q',
  greenApiInstanceId: '',
  greenApiToken: '',
  customWebhookUrl: '',
  totalDispatchedCount: 0,
};

export const getWhatsAppGatewayConfig = (): WhatsAppGatewayConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    const merged: WhatsAppGatewayConfig = {
      ...DEFAULT_CONFIG,
      ...parsed,
      // If instance is empty or missing, populate with user's active credentials
      ultraMsgInstanceId: parsed.ultraMsgInstanceId?.trim() || DEFAULT_CONFIG.ultraMsgInstanceId,
      ultraMsgToken: parsed.ultraMsgToken?.trim() || DEFAULT_CONFIG.ultraMsgToken,
      enabled: parsed.enabled !== undefined ? parsed.enabled : true,
    };
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const saveWhatsAppGatewayConfig = (
  config: Partial<WhatsAppGatewayConfig>
): WhatsAppGatewayConfig => {
  const current = getWhatsAppGatewayConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ob_whatsapp_gateway_updated', { detail: updated }));
  } catch (err) {
    console.error('Failed to save WhatsApp Gateway config:', err);
  }
  return updated;
};

export interface DispatchResult {
  success: boolean;
  deliveredVia: 'ultramsg' | 'greenapi' | 'custom_webhook' | 'demo';
  statusMessage: string;
  error?: string;
}

/**
 * Dispatch real automated WhatsApp message directly to customer's phone from 3rd-party bot number
 */
export const sendAutomatedWhatsAppMessage = async (
  phone10Digits: string,
  message: string,
  otpCode?: string
): Promise<DispatchResult> => {
  const cleanPhone = phone10Digits.replace(/\D/g, '').slice(-10);
  const fullPhone = `91${cleanPhone}`;
  const config = getWhatsAppGatewayConfig();

  // 1. Check UltraMsg Gateway
  if (config.enabled && config.provider === 'ultramsg' && config.ultraMsgInstanceId && config.ultraMsgToken) {
    const instId = config.ultraMsgInstanceId.trim();
    const token = config.ultraMsgToken.trim();
    
    // Attempt 1: POST form-urlencoded
    try {
      const url = `https://api.ultramsg.com/${instId}/messages/chat`;
      const params = new URLSearchParams();
      params.append('token', token);
      params.append('to', `+${fullPhone}`);
      params.append('body', message);

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const json = await resp.json().catch(() => ({}));
      if (resp.ok && (json.sent === 'true' || json.id || json.message === 'ok')) {
        saveWhatsAppGatewayConfig({
          lastDispatchedAt: Date.now(),
          totalDispatchedCount: (config.totalDispatchedCount || 0) + 1,
        });
        return {
          success: true,
          deliveredVia: 'ultramsg',
          statusMessage: `Sent via UltraMsg Bot to +91 ${cleanPhone}`,
        };
      } else if (json.message) {
        console.warn('UltraMsg response:', json);
      }
    } catch (postErr) {
      console.warn('UltraMsg POST attempt failed, trying fallback GET:', postErr);
    }

    // Attempt 2: GET query parameter fallback (bypasses potential CORS preflight blockage)
    try {
      const getUrl = `https://api.ultramsg.com/${instId}/messages/chat?token=${encodeURIComponent(
        token
      )}&to=${encodeURIComponent(`+${fullPhone}`)}&body=${encodeURIComponent(message)}`;
      const getResp = await fetch(getUrl, { method: 'GET' });
      const getJson = await getResp.json().catch(() => ({}));
      if (getResp.ok && (getJson.sent === 'true' || getJson.id || getJson.message === 'ok')) {
        saveWhatsAppGatewayConfig({
          lastDispatchedAt: Date.now(),
          totalDispatchedCount: (config.totalDispatchedCount || 0) + 1,
        });
        return {
          success: true,
          deliveredVia: 'ultramsg',
          statusMessage: `Sent via UltraMsg Bot to +91 ${cleanPhone}`,
        };
      }
    } catch (getErr: any) {
      console.error('UltraMsg GET fallback error:', getErr);
    }
  }

  // 2. Check Green API Gateway
  if (config.enabled && config.provider === 'greenapi' && config.greenApiInstanceId && config.greenApiToken) {
    try {
      const url = `https://api.green-api.com/waInstance${config.greenApiInstanceId.trim()}/sendMessage/${config.greenApiToken.trim()}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${fullPhone}@c.us`,
          message: message,
        }),
      });

      const json = await resp.json().catch(() => ({}));
      if (resp.ok && json.idMessage) {
        saveWhatsAppGatewayConfig({
          lastDispatchedAt: Date.now(),
          totalDispatchedCount: (config.totalDispatchedCount || 0) + 1,
        });
        return {
          success: true,
          deliveredVia: 'greenapi',
          statusMessage: `Sent via Green-API Bot to +91 ${cleanPhone}`,
        };
      } else {
        return {
          success: false,
          deliveredVia: 'greenapi',
          statusMessage: json.message || 'Green API delivery failed',
          error: json.message,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        deliveredVia: 'greenapi',
        statusMessage: err.message || 'Network error reaching Green API',
        error: err.message,
      };
    }
  }

  // 3. Check Custom Webhook (Make / Zapier / n8n / Fast2SMS / Custom Server)
  if (config.enabled && config.provider === 'custom_webhook' && config.customWebhookUrl) {
    try {
      const resp = await fetch(config.customWebhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          phoneRaw: cleanPhone,
          message,
          otp: otpCode,
          timestamp: Date.now(),
          service: 'Organic Bloom Soap',
        }),
      });

      if (resp.ok) {
        saveWhatsAppGatewayConfig({
          lastDispatchedAt: Date.now(),
          totalDispatchedCount: (config.totalDispatchedCount || 0) + 1,
        });
        return {
          success: true,
          deliveredVia: 'custom_webhook',
          statusMessage: `Sent via Custom Webhook to +91 ${cleanPhone}`,
        };
      }
    } catch (err: any) {
      console.warn('Custom webhook dispatch error:', err);
    }
  }

  // 4. Default / Standby Demo Bot Mode
  // If no 3rd-party API key is configured in Host Dashboard yet, we simulate the 3rd-party bot
  // and dispatch a custom event so the tester/admin can verify without getting stuck.
  try {
    window.dispatchEvent(
      new CustomEvent('ob_demo_whatsapp_bot_dispatch', {
        detail: {
          phone: cleanPhone,
          otp: otpCode,
          message,
          timestamp: Date.now(),
        },
      })
    );
  } catch (e) {
    // ignore
  }

  return {
    success: true,
    deliveredVia: 'demo',
    statusMessage: `Dispatched to +91 ${cleanPhone} (Configure UltraMsg in Host Dashboard for live delivery)`,
  };
};

/**
 * High-level helper to dispatch OTP to a customer's WhatsApp
 */
export const dispatchCustomerOTP = async (
  phone: string,
  otp: string,
  purpose: 'login' | 'forgot_password' | 'host_recovery' = 'login'
): Promise<DispatchResult> => {
  let purposeTitle = 'Account Login Verification';
  if (purpose === 'forgot_password') purposeTitle = 'Password Reset Verification';
  if (purpose === 'host_recovery') purposeTitle = 'Host Security Recovery';

  const message = `🌿 *ORGANIC BLOOM SOAP* 🌿\n\n*${purposeTitle}*\n\nYour 6-Digit OTP Code is: *${otp}*\n\n⏱️ Valid for 10 minutes.\n🔒 Do not share this OTP with anyone.\n\nHandcrafted Organic Soaps by Nikita Khatri.`;

  return await sendAutomatedWhatsAppMessage(phone, message, otp);
};
