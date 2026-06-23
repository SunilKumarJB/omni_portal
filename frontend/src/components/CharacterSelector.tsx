import { Camera, Check, ImagePlus, RefreshCcw, Sparkles, Upload, UserRound, X } from 'lucide-react';
import type React from 'react';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import type WebcamClass from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CharacterPreset } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading';

// Heavy dependency - only loaded when the user opens the camera tab.
const Webcam = lazy(() => import('react-webcam'));

const PRESET_CHARS: CharacterPreset[] = [
  {
    id: 'char_01',
    name: 'Business Pro',
    gender: 'M',
    role: 'Boardroom',
    avatar: '👨‍💼',
    bg: '#1A237E',
    img: '/assets/characters/char_01.png',
  },
  {
    id: 'char_02',
    name: 'Business Pro',
    gender: 'F',
    role: 'Leadership',
    avatar: '👩‍💼',
    bg: '#4A148C',
    img: '/assets/characters/char_02.png',
  },
  {
    id: 'char_03',
    name: 'Creative',
    gender: 'M',
    role: 'Studio',
    avatar: '👨‍🎨',
    bg: '#BF360C',
    img: '/assets/characters/char_03.png',
  },
  {
    id: 'char_04',
    name: 'Creative',
    gender: 'F',
    role: 'Editorial',
    avatar: '👩‍🎨',
    bg: '#880E4F',
    img: '/assets/characters/char_04.png',
  },
  {
    id: 'char_05',
    name: 'Tech',
    gender: '',
    role: 'Product',
    avatar: '🧑‍💻',
    bg: '#1B5E20',
    img: '/assets/characters/char_05.png',
  },
  {
    id: 'char_06',
    name: 'Influencer',
    gender: '',
    role: 'Social',
    avatar: '🌟',
    bg: '#E65100',
    img: '/assets/characters/char_06.png',
  },
];

const TABS = [
  { id: 'preset', label: 'Presets', Icon: null },
  { id: 'camera', label: 'Camera', Icon: Camera },
  { id: 'upload', label: 'Upload', Icon: Upload },
];

const READY_POINTS = ['Single presenter in frame', 'Clear face and eye line', 'Good lighting'];

function selectedLabel(
  selectedCharacter: CharacterPreset | null,
  hasCustom: boolean,
  captured: string | null,
) {
  if (selectedCharacter) return selectedCharacter.name;
  if (hasCustom) return captured ? 'Camera Capture' : 'Uploaded Presenter';
  return 'Waiting for presenter';
}

interface PresenterPreviewProps {
  selectedCharacter: CharacterPreset | null;
  captured: string | null;
  uploadPreview: string | null;
  onClear: () => void;
}

function PresenterPreview({
  selectedCharacter,
  captured,
  uploadPreview,
  onClear,
}: PresenterPreviewProps) {
  const image = selectedCharacter?.img || captured || uploadPreview;
  const hasSelection = !!image;
  const title = selectedLabel(selectedCharacter, hasSelection, captured);
  const source = selectedCharacter
    ? selectedCharacter.role
    : captured
      ? 'Captured photo'
      : uploadPreview
        ? 'Uploaded image'
        : 'Select a preset, capture a photo, or upload a portrait';

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Presenter Preview
          </p>
          <h3 className="mt-1 text-lg font-bold leading-tight text-foreground">{title}</h3>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
            hasSelection
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-border bg-muted/50 text-muted-foreground',
          )}
        >
          {hasSelection ? <Check className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
          {hasSelection ? 'Ready' : 'Pending'}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3">
        <div className="relative min-h-0 overflow-hidden rounded-xl border border-border bg-background/55">
          {hasSelection ? (
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted/60">
                <Camera className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="max-w-[300px] text-sm font-semibold text-foreground">
                Choose who will appear in the generated video.
              </p>
              <p className="mt-2 max-w-[310px] text-xs leading-relaxed text-muted-foreground">
                Pick a clean portrait before continuing.
              </p>
            </div>
          )}
          {hasSelection && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-xs font-semibold text-white/85">{source}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#8ab4f8]" />
            Readiness check
          </div>
          <div className="grid grid-cols-3 gap-2">
            {READY_POINTS.map((point) => (
              <div
                key={point}
                className="flex min-h-[42px] items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-2.5 py-2 text-xs text-muted-foreground"
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    hasSelection ? 'text-success' : 'text-muted-foreground',
                  )}
                />
                <span className="leading-snug">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasSelection && (
        <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" onClick={onClear}>
          Clear presenter
        </Button>
      )}
    </section>
  );
}

