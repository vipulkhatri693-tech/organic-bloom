import React from 'react';
import { X, QrCode } from 'lucide-react';
import { PhonePeQRCard } from './PhonePeQRCard';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121214] rounded-2xl shadow-2xl border border-[#2B2B32] overflow-hidden animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#202026] text-[#A0A0AA] hover:text-white hover:bg-[#2B2B34] flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-2">
          <PhonePeQRCard />
        </div>

        <div className="bg-[#18181E] px-5 py-3 border-t border-[#222228] text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#263E2E] hover:bg-[#1E3224] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
