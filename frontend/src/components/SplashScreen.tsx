import { useEffect, useState } from "react";

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fading out after 1.8 seconds for a snappy feel
    const fadeOutTimer = setTimeout(() => {
      setIsFading(true);
    }, 1800);

    // Remove component completely after animation completes (500ms after fade start)
    const removeTimer = setTimeout(() => {
      onFinish();
    }, 2300);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-background py-16 transition-opacity duration-500 ease-in-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div /> {/* Spacer for top */}
      
      <div className="flex flex-col items-center justify-center animate-in zoom-in duration-700 ease-out">
        <div className="relative">
          <img
            src="/android-chrome-192x192.png"
            alt="Intelligent ERP Logo"
            className="w-24 h-24 mb-6 shadow-2xl rounded-2xl animate-pulse ring-1 ring-border/50"
          />
          <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full -z-10 animate-pulse duration-[2s]" />
        </div>
        
        {/* Simple loader underneath logo like Gmail */}
        <div className="w-32 h-1.5 overflow-hidden bg-muted/50 rounded-full mt-4 ring-1 ring-border/50">
          <div 
            className="h-full bg-primary rounded-full" 
            style={{
              animationName: "indeterminate-progress",
              animationDuration: "1.5s",
              animationIterationCount: "infinite",
              animationTimingFunction: "ease-in-out"
            }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center space-y-2 opacity-80 animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-both" style={{ animationDelay: '300ms' }}>
        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Initializing
        </p>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Intelligent ERP Plugin
        </h1>
      </div>
      
      <style>{`
        @keyframes indeterminate-progress {
          0% { transform: translateX(-100%) scaleX(0.2); }
          50% { transform: translateX(10%) scaleX(0.8); }
          100% { transform: translateX(100%) scaleX(0.2); }
        }
      `}</style>
    </div>
  );
};
