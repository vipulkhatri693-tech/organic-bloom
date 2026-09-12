import React, { useState, useEffect } from 'react';
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  getWhatsAppGatewayConfig,
  saveWhatsAppGatewayConfig,
  sendAutomatedWhatsAppMessage,
  type WhatsAppGatewayConfig,
  type WhatsAppProvider,
} from '../utils/whatsappGateway';

interface WhatsAppGatewaySettingsProps {
  hostPhone?: string;
}

export const WhatsAppGatewaySettings: React.FC<WhatsAppGatewaySettingsProps> = ({
  hostPhone = '9313268959',
}) => {
  const [config, setConfig] = useState<WhatsAppGatewayConfig>(getWhatsAppGatewayConfig());
  const [testPhone, setTestPhone] = useState(hostPhone);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getWhatsAppGatewayConfig());
    };
    window.addEventListener('ob_whatsapp_gateway_updated', handleUpdate);
    return () => {
      window.removeEventListener('ob_whatsapp_gateway_updated', handleUpdate);
    };
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveWhatsAppGatewayConfig(config);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleTestSend = async () => {
    setTestResult(null);
    const clean = testPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setTestResult({
        success: false,
        message: 'Please enter a valid 10-digit mobile number for test dispatch.',
      });
      return;
    }

    setIsTesting(true);
    try {
      const testMsg = `🌿 *ORGANIC BLOOM TEST MESSAGE* 🌿\n\n🎉 Success! Your automated 3rd-party WhatsApp Bot is working perfectly.\n\nTime: ${new Date().toLocaleTimeString('en-IN')}\nProvider: ${config.provider.toUpperCase()}`;
      const res = await sendAutomatedWhatsAppMessage(clean, testMsg, '999888');

      if (res.success) {
        setTestResult({
          success: true,
          message: res.statusMessage || `Test WhatsApp message sent to +91 ${clean}! Check your phone.`,
        });
      } else {
        setTestResult({
          success: false,
          message: res.statusMessage || res.error || 'Failed to dispatch test message. Check your API credentials.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error communicating with WhatsApp Gateway API.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in text-xs">
      {/* Header Banner */}
      <div className="bg-[#1C2C20] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white">
                  3rd-Party Automated WhatsApp Bot Gateway
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    config.enabled
                      ? 'bg-[#25D366] text-white'
                      : 'bg-[#F59E0B] text-black'
                  }`}
                >
                  {config.enabled ? '● Gateway Active' : '○ Standby Mode'}
                </span>
              </div>
              <p className="text-xs text-[#C5BBAA] mt-1 max-w-2xl leading-relaxed">
                Send OTPs and order status updates <strong>directly into customer WhatsApp inboxes</strong> automatically from a 3rd-party bot number — customer ko koi link ya host chat kholne ki zaroorat nahi padti!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !config.enabled;
                const updated = { ...config, enabled: next };
                setConfig(updated);
                saveWhatsAppGatewayConfig(updated);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                config.enabled
                  ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                  : 'bg-[#25D366] hover:bg-[#1EBE5D] text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{config.enabled ? 'Deactivate Bot' : 'Activate Live Bot'}</span>
            </button>
          </div>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-[#166534] font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          <span>WhatsApp Gateway credentials saved successfully!</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-[#DDD3C2] p-5 shadow-2xs space-y-5">
        <div>
          <label className="block text-xs font-bold text-[#1C2C20] mb-2">
            Select Automated WhatsApp Provider:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* UltraMsg */}
            <div
              onClick={() => setConfig({ ...config, provider: 'ultramsg' })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                config.provider === 'ultramsg'
                  ? 'bg-[#F0FDF4] border-[#25D366] ring-2 ring-[#25D366]/30'
                  : 'bg-[#FAF7F2] border-[#DDD3C2] hover:border-[#86EFAC]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-[#166534]">UltraMsg (Recommended)</span>
                <Radio className={`w-4 h-4 ${config.provider === 'ultramsg' ? 'text-[#25D366]' : 'text-[#A8A29E]'}`} />
              </div>
              <p className="text-[11px] text-[#4B5563] leading-normal">
                100% Free Sandbox. Direct REST API, 1-click QR link to any phone, super reliable.
              </p>
              <span className="inline-block mt-2 text-[10px] bg-[#DCFCE7] text-[#15803D] font-bold px-2 py-0.5 rounded">
                ⚡ Fastest 2-Min Setup
              </span>
            </div>

            {/* Green API */}
            <div
              onClick={() => setConfig({ ...config, provider: 'greenapi' })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                config.provider === 'greenapi'
                  ? 'bg-[#F0FDF4] border-[#25D366] ring-2 ring-[#25D366]/30'
                  : 'bg-[#FAF7F2] border-[#DDD3C2] hover:border-[#86EFAC]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-[#166534]">Green API</span>
                <Radio className={`w-4 h-4 ${config.provider === 'greenapi' ? 'text-[#25D366]' : 'text-[#A8A29E]'}`} />
              </div>
              <p className="text-[11px] text-[#4B5563] leading-normal">
                Free Developer Instance. Automated message dispatch via Green API gateway.
              </p>
              <span className="inline-block mt-2 text-[10px] bg-[#E0E7FF] text-[#3730A3] font-bold px-2 py-0.5 rounded">
                Developer Tier
              </span>
            </div>

            {/* Custom Webhook */}
            <div
              onClick={() => setConfig({ ...config, provider: 'custom_webhook' })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                config.provider === 'custom_webhook'
                  ? 'bg-[#F0FDF4] border-[#25D366] ring-2 ring-[#25D366]/30'
                  : 'bg-[#FAF7F2] border-[#DDD3C2] hover:border-[#86EFAC]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-[#166534]">Custom Webhook / Zapier</span>
                <Radio className={`w-4 h-4 ${config.provider === 'custom_webhook' ? 'text-[#25D366]' : 'text-[#A8A29E]'}`} />
              </div>
              <p className="text-[11px] text-[#4B5563] leading-normal">
                Connect your own Make.com, n8n, Pabbly, or custom backend endpoint.
              </p>
              <span className="inline-block mt-2 text-[10px] bg-[#FEF3C7] text-[#92400E] font-bold px-2 py-0.5 rounded">
                Custom Integrations
              </span>
            </div>
          </div>
        </div>

        {/* Credentials Form based on provider */}
        <form onSubmit={handleSave} className="space-y-4 pt-3 border-t border-[#F0EBE1]">
          {config.provider === 'ultramsg' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#2C2926]">UltraMsg Instance ID *</label>
                  <a
                    href="https://ultramsg.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#25D366] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Get Free on UltraMsg.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  value={config.ultraMsgInstanceId}
                  onChange={(e) => setConfig({ ...config, ultraMsgInstanceId: e.target.value })}
                  placeholder="e.g. instance10492"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs font-mono focus:outline-none focus:border-[#25D366]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2C2926] mb-1">UltraMsg Token / API Key *</label>
                <input
                  type="password"
                  value={config.ultraMsgToken}
                  onChange={(e) => setConfig({ ...config, ultraMsgToken: e.target.value })}
                  placeholder="Paste UltraMsg token here"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs font-mono focus:outline-none focus:border-[#25D366]"
                />
              </div>
            </div>
          )}

          {config.provider === 'greenapi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#2C2926]">Green API IdInstance *</label>
                  <a
                    href="https://green-api.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#25D366] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Get Free on Green-API.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  value={config.greenApiInstanceId}
                  onChange={(e) => setConfig({ ...config, greenApiInstanceId: e.target.value })}
                  placeholder="e.g. 1101928491"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs font-mono focus:outline-none focus:border-[#25D366]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2C2926] mb-1">Green API apiTokenInstance *</label>
                <input
                  type="password"
                  value={config.greenApiToken}
                  onChange={(e) => setConfig({ ...config, greenApiToken: e.target.value })}
                  placeholder="Paste Green API Token"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs font-mono focus:outline-none focus:border-[#25D366]"
                />
              </div>
            </div>
          )}

          {config.provider === 'custom_webhook' && (
            <div>
              <label className="block font-bold text-[#2C2926] mb-1">Custom Webhook Endpoint URL *</label>
              <input
                type="url"
                value={config.customWebhookUrl}
                onChange={(e) => setConfig({ ...config, customWebhookUrl: e.target.value })}
                placeholder="https://hook.eu1.make.com/your-webhook-id"
                className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs font-mono focus:outline-none focus:border-[#25D366]"
              />
              <p className="text-[11px] text-[#7A7265] mt-1">
                JSON payload sent on dispatch: <code>{`{ "phone": "919313268959", "otp": "582914", "message": "..." }`}</code>
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-[#696053]">
              Dispatched count: <strong className="text-[#1C2C20]">{config.totalDispatchedCount || 0}</strong> messages
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#263E2E] hover:bg-[#1A2E20] text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#E3B873]" />
              <span>Save Bot Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Test Dispatcher */}
      <div className="bg-[#FAF7F2] rounded-2xl border border-[#DDD3C2] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-[#25D366]" />
          <h4 className="font-bold text-xs text-[#1C2C20]">
            Live Test: Send Instant Verification Message to WhatsApp
          </h4>
        </div>
        <p className="text-[11px] text-[#696053]">
          Apna mobile number daal kar test karein ki bot message seedhe aapke WhatsApp par aa raha hai ya nahi:
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[#696053]">
              +91
            </span>
            <input
              type="tel"
              maxLength={10}
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="9313268959"
              className="w-full pl-11 pr-3 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs font-mono font-bold text-[#1C2C20] focus:outline-none focus:border-[#25D366]"
            />
          </div>

          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestSend}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending to WhatsApp...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test WhatsApp Message</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 animate-fade-in ${
              testResult.success
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#15803D]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
            )}
            <div className="text-xs leading-relaxed">
              <strong className="block mb-0.5">
                {testResult.success ? 'Success!' : 'Dispatch Notice'}
              </strong>
              <span>{testResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2-Minute Setup Guide (Hindi / Hinglish) */}
      <div className="bg-white rounded-2xl border border-[#DDD3C2] p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#1C2C20]">
          <HelpCircle className="w-4 h-4 text-[#263E2E]" />
          <h4 className="font-bold text-xs">
            2-Minute Free Setup Guide (Customer ko automatic WhatsApp OTP bhejne ke liye)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#4A433A]">
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E9E0D4] space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#263E2E] text-white text-[11px] font-bold flex items-center justify-center">
              1
            </div>
            <strong className="block text-[#1C2C20]">Free Account Banayein</strong>
            <p className="text-[11px] text-[#696053] leading-relaxed">
              <a
                href="https://ultramsg.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#25D366] font-bold underline"
              >
                ultramsg.com
              </a>{' '}
              par jakar Sign Up karein. Instant 100% Free Sandbox instance create ho jayega.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E9E0D4] space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#263E2E] text-white text-[11px] font-bold flex items-center justify-center">
              2
            </div>
            <strong className="block text-[#1C2C20]">WhatsApp QR Scan Karein</strong>
            <p className="text-[11px] text-[#696053] leading-relaxed">
              UltraMsg screen par QR Code aayega. Apne kisi bhi phone me WhatsApp kholkar <strong>Linked Devices</strong> se scan kar dein.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E9E0D4] space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#263E2E] text-white text-[11px] font-bold flex items-center justify-center">
              3
            </div>
            <strong className="block text-[#1C2C20]">Instance &amp; Token Paste Karein</strong>
            <p className="text-[11px] text-[#696053] leading-relaxed">
              Wahan se <strong>Instance ID</strong> aur <strong>Token</strong> copy karke upar paste karein aur &quot;Activate Live Bot&quot; on kar dein!
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#E5EFE6] border border-[#86EFAC] rounded-xl flex items-center gap-2 text-xs text-[#166534]">
          <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
          <span>
            Jaise hi ye save hoga, har customer ke phone me seedhe unke WhatsApp par bina kisi link click ke automatic 6-digit OTP code deliver hone lagega!
          </span>
        </div>
      </div>
    </div>
  );
};
