'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // ESC key to close
  useEscapeKey(onClose);

  useEffect(() => {
    const startScanning = async () => {
      try {
        setIsScanning(true);
        setError(null);

        // Create reader instance
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        // Get available video devices
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError('No camera found on this device');
          setIsScanning(false);
          return;
        }

        // Use the first available camera (or back camera on mobile if available)
        const selectedDeviceId = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back')
        )?.deviceId || videoInputDevices[0].deviceId;

        // Start continuous scanning
        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              // Successfully scanned a barcode
              const barcodeText = result.getText();
              onScan(barcodeText);
              
              // Stop scanning after successful scan
              if (readerRef.current) {
                readerRef.current.reset();
              }
              setIsScanning(false);
            }
            
            if (err && !(err instanceof NotFoundException)) {
              console.error('Scanning error:', err);
            }
          }
        );
      } catch (err) {
        console.error('Failed to start scanning:', err);
        setError('Failed to access camera. Please check permissions.');
        setIsScanning(false);
      }
    };

    startScanning();

    // Cleanup function
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-96 object-cover"
            playsInline
          />
          
          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-4 border-green-500 rounded-lg w-64 h-48 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-scan"></div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions/Error */}
        <div className="p-4">
          {error ? (
            <div className="bg-red-100 text-red-800 p-3 rounded-md">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md">
              <p className="text-sm">
                Position the barcode within the frame. The scanner will automatically detect and read it.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }
        
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

