import { useEffect } from 'react';

interface AdBannerProps {
  slot: string;
  client?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ slot, client = "ca-pub-XXXXXXXXXXXXXXXX", className = "" }: AdBannerProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className={`flex justify-center items-center overflow-hidden bg-gray-900/20 border border-gray-800/50 rounded-xl ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '120px', minHeight: '600px' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="vertical"
        data-full-width-responsive="true"
      />
      {/* Placeholder visual para desenvolvimento se não houver ID real */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <span className="text-[10px] font-bold uppercase tracking-widest rotate-90">Google Ads</span>
      </div>
    </div>
  );
}
