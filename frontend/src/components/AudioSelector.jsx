import clsx from 'clsx';
import { Check, Mic, MicOff, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';

const PRESET_AUDIO = [
  {
    id: 'audio_01',
    name: 'Upbeat Corporate',
    bpm: 128,
    mood: 'Energetic',
    dot: '#4285F4',
    src: '/assets/audio/audio_01.wav',
  },
  {
    id: 'audio_02',
    name: 'Cinematic Epic',
    bpm: 90,
    mood: 'Dramatic',
    dot: '#EA4335',
    src: '/assets/audio/audio_02.wav',
  },
  {
    id: 'audio_03',
    name: 'Calm Ambient',
    bpm: 70,
    mood: 'Peaceful',
    dot: '#34A853',
    src: '/assets/audio/audio_03.wav',
  },
  {
    id: 'audio_04',
    name: 'Energetic Pop',
    bpm: 138,
    mood: 'Fun',
    dot: '#FBBC05',
    src: '/assets/audio/audio_04.wav',
  },
  {
    id: 'audio_05',
    name: 'Inspirational',
    bpm: 100,
    mood: 'Uplifting',
    dot: '#A142F4',
    src: '/assets/audio/audio_05.wav',
  },
  {
    id: 'audio_06',
    name: 'Minimal Modern',
    bpm: 110,
    mood: 'Contemporary',
    dot: '#24C1E0',
    src: '/assets/audio/audio_06.wav',
  },
];

const TABS = [
  { id: 'preset', label: 'Presets' },
  { id: 'record', label: 'Record' },
  { id: 'upload', label: 'Upload' },
];

function MiniWave({ active, color }) {
  const heights = [3, 5, 8, 5, 10, 7, 4, 9, 6, 3, 8, 5, 7, 4, 9, 6];
  return (
    <div className="flex items-end gap-px h-5" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full transition-colors duration-150"
          style={{
            height: `${(h / 10) * 100}%`,
            background: active ? color : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

export default function AudioSelector({
  selectedAudio,
  setSelectedAudio,
  audioFile,
  setAudioFile,
}) {
  const fileRef = useRef();
  const mrRef = useRef();
  const streamRef = useRef();
  const chunksRef = useRef([]);
  const timerRef = useRef();

  const [tab, setTab] = useState('preset');
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recBlob, setRecBlob] = useState(null);
  const [uploadUrl, setUploadUrl] = useState(null);

  // Cleanup recording stream and timer on unmount or tab switch
  React.useEffect(() => {
    return () => {
      if (mrRef.current && mrRef.current.state !== 'inactive') {
        try {
          mrRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tab]);

  function selectPreset(a) {
    setSelectedAudio(a);
    setAudioFile(null);
    setRecBlob(null);
    setUploadUrl(null);
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setRecBlob(URL.createObjectURL(blob));
        setAudioFile(new File([blob], 'recording.wav', { type: 'audio/wav' }));
        setSelectedAudio(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      mr.start();
      setRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => setRecTime((t) => t + 1), 1000);
    } catch {
      alert('Microphone access denied');
    }
  }

  function stopRec() {
    mrRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  }

  function handleUpload(file) {
    if (!file) return;
    setUploadUrl(URL.createObjectURL(file));
    setAudioFile(file);
    setSelectedAudio(null);
    setRecBlob(null);
  }

  const fmt = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <span className="g-step-label">Step 4 of 5 · Optional</span>
        <h2 className="g-step-title">Set the mood</h2>
        <p className="g-step-sub">
          Choose a soundtrack or record / upload your own. Skip to generate without audio.
        </p>
      </div>

      {/* Tabs */}
      <div className="g-tab-bar mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx('g-tab', tab === id && 'g-tab-active')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Presets */}
      {tab === 'preset' && (
        <div className="grid sm:grid-cols-2 gap-2">
          {PRESET_AUDIO.map((a) => {
            const active = selectedAudio?.id === a.id;
            return (
              <div key={a.id} className="flex flex-col gap-0">
                <button
                  onClick={() => selectPreset(a)}
                  className={clsx(
                    'g-card-hover flex items-center gap-4 text-left',
                    active && 'g-card-selected',
                    active && a.src && 'rounded-b-none border-b-0',
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${a.dot}20`, border: `1.5px solid ${a.dot}50` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.dot }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{a.name}</div>
                    <div className="text-xs text-white/38">
                      {a.mood} · {a.bpm} BPM
                    </div>
                  </div>

                  <MiniWave active={active} color={a.dot} />

                  {active && <Check className="w-4 h-4 text-[#4285F4] flex-shrink-0" />}
                </button>

                {/* Inline audio preview — only shown when selected and file exists */}
                {active && a.src && (
                  <div
                    className="px-3 pb-3 rounded-b-2xl border border-t-0"
                    style={{ borderColor: `${a.dot}40`, background: `${a.dot}0A` }}
                  >
                    <audio
                      src={a.src}
                      controls
                      className="w-full h-8"
                      style={{ colorScheme: 'dark' }}
                      onError={(e) => {
                        e.currentTarget.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record */}
      {tab === 'record' && (
        <div className="max-w-xs mx-auto text-center">
          {!recBlob ? (
            <div className="g-card py-12 space-y-5">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all"
                style={
                  recording
                    ? { background: 'rgba(234,67,53,0.10)', border: '2px solid #EA4335' }
                    : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '2px solid rgba(255,255,255,0.10)',
                      }
                }
              >
                {recording ? (
                  <MicOff className="w-8 h-8 text-[#EA4335]" />
                ) : (
                  <Mic className="w-8 h-8 text-white/30" strokeWidth={1.5} />
                )}
              </div>

              {recording && (
                <div className="font-mono text-2xl tabular-nums" style={{ color: '#EA4335' }}>
                  {fmt(recTime)}
                </div>
              )}

              <button
                onClick={recording ? stopRec : startRec}
                className={
                  recording
                    ? 'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[#EA4335]/50 text-[#EA4335] text-sm font-medium hover:bg-[#EA4335]/10 transition-all'
                    : 'btn-primary'
                }
              >
                {recording ? 'Stop recording' : 'Start recording'}
              </button>

              {recording && (
                <p className="text-xs text-white/35">Speak now — click Stop when done</p>
              )}
            </div>
          ) : (
            <div className="g-card space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#34A853] text-sm">
                <Check className="w-4 h-4" /> Recorded ({fmt(recTime)})
              </div>
              <audio src={recBlob} controls className="w-full h-8" />
              <button
                onClick={() => {
                  setRecBlob(null);
                  setAudioFile(null);
                  setRecTime(0);
                }}
                className="btn-text text-sm"
              >
                Record again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload */}
      {tab === 'upload' && (
        <div
          className="max-w-xs mx-auto rounded-2xl border border-dashed border-white/[0.10] bg-[#111] text-center cursor-pointer hover:border-white/[0.20] hover:bg-[#161616] transition-all duration-200"
          onClick={() => fileRef.current?.click()}
        >
          {!uploadUrl ? (
            <div className="py-14 px-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-white/28" strokeWidth={1.5} />
              </div>
              <p className="text-white font-medium">Upload audio file</p>
              <p className="text-xs text-white/35">MP3 · WAV · OGG · WebM</p>
            </div>
          ) : (
            <div className="py-6 px-6 space-y-3">
              <div className="flex items-center justify-center gap-2 text-[#34A853] text-sm">
                <Check className="w-4 h-4" /> Audio ready
              </div>
              <audio
                src={uploadUrl}
                controls
                className="w-full h-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        </div>
      )}

      {(selectedAudio || audioFile) && (
        <div className="mt-6 flex items-center gap-2 text-[#34A853] text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          {selectedAudio ? selectedAudio.name : 'Custom audio ready'}
        </div>
      )}
    </div>
  );
}