interface CharacterSelectorProps {
  selectedCharacter: CharacterPreset | null;
  setSelectedCharacter: React.Dispatch<React.SetStateAction<CharacterPreset | null>>;
  characterImageFile: File | null;
  setCharacterImageFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export default function CharacterSelector({
  selectedCharacter,
  setSelectedCharacter,
  characterImageFile,
  setCharacterImageFile,
}: CharacterSelectorProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const webcamRef = useRef<WebcamClass | null>(null);
  const [tab, setTab] = useState('preset');
  const [cameraActive, setCameraActive] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const capture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (!src) return;
    setCaptured(src);
    setCameraActive(false);
    fetch(src)
      .then((r) => r.blob())
      .then((blob) => {
        setCharacterImageFile(new File([blob], 'capture.png', { type: 'image/png' }));
        setSelectedCharacter(null);
      });
  }, [setCharacterImageFile, setSelectedCharacter]);

  function handleUpload(file: File | undefined) {
    if (!file?.type.startsWith('image/')) return;
    setUploadPreview(URL.createObjectURL(file));
    setCharacterImageFile(file);
    setSelectedCharacter(null);
    setCaptured(null);
  }

  function resetCustom() {
    setCaptured(null);
    setUploadPreview(null);
    setCharacterImageFile(null);
    setCameraActive(false);
  }

  function clearPresenter() {
    setSelectedCharacter(null);
    resetCustom();
  }

  function switchTab(id: string) {
    setTab(id);
    resetCustom();
    setSelectedCharacter(null);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 3 of 5" title="Choose your presenter" className="mb-0">
        Select a preset avatar or use your own photo via camera or upload.
      </StepHeading>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        <div className="flex min-h-0 flex-col lg:col-span-7">
          <Tabs value={tab} onValueChange={switchTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mb-3 w-full justify-start">
              {TABS.map(({ id, label, Icon }) => (
                <TabsTrigger key={id} value={id} className="py-2 text-xs">
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="preset" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
              <div className="grid h-full min-h-0 grid-cols-3 grid-rows-2 gap-3">
                {PRESET_CHARS.map((c) => {
                  const selected = selectedCharacter?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCharacter(c);
                        resetCustom();
                      }}
                      className={cn(
                        'group grid min-h-0 grid-rows-[minmax(78px,1fr)_auto] overflow-hidden rounded-xl border bg-card/75 text-left transition-all duration-200',
                        selected
                          ? 'border-foreground ring-1 ring-foreground'
                          : 'border-border hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-accent/40 hover:shadow-lg hover:shadow-black/10',
                      )}
                    >
                      <div className="relative min-h-0 overflow-hidden border-b border-border/60 bg-background/45">
                        <div className="absolute inset-0" style={{ background: c.bg }}>
                          <img
                            src={c.img}
                            alt={`${c.name} ${c.gender}`}
                            className="h-full w-full object-cover object-top"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget
                                .nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div
                            className="absolute inset-0 items-center justify-center text-4xl"
                            style={{ display: 'none' }}
                          >
                            {c.avatar}
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />
                        {selected && (
                          <div className="absolute right-3 top-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground">
                            <Check className="h-3.5 w-3.5 text-background" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="grid gap-1.5 p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Presenter
                            </div>
                            <div className="mt-0.5 truncate text-[15px] font-bold leading-tight text-foreground">
                              {c.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full border border-border bg-background/45 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {c.role}
                          </span>
                          {c.gender && (
                            <span className="rounded-full border border-border bg-background/45 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {c.gender === 'M' ? 'Male' : 'Female'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="camera" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
              <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card/70 p-4">
                {!captured && !cameraActive && (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/45 px-8 text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted/50">
                      <Camera className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-bold text-foreground">Use the room camera</p>
                    <p className="mt-2 max-w-[420px] text-sm leading-relaxed text-muted-foreground">
                      Capture a clean front-facing portrait for the presenter identity.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-5"
                      onClick={() => setCameraActive(true)}
                    >
                      <Camera className="mr-1.5 h-4 w-4" />
                      Open camera
                    </Button>
                  </div>
                )}

                {cameraActive && (
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-black">
                      <Suspense
                        fallback={
                          <div className="flex h-full w-full items-center justify-center bg-muted/40">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                          </div>
                        }
                      >
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="h-full w-full object-cover"
                          mirrored
                          videoConstraints={{ facingMode: 'user' }}
                        />
                      </Suspense>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button size="sm" onClick={capture}>
                        <Camera className="mr-1.5 h-4 w-4" /> Capture
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setCameraActive(false)}>
                        <X className="mr-1.5 h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {captured && (
                  <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_220px] gap-4">
                    <div className="min-h-0 overflow-hidden rounded-xl border border-border bg-background/60">
                      <img src={captured} alt="Captured" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center rounded-xl border border-border bg-background/40 p-4">
                      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-success">
                        <Check className="h-4 w-4" /> Photo captured
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        This presenter is ready. Retake only if the face is cropped, blurred, or
                        poorly lit.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 justify-start px-0 text-xs"
                        onClick={() => {
                          setCaptured(null);
                          setCameraActive(true);
                        }}
                      >
                        <RefreshCcw className="mr-1.5 h-3.5 w-3.5" /> Retake
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
              <button
                type="button"
                className="flex h-full min-h-0 w-full cursor-pointer flex-col rounded-xl border border-dashed border-border bg-card/70 p-4 text-left transition-all duration-200 hover:border-foreground/30 hover:bg-accent/30"
                onClick={() => fileRef.current?.click()}
              >
                {!uploadPreview ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl bg-background/35 px-8 text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted/50">
                      <ImagePlus className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-bold text-foreground">Upload presenter portrait</p>
                    <p className="mt-2 max-w-[430px] text-sm leading-relaxed text-muted-foreground">
                      Use JPEG, PNG, or WebP. A sharp, front-facing image works best on the
                      large-screen demo.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-xs font-semibold text-foreground">
                      <Upload className="h-3.5 w-3.5" />
                      Choose image
                    </span>
                  </div>
                ) : (
                  <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_220px] gap-4">
                    <div className="min-h-0 overflow-hidden rounded-xl border border-border bg-background/60">
                      <img
                        src={uploadPreview}
                        alt="Character"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center rounded-xl border border-border bg-background/40 p-4">
                      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-success">
                        <Check className="h-4 w-4" /> Image ready
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        The uploaded image is set as the presenter identity for the generation.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 justify-start px-0 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetCustom();
                        }}
                      >
                        Change image
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="min-h-0 lg:col-span-5">
          <PresenterPreview
            selectedCharacter={selectedCharacter}
            captured={captured}
            uploadPreview={uploadPreview}
            onClear={clearPresenter}
          />
        </div>
      </div>
    </div>
  );
}
