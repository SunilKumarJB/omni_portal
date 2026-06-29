import { Check, Mic, MicOff, Music2, Radio, Upload, Volume2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AudioPreset } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading';

const PRESET_AUDIO: AudioPreset[] = [
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

function MiniWave({ active, large = false }: { active: boolean; large?: boolean }) {
  const heights = [3, 5, 8, 5, 10, 7, 4, 9, 6, 3, 8, 5, 7, 4, 9, 6];
  return (
    <div className={cn('flex items-end gap-1', large ? 'h-12' : 'h-5 gap-px')} aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className={cn(
            large ? 'w-1.5 rounded-full' : 'w-0.5 rounded-full',
            'transition-colors duration-150',
            active ? 'bg-foreground' : 'bg-foreground/15',
          )}
          style={{ height: `${(h / 10) * 100}%` }}
        />
      ))}
    </div>
  );
}

const AUDIO_POINTS = ['Soundtrack optional', 'Voiceover supported', 'Silent mode available'];

interface AudioPreviewProps {
  selectedAudio: AudioPreset | null;
  audioFile: File | null;
  recBlob: string | null;
  uploadUrl: string | null;
  onClear: () => void;
}

function AudioPreview({
  selectedAudio,
  audioFile,
  recBlob,
  uploadUrl,
  onClear,
}: AudioPreviewProps) {
  const hasAudio = !!selectedAudio || !!audioFile;
  const title = selectedAudio
    ? selectedAudio.name
    : audioFile
      ? 'Custom Soundtrack'
      : 'Silent generation';
  const meta = selectedAudio
    ? `${selectedAudio.mood} · ${selectedAudio.bpm} BPM`
    : audioFile
      ? recBlob
        ? 'Recorded audio clip'
        : 'Uploaded audio file'
      : 'Skip this step or choose a soundtrack';
  const src = selectedAudio?.src || recBlob || uploadUrl;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Audio Preview
          </p>
          <h3 className="mt-1 text-lg font-bold leading-tight text-foreground">{title}</h3>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
            hasAudio
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-border bg-muted/50 text-muted-foreground',
          )}
        >
          {hasAudio ? <Check className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {hasAudio ? 'Ready' : 'Optional'}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3">
        <div className="flex min-h-0 flex-col justify-center rounded-xl border border-border bg-background/45 p-5">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-border bg-muted/50">
            {hasAudio ? (
              <Music2 className="h-10 w-10 text-foreground" strokeWidth={1.5} />
            ) : (
              <Volume2 className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            )}
          </div>
          <div className="mx-auto mb-5 flex h-14 w-full max-w-[280px] items-end justify-center gap-1">
            {[8, 18, 28, 42, 24, 52, 34, 22, 46, 30, 54, 26, 38, 18, 32, 12].map(
              (height, index) => (
                <div
                  key={`${height}-${index}`}
                  className={cn(
                    'w-2 rounded-full transition-colors duration-150',
                    hasAudio ? 'bg-foreground/70' : 'bg-muted-foreground/20',
                  )}
                  style={{ height }}
                />
              ),
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{meta}</p>
            <p className="mx-auto mt-2 max-w-[330px] text-xs leading-relaxed text-muted-foreground">
              {hasAudio
                ? 'This track will be mixed into the generated video.'
                : 'Audio is optional for the demo. Continue without audio for a silent render.'}
            </p>
          </div>
          {src && (
            <div className="mt-5 rounded-lg border border-border bg-muted/20 p-2">
              <audio src={src} controls className="h-8 w-full" />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
            <Radio className="h-3.5 w-3.5 text-[#8ab4f8]" />
            Output mode
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AUDIO_POINTS.map((point) => (
              <div
                key={point}
                className="flex min-h-[42px] items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-2.5 py-2 text-xs text-muted-foreground"
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    hasAudio ? 'text-success' : 'text-muted-foreground',
                  )}
                />
                <span className="leading-snug">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasAudio && (
        <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" onClick={onClear}>
          Remove audio
        </Button>
      )}
    </section>
  );
}

interface AudioSelectorProps {
  selectedAudio: AudioPreset | null;
  setSelectedAudio: React.Dispatch<React.SetStateAction<AudioPreset | null>>;
  audioFile: File | null;
  setAudioFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export default function AudioSelector({
  selectedAudio,
  setSelectedAudio,
  audioFile,
  setAudioFile,
}: AudioSelectorProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tab, setTab] = useState('preset');
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recBlob, setRecBlob] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

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

  function selectPreset(a: AudioPreset) {
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
      mr.ondataavailable = (e: BlobEvent) => chunksRef.current.push(e.data);
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
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploadUrl(URL.createObjectURL(file));
    setAudioFile(file);
    setSelectedAudio(null);
    setRecBlob(null);
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 4 of 5 · Optional" title="Set the mood" className="mb-0">
        Choose a soundtrack or record / upload your own. Skip to generate without audio.
      </StepHeading>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        <div className="flex min-h-0 flex-col lg:col-span-7">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mb-3 w-full justify-start">
              {TABS.map(({ id, label }) => (
                <TabsTrigger key={id} value={id} className="py-2 text-xs">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="preset" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
              <div className="grid h-full min-h-0 grid-cols-2 grid-rows-3 gap-3">
                {PRESET_AUDIO.map((a) => {
                  const active = selectedAudio?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => selectPreset(a)}
                      className={cn(
                        'grid min-h-0 grid-rows-[auto_1fr_auto] rounded-xl border bg-card/75 p-4 text-left transition-all duration-200',
                        active
                          ? 'border-foreground ring-1 ring-foreground'
                          : 'border-border hover:border-foreground/30 hover:bg-accent/40 hover:shadow-lg hover:shadow-black/5',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-bold leading-tight text-foreground">
                            {a.name}
                          </div>
                          <div className="mt-1 text-sm font-medium text-muted-foreground">
                            {a.mood}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border',
                            active
                              ? 'border-foreground/40 bg-foreground/10'
                              : 'border-border bg-muted/50',
                          )}
                        >
                          <div
                            className={cn(
                              'h-2.5 w-2.5 rounded-full',
                              active ? 'bg-foreground' : 'bg-muted-foreground',
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex min-h-0 items-center justify-center rounded-lg border border-border/60 bg-background/35 px-3">
                        <MiniWave active={active} large />
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                        <span>{a.bpm} BPM</span>
                        <span>{active ? 'Selected' : 'Preset track'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="record" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
              <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card/70 p-4 text-center">
                {!recBlob ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/45 px-8">
                    <div
                      className={cn(
                        'mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all',
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
                      <div className="mb-3 font-mono text-3xl font-bold tabular-nums text-destructive">
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

                    <p className="mt-4 max-w-[380px] text-sm leading-relaxed text-muted-foreground">
                      {recording
                        ? 'Speak now. Stop recording when the clip is ready.'
                        : 'Record a voiceover or short audio cue for the generated video.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_220px] gap-4">
                    <div className="flex min-h-0 flex-col justify-center rounded-xl border border-border bg-background/45 p-5">
                      <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-success">
                        <Check className="h-4 w-4" /> Recorded successfully ({fmt(recTime)})
                      </div>
                      <audio src={recBlob} controls className="h-8 w-full" />
                    </div>
                    <div className="flex flex-col justify-center rounded-xl border border-border bg-background/40 p-4 text-left">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        This recording is ready to be used as the audio source.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 justify-start px-0 text-xs"
                        onClick={() => {
                          setRecBlob(null);
                          setAudioFile(null);
                          setRecTime(0);
                        }}
                      >
                        Record again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
              <button
                type="button"
                className="flex h-full min-h-0 w-full cursor-pointer flex-col rounded-xl border border-dashed border-border bg-card/70 p-4 text-center transition-all duration-200 hover:border-foreground/30 hover:bg-accent/30"
                onClick={() => fileRef.current?.click()}
              >
                {!uploadUrl ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl bg-background/35 px-8">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted/50">
                      <Upload className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-bold text-foreground">Upload audio file</p>
                    <p className="mt-2 max-w-[430px] text-sm leading-relaxed text-muted-foreground">
                      Use MP3, WAV, OGG, or WebM. Audio is optional, but useful when the scene needs
                      a mood cue.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-xs font-semibold text-foreground">
                      <Upload className="h-3.5 w-3.5" />
                      Choose audio
                    </span>
                  </div>
                ) : (
                  <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_220px] gap-4">
                    <div className="flex min-h-0 flex-col justify-center rounded-xl border border-border bg-background/45 p-5">
                      <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-success">
                        <Check className="h-4 w-4" /> Audio ready
                      </div>
                      <audio
                        src={uploadUrl}
                        controls
                        className="h-8 w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex flex-col justify-center rounded-xl border border-border bg-background/40 p-4 text-left">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        The uploaded track will be mixed into the generated video.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 justify-start px-0 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadUrl(null);
                          setAudioFile(null);
                        }}
                      >
                        Change audio file
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="min-h-0 lg:col-span-5">
          <AudioPreview
            selectedAudio={selectedAudio}
            audioFile={audioFile}
            recBlob={recBlob}
            uploadUrl={uploadUrl}
            onClear={() => {
              setSelectedAudio(null);
              setAudioFile(null);
              setRecBlob(null);
              setUploadUrl(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
