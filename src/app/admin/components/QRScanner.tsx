'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Keyboard, Check, X, Loader2 } from 'lucide-react';

interface ScanResult {
  success: boolean;
  user?: {
    full_name: string;
    member_id: string;
    avatar_url: string | null;
  };
  attendance?: {
    id: number;
    attended_on: string;
    scanned_at: string;
  };
  error?: string;
}

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner';

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const startScanner = async () => {
    try {
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Stop scanning after successful scan
          if (scannerRef.current && isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
          }
          
          // Process the scanned token
          await processToken(decodedText);
        },
        () => {
          // Ignore errors during scanning
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      alert('Failed to start camera. Please ensure camera permissions are granted.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  const processToken = async (token: string) => {
    setLoading(true);
    setScanResult(null);

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setScanResult({
          success: false,
          error: data.error || 'Failed to process QR code',
        });
      } else {
        setScanResult({
          success: true,
          user: data.user,
          attendance: data.attendance,
        });
      }
    } catch {
      setScanResult({
        success: false,
        error: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      await processToken(manualToken.trim());
      setManualToken('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Camera Scanner
          </CardTitle>
          <CardDescription className="text-slate-400">
            Point your camera at a team member&apos;s QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              id={scannerContainerId}
              className={`w-full max-w-md mx-auto bg-slate-900 rounded-lg overflow-hidden ${
                isScanning ? 'block' : 'hidden'
              }`}
            />
            
            <div className="flex justify-center gap-4">
              {!isScanning ? (
                <Button
                  onClick={startScanner}
                  className="bg-cyan-600 hover:bg-cyan-700"
                  disabled={loading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanner
                </Button>
              ) : (
                <Button
                  onClick={stopScanner}
                  variant="destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop Scanner
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Manual Entry
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter the QR code token manually if camera scanning fails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Enter QR token..."
              className="bg-slate-700/50 border-slate-600 text-white"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !manualToken.trim()}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Submit'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result Section */}
      {scanResult && (
        <Card className={`bg-slate-800/50 border-slate-700 ${
          scanResult.success ? 'border-green-500/50' : 'border-red-500/50'
        }`}>
          <CardHeader>
            <CardTitle className={`text-white flex items-center gap-2 ${
              scanResult.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {scanResult.success ? (
                <>
                  <Check className="w-5 h-5" />
                  Attendance Recorded
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Scan Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanResult.success && scanResult.user ? (
              <div className="space-y-2">
                <p className="text-white">
                  <span className="text-slate-400">Name:</span>{' '}
                  {scanResult.user.full_name}
                </p>
                <p className="text-white">
                  <span className="text-slate-400">Member ID:</span>{' '}
                  {scanResult.user.member_id}
                </p>
                {scanResult.attendance && (
                  <p className="text-white">
                    <span className="text-slate-400">Time:</span>{' '}
                    {new Date(scanResult.attendance.scanned_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-400">{scanResult.error}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
