import { Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getStatus } from '../lib/api.js';

const STAGES = [
  { at: 0, label: 'Request queued' },
  { at: 15, label: 'Uploading assets to Cloud Storage' },
  { at: 25, label: 'Sending to Omni' },
  { at: 50, label: 'Generating video frames' },
  { at: 75, label: 'Processing & encoding' },
  { at: 90, label: 'Finalizing' },
];

function getStage(pct) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (pct >= STAGES[i].at) return STAGES[i];
  }
  return STAGES[0];
}

const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

export default function GenerationStatus({ requestData, testMode, onComplete, onError }) {
  const [status, setStatus] = useState(requestData);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!requestData?.request_id) return;
    const poll = async () => {
      try {
        const d = await getStatus(requestData.request_id);
        setStatus(d);
        if (d.status === 'completed') onComplete(d);
        else if (d.status === 'failed') onError(d.error);
      } catch {}
    };
    poll();
    const t = setInterval(poll, testMode ? 2000 : 8000);
    return () => clearInterval(t);
  }, [requestData?.request_id]);

  const progress = status?.progress ?? 0;
  const stage = getStage(progress);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Google circular progress (indeterminate ring + progress arc) */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle cx="50" cy="50" r="44" fill="none" stroke="#2A2A2A" strokeWidth="6" />
              {/* Progress */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#4285F4"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-medium text-[#E3E3E3] tabular-nums">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-normal text-[#E3E3E3]">
            {progress === 100 ? 'Done!' : 'Generating your video'}
          </h2>
          <p className="text-sm text-[rgba(255,255,255,0.50)]">{stage.label}</p>
          {testMode && (
            <p className="text-xs text-[#FBBC05] mt-1">Test mode — using placeholder video</p>
          )}
        </div>

        {/* Linear progress bar */}
        <div className="g-progress-track">
          <div className="g-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Stage checklist */}
        <div className="g-card space-y-3">
          {STAGES.map((s) => {
            const done = progress > s.at;
            const active = stage === s;
            return (
              <div key={s.at} className="flex items-center gap-3">
                <div
                  className={[
                    'w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border transition-all',
                    done ? 'bg-[#4285F4] border-[#4285F4]' : '',
                    active ? 'border-[#4285F4]' : '',
                    !done && !active ? 'border-[#333]' : '',
                  ].join(' ')}
                >
                  {done && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                  {active && !done && <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />}
                </div>
                <span
                  className={[
                    'text-xs transition-colors',
                    done ? 'text-[rgba(255,255,255,0.50)]' : '',
                    active ? 'text-[#E3E3E3]' : '',
                    !done && !active ? 'text-[rgba(255,255,255,0.25)]' : '',
                  ].join(' ')}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timer */}
        <div className="text-center text-xs text-[rgba(255,255,255,0.30)] font-mono">
          {fmt(elapsed)} elapsed
        </div>

        {/* QR preview */}
        {requestData?.qr_code_url && (
          <div className="g-card text-center space-y-2">
            <p className="text-xs text-[rgba(255,255,255,0.40)]">
              QR code ready — scan to open when complete
            </p>
            <img src={requestData.qr_code_url} alt="QR" className="w-16 h-16 rounded-lg mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
