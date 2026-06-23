import { Check, Mic, MicOff, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading.jsx';

const PRESET_AUDIO = [
  {
    id: 'audio_01',
    name: 'Upbeat Corporate',
    bpm: 128,
    mood: 'Energetic',
    src: '/assets/audio/audio_01.wav',
  },
  {
    id: 'audio_02',
    name: 'Cinematic Epic',
    bpm: 90,
    mood: 'Dramatic',
    src: '/assets/audio/audio_02.wav',
  },
  {
    id: 'audio_03',
    name: 'Calm Ambient',
    bpm: 70,
    mood: 'Peaceful',
    src: '/assets/audio/audio_03.wav',
  },
  {
    id: 'audio_04',
    name: 'Energetic Pop',
    bpm: 138,
    mood: 'Fun',
    src: '/assets/audio/audio_04.wav',
  },
  {
    id: 'audio_05',
    name: 'Inspirational',
    bpm: 100,
    mood: 'Uplifting',
    src: '/assets/audio/audio_05.wav',
  },
  {
    id: 'audio_06',
    name: 'Minimal Modern',
    bpm: 110,
    mood: 'Contemporary',
    src: '/assets/audio/audio_06.wav',
  },
];

const TABS = [
  { id: 'preset', label: 'Presets' },
  { id: 'record', label: 'Record' },
  { id: 'upload', label: 'Upload' },
];

function MiniWave({ active }) {
  const heights = [3, 5, 8, 5, 10, 7, 4, 9, 6, 3, 8, 5, 7, 4, 9, 6];
  return (
    <div className="flex h-5 items-end gap-px" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className={cn(
            'w-0.5 rounded-full transition-colors duration-150',
            active ? 'bg-foreground' : 'bg-foreground/15',
          )}
          style={{ height: `${(h / 10) * 100}%` }}
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
      toast.error('Microphone access denied. Check your browser permissions.');
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
    <div className="mx-auto max-w-[1360px] space-y-6">
      <StepHeading eyebrow="Step 4 of 5 · Optional" title="Set the mood" className="mb-0">
        Choose a soundtrack or record / upload your own. Skip to generate without audio.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Tabs & Selector */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              {TABS.map(({ id, label }) => (
                <TabsTrigger key={id} value={id} className="text-xs py-2">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Presets */}
            <TabsContent value="preset" className="mt-0 focus-visible:outline-none">
              <div className="grid gap-2 sm:grid-cols-2">
                {PRESET_AUDIO.map((a) => {
                  const active = selectedAudio?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => selectPreset(a)}
                      className={cn(
                        'flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-all duration-200',
                        active
                          ? 'border-foreground ring-1 ring-foreground'
                          : 'border-border hover:border-foreground/30 hover:bg-accent/40 hover:shadow-lg hover:shadow-black/5',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border',
                          active
                            ? 'border-foreground/40 bg-foreground/10'
                            : 'border-border bg-muted/50',
                        )}
                      >
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            active ? 'bg-foreground' : 'bg-muted-foreground',
                          )}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {a.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {a.mood} · {a.bpm} BPM
                        </div>
                      </div>

                      <MiniWave active={active} />
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            {/* Record */}
            <TabsContent value="record" className="mt-0 focus-visible:outline-none">
              <div className="mx-auto max-w-xs text-center">
                {!recBlob ? (
                  <div className="space-y-5 rounded-lg border border-border bg-card py-12">
                    <div
                      className={cn(
                        'mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all',
                        recording
                          ? 'border-destructive bg-destructive/10 animate-pulse'
                          : 'border-border bg-muted/50',
                      )}
                    >
                      {recording ? (
                        <MicOff className="h-8 w-8 text-destructive" />
                      ) : (
                        <Mic className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                      )}
                    </div>

                    {recording && (
                      <div className="font-mono text-2xl tabular-nums text-destructive font-bold">
                        {fmt(recTime)}
                      </div>
                    )}

                    {recording ? (
                      <Button variant="destructive" size="sm" onClick={stopRec}>
                        Stop recording
                      </Button>
                    ) : (
                      <Button size="sm" onClick={startRec}>
                        Start recording
                      </Button>
                    )}

                    {recording && (
                      <p className="text-xs xl:text-sm text-muted-foreground">
                        Speak now — click Stop when done
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center justify-center gap-2 text-xs text-success font-semibold">
                      <Check className="h-4 w-4" /> Recorded successfully ({fmt(recTime)})
                    </div>
                    <audio src={recBlob} controls className="h-8 w-full" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRecBlob(null);
                        setAudioFile(null);
                        setRecTime(0);
                      }}
                    >
                      Record again
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Upload */}
            <TabsContent value="upload" className="mt-0 focus-visible:outline-none">
              <div
                className="mx-auto max-w-xs cursor-pointer rounded-lg border border-dashed border-border bg-card text-center transition-all duration-200 hover:border-foreground/30 hover:bg-accent/40"
                onClick={() => fileRef.current?.click()}
              >
                {!uploadUrl ? (
                  <div className="space-y-3 px-6 py-14">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/50">
                      <Upload className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="font-semibold text-sm text-foreground">Upload audio file</p>
                    <p className="text-xs text-muted-foreground">MP3 · WAV · OGG · WebM</p>
                  </div>
                ) : (
                  <div className="space-y-4 px-6 py-8">
                    <div className="flex items-center justify-center gap-2 text-xs text-success font-semibold">
                      <Check className="h-4 w-4" /> Audio ready
                    </div>
                    <audio
                      src={uploadUrl}
                      controls
                      className="h-8 w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadUrl(null);
                        setAudioFile(null);
                      }}
                    >
                      Change audio file
                    </Button>
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Active soundtrack card (Aligns visually with the grid content, skipping the tab bar height) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 lg:pt-[52px]">
          {selectedAudio || audioFile ? (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Active Soundtrack
              </div>

              {selectedAudio && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-foreground">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{selectedAudio.name}</h3>
                      <p className="text-xs xl:text-sm text-muted-foreground mt-0.5">
                        {selectedAudio.mood} · {selectedAudio.bpm} BPM
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-2">
                    <audio src={selectedAudio.src} controls className="h-8 w-full" />
                  </div>
                </div>
              )}

              {audioFile && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-success/10 bg-success/5 text-success">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Custom Soundtrack</h3>
                      <p className="text-xs xl:text-sm text-muted-foreground mt-0.5">
                        {recBlob ? 'Recorded Voice Clip' : 'Uploaded File'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-2">
                    <audio src={recBlob || uploadUrl} controls className="h-8 w-full" />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedAudio(null);
                    setAudioFile(null);
                    setRecBlob(null);
                    setUploadUrl(null);
                  }}
                >
                  Remove Audio
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12 text-center min-h-[200px]">
              <p className="font-semibold text-sm text-foreground">No audio selected</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px] leading-relaxed">
                Choose a preset soundtrack or add your own audio. Skip if you want the generated
                video to be silent.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
