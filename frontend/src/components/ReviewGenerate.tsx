import { Pencil, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LANGUAGES } from '@/data/languages';
import { formatPromptForDisplay } from '@/lib/prompt';
import type { CharacterPreset, LanguageCode, ProductPreset, VideoTemplate } from '@/lib/types';
import { useImagePreview } from '@/lib/useImagePreview';
import { speechMayBeTooLong } from '@/lib/videoBrief';
import StepHeading from './StepHeading';

interface Props {
  testMode: boolean;
  userName: string;
  selectedProduct: ProductPreset | null;
  selectedTemplate: VideoTemplate | null;
  videoPrompt: string;
  dialogueText: string;
  selectedLanguage: LanguageCode;
  selectedCharacter: CharacterPreset | null;
  characterImageFile: File | null;
  duration: number;
  setDuration: (value: number) => void;
  aspectRatio: '16:9' | '9:16';
  setAspectRatio: (value: '16:9' | '9:16') => void;
  onEdit: (step: number) => void;
  onGenerate: () => void | Promise<void>;
  needsReview: boolean;
  onAcknowledge: () => void;
  canGenerate: boolean;
}

export default function ReviewGenerate(props: Props) {
  const {
    userName,
    selectedProduct,
    selectedCharacter,
    characterImageFile,
    selectedTemplate,
    selectedLanguage,
    dialogueText,
    videoPrompt,
    onEdit,
    duration,
    aspectRatio,
    testMode,
  } = props;
  const photo = useImagePreview(characterImageFile);
  const rows = [
    { step: 1, label: 'Name in the video', value: userName },
    { step: 2, label: 'Product', value: selectedProduct?.name ?? 'Choose a product' },
    {
      step: 3,
      label: `Dialogue · ${LANGUAGES.find((l) => l.code === selectedLanguage)?.name}`,
      value: dialogueText.trim() || 'No spoken dialogue',
    },
    { step: 5, label: 'Scene', value: selectedTemplate?.title ?? 'Choose a scene' },
  ];
  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6">
      <StepHeading eyebrow="Step 6 of 6" title="Review your video" className="mb-0">
        Check the person, words, and scene. You can edit each choice before you create.
      </StepHeading>
      {testMode && (
        <p className="rounded-xl border border-border bg-muted p-4 text-sm">
          Test mode: shows a style sample. It does not generate or save a new video.
        </p>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-4 border-b border-border p-5">
            {(photo || selectedCharacter?.img) && (
              <img
                src={photo || selectedCharacter?.img}
                alt="Selected presenter"
                className="h-24 w-20 shrink-0 rounded-lg object-cover object-top"
              />
            )}
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Presenter photo</p>
              <p className="mt-1 font-semibold">
                {characterImageFile
                  ? 'Uploaded photo'
                  : (selectedCharacter?.name ?? 'Choose a presenter')}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(4)} aria-label="Edit presenter">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
          {rows.map((row) => (
            <div
              key={row.step}
              className="flex items-start gap-3 border-b border-border p-5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p
                  className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed"
                  lang={row.step === 3 ? selectedLanguage : undefined}
                >
                  {row.value}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.step)}
                aria-label={`Edit ${row.label}`}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          ))}
        </Card>
        <div className="space-y-4">
          <Card className="space-y-5 p-5">
            <h3 className="font-semibold">Video settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2 text-sm">
                Duration
                <select
                  aria-label="Video duration"
                  value={duration}
                  onChange={(e) => props.setDuration(Number(e.target.value))}
                  className="block h-11 w-full rounded-lg border border-input bg-background px-3"
                >
                  {[5, 8, 10].map((s) => (
                    <option key={s} value={s}>
                      {s} seconds
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                Shape
                <select
                  aria-label="Video shape"
                  value={aspectRatio}
                  onChange={(e) => props.setAspectRatio(e.target.value as '16:9' | '9:16')}
                  className="block h-11 w-full rounded-lg border border-input bg-background px-3"
                >
                  <option value="16:9">16:9 · Wide</option>
                  <option value="9:16">9:16 · Tall</option>
                </select>
              </label>
            </div>
            {speechMayBeTooLong(dialogueText, duration) && (
              <p className="rounded-lg bg-muted p-3 text-sm" role="status">
                This line may be too long for {duration} seconds. Shorten it or choose a longer
                video. Speech speed varies by language.
              </p>
            )}
            {props.needsReview && (
              <div
                role="alert"
                className="space-y-3 rounded-lg border border-amber-500/50 p-4 text-sm"
              >
                <p>
                  Your name or product changed. Your custom text was kept. Check the dialogue and
                  scene instructions for old details.
                </p>
                <Button variant="outline" onClick={props.onAcknowledge}>
                  I checked my custom text
                </Button>
              </div>
            )}
            <Button
              size="lg"
              className="generate-google-border w-full"
              disabled={!props.canGenerate || props.needsReview}
              onClick={props.onGenerate}
            >
              <Sparkles className="h-4 w-4" />
              {testMode ? 'View sample video' : 'Create video'}
            </Button>
            {!props.canGenerate && (
              <p role="alert" className="text-sm text-destructive">
                Complete the missing choices before creating your video.
              </p>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {testMode
                ? 'The sample will not use your choices. Sharing is unavailable.'
                : 'Generation can take several minutes. You can open a progress link and return when it is ready.'}
            </p>
          </Card>
          <details
            className="rounded-xl border border-border bg-card p-5"
            open={props.needsReview || undefined}
          >
            <summary className="cursor-pointer text-sm font-semibold">Scene instructions</summary>
            <p className="my-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
              {formatPromptForDisplay(videoPrompt)}
            </p>
            <Button variant="outline" size="sm" onClick={() => onEdit(5)}>
              Edit scene instructions
            </Button>
          </details>
        </div>
      </div>
    </div>
  );
}
