import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { BRAND_INFO } from "../data/soaps";

export const PhonePeQRCard = ({
  amount,
  orderNumber,
  className = "",
  onPaymentReport,
  onPaymentSuccess,
}) => {
  const [selectedUpiId, setSelectedUpiId] = useState("khatrinikita03@ybl");
  const [copiedId, setCopiedId] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("/images/phonepe-qr.svg");
  const [utrNumber, setUtrNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [utrError, setUtrError] = useState(null);

  const upiList = BRAND_INFO.upiIds || [
    { id: "khatrinikita03@ybl", label: "Primary (YBL)" },
    { id: "khatrinikita03@ibl", label: "ICICI Handle (IBL)" },
    { id: "khatrinikita03@axl", label: "Axis Handle (AXL)" },
  ];

  // Construct NPCI Standard UPI Payload
  const note = encodeURIComponent(
    `Organic Bloom ${orderNumber ? `#${orderNumber}` : "Soap Order"}`,
  );
  const amountParam = amount ? `&am=${amount}` : "";
  const upiPayload = `upi://pay?pa=${selectedUpiId}&pn=Nikita%20Khatri&cu=INR${amountParam}&tn=${note}`;

  useEffect(() => {
    // Generate fresh high-res QR code with H error correction
    QRCode.toDataURL(upiPayload, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 320,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("QR code generation error:", err);
      });
  }, [upiPayload]);

  const handleCopy = (idToCopy) => {
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(idToCopy);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmPayment = () => {
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setUtrError(
        "Please enter your 12-digit UTR or Transaction ID from PhonePe.",
      );
      return;
    }
    setUtrError(null);
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);

      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess({
            transactionId: cleanUtr,
            upiId: selectedUpiId,
          });
        }
        if (onPaymentReport) {
          onPaymentReport();
        }
      }, 500);
    }, 900);
  };

  return (
    <div
      id="phonepe-qr-card"
      className={`bg-[#121214] text-white rounded-2xl p-5 border border-[#2B2B32] shadow-xl max-w-md mx-auto ${className}`}
    >
      {/* Top Header matching user's PhonePe screenshot */}
      <div className="flex items-start justify-between pb-3 border-b border-[#222228]">
        <div>
          <h3 className="text-base font-bold text-white leading-tight">
            Receive Money
          </h3>
          <p className="text-[11px] text-[#9E9EA5] mt-0.5">From any UPI app</p>
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5F259F] text-white">
            PhonePe
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#1B365D] text-white">
            BHIM
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#2C2C34] text-white">
            GPay
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#002E6E] text-[#00BAF2]">
            Paytm
          </span>
        </div>
      </div>

      {/* Bank details pill */}
      <div className="my-3 py-2 px-3 bg-[#1C1C22] rounded-xl border border-[#2B2B32] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* HDFC Bank Logo glyph */}
          <div className="w-6 h-6 rounded bg-[#ED232A] p-1 flex items-center justify-center shrink-0">
            <div className="w-3.5 h-3.5 bg-[#004C8F] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white"></div>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              HDFC Bank - 6686
            </span>
            <span className="text-[10px] text-[#A0A0AA] block">
              Payee: Nikita Khatri
            </span>
          </div>
        </div>
        {amount && (
          <div className="text-right">
            <span className="text-[10px] text-[#9E9EA5] block uppercase tracking-wider">
              Amount Due
            </span>
            <span className="text-sm font-bold text-[#4ADE80]">₹{amount}</span>
          </div>
        )}
      </div>

      {/* Interactive QR Code Container */}
      <div className="relative bg-white p-4 rounded-xl shadow-inner mx-auto w-56 sm:w-60 aspect-square flex items-center justify-center my-3">
        <img
          src={qrDataUrl}
          alt="PhonePe QR Code Nikita Khatri"
          className="w-full h-full object-contain"
        />

        {/* Center PhonePe 'पे' Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-[#5F259F] border-[3px] border-white flex items-center justify-center shadow-md">
            <span className="text-white font-black text-lg leading-none select-none">
              पे
            </span>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#A5A5AF] mb-3">
        Scan with PhonePe, Google Pay, Paytm, BHIM or any UPI App
      </p>

      {/* Quick Deep Link Launchers on Mobile */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <a
          href={`phonepe://pay?pa=${selectedUpiId}&pn=Nikita%20Khatri&cu=INR${amountParam}&tn=${note}`}
          className="py-2.5 px-3 rounded-xl bg-[#5F259F] hover:bg-[#4E1E83] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
        >
          <span>Pay via PhonePe</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={upiPayload}
          className="py-2.5 px-3 rounded-xl bg-[#25252D] hover:bg-[#30303A] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 border border-[#3A3A45] transition-all shadow-sm active:scale-95"
        >
          <span>Any UPI App</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Payment Confirmation & Mandatory UTR / Transaction ID */}
      <div className="p-3.5 bg-[#1C1C24] rounded-xl border border-[#353542] mb-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#4ADE80] font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Enter UTR / Transaction ID (Mandatory)</span>
          </div>
          <span className="text-[10px] text-[#A5A5B5] bg-[#2A2A36] px-2 py-0.5 rounded">
            Required for Verification
          </span>
        </div>

        <div>
          <label className="block text-[11px] text-[#C4C4D0] mb-1 font-medium">
            Paste 12-digit UTR No. or Txn ID from your PhonePe receipt *
          </label>
          <input
            type="text"
            required
            value={utrNumber}
            onChange={(e) => {
              setUtrNumber(e.target.value);
              if (utrError) setUtrError(null);
            }}
            placeholder="e.g. 423987123456 or T240908123456"
            className="w-full bg-[#121216] border border-[#3E3E4E] rounded-lg px-3 py-2 text-xs text-white placeholder-[#70707D] font-mono tracking-wider focus:outline-none focus:border-[#5F259F] focus:ring-1 focus:ring-[#5F259F]"
          />

          {utrError && (
            <p className="text-[11px] text-[#F87171] mt-1 font-medium">
              ⚠️ {utrError}
            </p>
          )}
          <p className="text-[10px] text-[#9090A0] mt-1 leading-normal">
            ℹ️ The host will cross-verify this UTR in PhonePe before confirming
            and dispatching your hand-cured soaps.
          </p>
        </div>

        <button
          type="button"
          disabled={isVerifying || isVerified}
          onClick={handleConfirmPayment}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            isVerified
              ? "bg-[#15803D] text-white"
              : isVerifying
                ? "bg-[#3A3A45] text-[#D0D0D8]"
                : "bg-gradient-to-r from-[#5F259F] to-[#7B32C7] hover:from-[#4E1E83] hover:to-[#5F259F] text-white active:scale-98"
          }`}
        >
          {isVerifying ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Submitting UTR for Host Verification...</span>
            </>
          ) : isVerified ? (
            <>
              <Check className="w-4 h-4 text-white stroke-[3]" />
              <span>UTR Submitted! Placing Order...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Submit UTR &amp; Place Order</span>
            </>
          )}
        </button>
      </div>

      {/* UPI IDs List with Copy buttons - Exact replica of screenshot */}
      <div className="pt-3 border-t border-[#222228] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#A5A5AF] tracking-wider uppercase">
            UPI IDs
          </span>
          <span className="text-[10px] text-[#9D65E0] font-semibold">
            Click to Copy / Select
          </span>
        </div>

        <div className="space-y-1.5">
          {upiList.map((item) => {
            const isSelected = selectedUpiId === item.id;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedUpiId(item.id)}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#1D1828] border-[#5F259F]/60 text-white"
                    : "bg-[#18181D] border-[#25252C] text-[#C0C0C8] hover:bg-[#202026]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-[#9D65E0]" : "bg-[#404048]"
                    }`}
                  />

                  <div className="text-left">
                    <span className="font-mono text-xs font-bold block text-white">
                      {item.id}
                    </span>
                    <span className="text-[10px] text-[#858590] block">
                      {item.label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(item.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    isCopied
                      ? "bg-[#15803D] text-white"
                      : "bg-[#2A2A32] text-white hover:bg-[#383842]"
                  }`}
                  title="Copy UPI ID"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#B0B0BA]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Powered by UPI Footer */}
      <div className="mt-4 pt-3 border-t border-[#222228] flex items-center justify-between text-[10px] text-[#7E7E8A]">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
          <span>Verified Merchant Account</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-white tracking-widest uppercase">
          <span>POWERED BY</span>
          <span className="text-[#4ADE80]">UPI ▶</span>
        </div>
      </div>
    </div>
  );
};
