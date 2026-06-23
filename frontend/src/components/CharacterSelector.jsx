import { Camera, Check, RefreshCcw, Upload, X } from 'lucide-react';
import React, { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading.jsx';

// Heavy dependency — only loaded when the user opens the camera tab.
const Webcam = lazy(() => import('react-webcam'));

const PRESET_CHARS = [
  {
    id: 'char_01',
    name: 'Business Pro',
    gender: 'M',
    avatar: '👨‍💼',
    bg: '#1A237E',
    img: '/assets/characters/char_01.png',
  },
  {
    id: 'char_02',
    name: 'Business Pro',
    gender: 'F',
    avatar: '👩‍💼',
    bg: '#4A148C',
    img: '/assets/characters/char_02.png',
  },
  {
    id: 'char_03',
    name: 'Creative',
    gender: 'M',
    avatar: '👨‍🎨',
    bg: '#BF360C',
    img: '/assets/characters/char_03.png',
  },
  {
    id: 'char_04',
    name: 'Creative',
    gender: 'F',
    avatar: '👩‍🎨',
    bg: '#880E4F',
    img: '/assets/characters/char_04.png',
  },
  {
    id: 'char_05',
    name: 'Tech',
    gender: '',
    avatar: '🧑‍💻',
    bg: '#1B5E20',
    img: '/assets/characters/char_05.png',
  },
  {
    id: 'char_06',
    name: 'Influencer',
    gender: '',
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

export default function CharacterSelector({
  selectedCharacter,
  setSelectedCharacter,
  characterImageFile,
  setCharacterImageFile,
}) {
  const fileRef = useRef();
  const webcamRef = useRef();
  const [tab, setTab] = useState('preset');
  const [cameraActive, setCameraActive] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);

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
  }, [webcamRef]);

  function handleUpload(file) {
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

  function switchTab(id) {
    setTab(id);
    resetCustom();
    setSelectedCharacter(null);
  }

  const hasCustom = !!captured || !!uploadPreview;

  return (
    <div className="mx-auto max-w-[1360px] space-y-6">
      <StepHeading eyebrow="Step 3 of 5" title="Choose your presenter" className="mb-0">
        Select a preset avatar or use your own photo via camera or upload.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Tabs & Selector */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs value={tab} onValueChange={switchTab} className="w-full">
            <TabsList className="mb-4">
              {TABS.map(({ id, label, Icon }) => (
                <TabsTrigger key={id} value={id} className="text-xs py-2">
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Preset grid */}
            <TabsContent value="preset" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                        'flex flex-col items-center gap-3 rounded-lg border bg-card p-4 text-center transition-all duration-200',
                        selected
                          ? 'border-foreground ring-1 ring-foreground'
                          : 'border-border hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-accent/40 hover:shadow-lg hover:shadow-black/5',
                      )}
                    >
                      <div
                        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl"
                        style={{ background: c.bg }}
                      >
                        <img
                          src={c.img}
                          alt={`${c.name} ${c.gender}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div
                          className="absolute inset-0 items-center justify-center text-3xl"
                          style={{ display: 'none' }}
                        >
                          {c.avatar}
                        </div>
                        {selected && (
                          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground">
                            <Check className="h-3 w-3 text-background" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="w-full min-w-0">
                        <div className="text-xs font-semibold leading-tight text-foreground truncate">
                          {c.name}
                        </div>
                        {c.gender && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {c.gender === 'M' ? 'Male' : 'Female'}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            {/* Camera */}
            <TabsContent value="camera" className="mt-0 focus-visible:outline-none">
              <div className="mx-auto max-w-sm space-y-4 text-center">
                {!captured && !cameraActive && (
                  <div className="space-y-4 rounded-lg border border-border bg-card py-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/50">
                      <Camera className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="mb-1 font-semibold text-sm text-foreground">Use your camera</p>
                      <p className="text-xs text-muted-foreground">
                        Take a photo to use as the presenter
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setCameraActive(true)}>
                      Open camera
                    </Button>
                  </div>
                )}

                {cameraActive && (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-border bg-black aspect-video flex items-center justify-center">
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
                          className="w-full h-full object-cover"
                          mirrored
                          videoConstraints={{ facingMode: 'user' }}
                        />
                      </Suspense>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button size="sm" onClick={capture}>
                        <Camera className="h-4 w-4 mr-1.5" /> Capture
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setCameraActive(false)}>
                        <X className="h-4 w-4 mr-1.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {captured && (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-border max-w-[240px] mx-auto">
                      <img
                        src={captured}
                        alt="Captured"
                        className="w-full object-cover aspect-square"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-success font-semibold">
                      <Check className="h-4 w-4" /> Photo captured
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-xs"
                      onClick={() => {
                        setCaptured(null);
                        setCameraActive(true);
                      }}
                    >
                      <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Retake
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Upload */}
            <TabsContent value="upload" className="mt-0 focus-visible:outline-none">
              <div
                className="mx-auto max-w-sm cursor-pointer rounded-lg border border-dashed border-border bg-card text-center transition-all duration-200 hover:border-foreground/30 hover:bg-accent/40"
                onClick={() => fileRef.current?.click()}
              >
                {!uploadPreview ? (
                  <div className="space-y-3 px-6 py-14">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/50">
                      <Upload className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="font-semibold text-sm text-foreground">Upload character image</p>
                    <p className="text-xs xl:text-sm text-muted-foreground">
                      JPEG · PNG · WebP · Max 10 MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 px-6 py-6">
                    <img
                      src={uploadPreview}
                      alt="Character"
                      className="mx-auto h-24 w-24 rounded-2xl border border-border object-cover"
                    />
                    <div className="flex items-center justify-center gap-1.5 text-xs text-success font-semibold">
                      <Check className="h-4 w-4" /> Image ready
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetCustom();
                      }}
                    >
                      Change image
                    </Button>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files[0])}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Presenter Preview Card (Aligns visually with the grid content, skipping the tab bar height) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 lg:pt-[52px]">
          {selectedCharacter || hasCustom ? (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-sm text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left mb-2">
                Active Presenter
              </div>

              {selectedCharacter && (
                <div className="space-y-3">
                  <div
                    className="mx-auto h-28 w-28 overflow-hidden rounded-2xl border border-border flex items-center justify-center shadow-inner relative"
                    style={{ background: selectedCharacter.bg }}
                  >
                    <img
                      src={selectedCharacter.img}
                      alt={selectedCharacter.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedCharacter.name}</h3>
                    {selectedCharacter.gender && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Gender: {selectedCharacter.gender === 'M' ? 'Male' : 'Female'}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 flex justify-center">
                    <span className="inline-flex items-center gap-1 text-xs text-success font-semibold bg-success/10 px-3 py-1 rounded-full">
                      <Check className="h-3.5 w-3.5" /> Ready for generation
                    </span>
                  </div>
                </div>
              )}

              {hasCustom && (
                <div className="space-y-3">
                  <div className="mx-auto h-28 w-28 overflow-hidden rounded-2xl border border-border shadow-inner">
                    <img
                      src={captured || uploadPreview}
                      alt="Custom Presenter"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Custom Presenter</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {captured ? 'Captured via Webcam' : 'Uploaded Image'}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <span className="inline-flex items-center gap-1 text-xs text-success font-semibold bg-success/10 px-3 py-1 rounded-full">
                      <Check className="h-3.5 w-3.5" /> Ready for generation
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedCharacter(null);
                    resetCustom();
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12 text-center min-h-[280px]">
              <div className="rounded-full border border-border bg-muted/60 p-4 mb-3">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm text-foreground">No presenter selected</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px] leading-relaxed">
                Choose a preset presenter or use the camera / upload options on the left to set who
                will appear.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
