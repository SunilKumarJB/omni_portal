import { Volume2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from './ui/button';

export default function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-5 text-center text-white">
        <p>The video could not be loaded.</p>
        <Button variant="secondary" onClick={() => setFailed(false)}>
          Retry playback
        </Button>
      </div>
    );
  return (
    <div className="relative h-full w-full">
      <video
        ref={ref}
        src={src}
        autoPlay
        muted={muted}
        controls
        playsInline
        loop
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
        onVolumeChange={() => setMuted(ref.current?.muted ?? true)}
      />
      {muted && (
        <button
          type="button"
          className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-4 py-2 text-sm font-medium text-white backdrop-blur"
          onClick={() => {
            setMuted(false);
            if (ref.current) {
              ref.current.muted = false;
              void ref.current.play().catch(() => undefined);
            }
          }}
        >
          <Volume2 className="h-4 w-4" />
          Enable sound
        </button>
      )}
    </div>
  );
}
