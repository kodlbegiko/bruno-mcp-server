import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, roomCode }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${roomCode}`
    : `https://deeply-know-someone.vercel.app/?room=${roomCode}`;

  useEffect(() => {
    if (isOpen && roomCode) {
      QRCode.toDataURL(shareUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#1C1917',
          light: '#FBF9F5',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, roomCode, shareUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="邀請朋友加入房間">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        <div className="bg-paper-100 p-3 rounded-2xl border border-paper-border shadow-xs">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="房間 QR Code" className="w-56 h-56 rounded-xl mx-auto" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-ink-400">
              產生 QR Code 中...
            </div>
          )}
        </div>

        <div>
          <span className="text-xs text-ink-500 font-sans block mb-1">房間代碼</span>
          <span className="text-2xl font-mono font-bold tracking-widest text-ink-900 bg-paper-200/80 px-4 py-1.5 rounded-xl border border-paper-border">
            {roomCode}
          </span>
        </div>

        <p className="text-xs text-ink-600 font-serif leading-relaxed max-w-xs">
          朋友用手機相機掃描 QR Code，即可直接打開遊戲並自動加入房間！
        </p>

        <div className="w-full pt-2 flex flex-col gap-2">
          <Button variant="primary" size="md" fullWidth onClick={handleCopyLink}>
            {copied ? '已複製專屬加入連結！' : '複製分享連結'}
          </Button>
          <Button variant="ghost" size="sm" fullWidth onClick={onClose}>
            關閉
          </Button>
        </div>
      </div>
    </Modal>
  );
};
