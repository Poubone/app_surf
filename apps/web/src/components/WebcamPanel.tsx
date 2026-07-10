import { Video } from 'lucide-react';
import type { SpotView } from '../types';

export function WebcamPanel({ spot }: { spot: SpotView }) {
  if (!spot.webcamUrl) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3
        className="text-xs uppercase tracking-widest text-muted-foreground m-0"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}
      >
        Webcam
      </h3>
      <div
        className="p-4 rounded-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <a
          href={spot.webcamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl no-underline"
          style={{
            backgroundColor: 'rgba(0,170,255,0.12)',
            border: '1px solid rgba(0,170,255,0.3)',
            color: '#00aaff',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <Video size={16} />
          Voir la webcam
        </a>
      </div>
    </div>
  );
}
