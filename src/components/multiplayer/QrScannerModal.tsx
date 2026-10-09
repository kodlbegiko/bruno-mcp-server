import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export function extractRoomCode(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const room = url.searchParams.get('room');
    if (room) return room.toUpperCase().trim();
  } catch {
    // Not a valid URL, treat as raw room code
  }
  // If it's something like '?room=ABCDEF'
  const match = trimmed.match(/[?&]room=([A-Za-z0-9_-]+)/i);
  if (match) return match[1].toUpperCase();

  return trimmed.toUpperCase();
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-camera-reader';

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setCameraError(null);
    setIsScanning(false);

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(readerElementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!mounted) return;
            const code = extractRoomCode(decodedText);
            // Stop scanning and trigger success callback
            scanner
              .stop()
              .then(() => {
                scanner.clear();
                onScanSuccess(code);
                onClose();
              })
              .catch(() => {
                onScanSuccess(code);
                onClose();
              });
          },
          () => {
            // Frame scan failure (no QR code in frame), quiet ignore
          }
        );

        if (mounted) {
          setIsScanning(true);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('Camera QR Scan start error:', err);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? '相機權限被拒絕。請至瀏覽器設定允許存取相機以掃描 QR Code。'
            : '無法啟動相機。請確認設備具有可用鏡頭，或改用手動輸入代碼。'
        );
      }
    };

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(startScanner, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="掃描房間 QR Code">
      <div className="flex flex-col items-center text-center space-y-4">
        <p className="text-xs text-ink-600 dark:text-stone-300 font-serif leading-relaxed">
          將鏡頭對準房主手機畫面上的 QR Code，即可自動填入房間代碼並加入。
        </p>

        {/* Camera container */}
        <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black/90 border-2 border-dashed border-paper-border dark:border-stone-700 flex items-center justify-center">
          <div id={readerElementId} className="w-full h-full" />

          {/* Scanner aiming reticle overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-amber-400/80 rounded-xl relative animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 p-4 bg-paper-100/95 dark:bg-stone-800/95 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-2xl">📷</span>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-sans leading-relaxed">
                {cameraError}
              </p>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" fullWidth onClick={onClose}>
          取消返回
        </Button>
      </div>
    </Modal>
  );
};
