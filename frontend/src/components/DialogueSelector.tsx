import { Pencil, Quote, RotateCcw, Volume2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { LanguageCode, VideoTemplate } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading, { FieldLabel } from './StepHeading';

/* Types */

interface Language {
  code: LanguageCode;
  name: string;
  native: string;
  script: string;
}

interface Props {
  selectedTemplate: VideoTemplate | null;
  selectedLanguage: LanguageCode;
  setSelectedLanguage: React.Dispatch<React.SetStateAction<LanguageCode>>;
  dialogueText: string;
  setDialogueText: React.Dispatch<React.SetStateAction<string>>;
}

/* Language list */

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', script: 'Devanagari' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
];

/* Dialogue translations per template */

const DIALOGUES: Record<string, Record<LanguageCode, string>> = {
  cyberpunk: {
    en: 'They said the city never sleeps. Good… neither do I.',
    hi: 'उन्होंने कहा शहर कभी नहीं सोता। अच्छा… मैं भी नहीं सोता।',
    ta: 'நகரம் தூங்குவதில்லை என்று சொன்னார்கள். நல்லது… நானும் தூங்குவதில்லை.',
    te: 'నగరం నిద్రపోదు అని చెప్పారు. సరే… నేనూ నిద్రపోను.',
    kn: 'ನಗರ ನಿದ್ರಿಸುವುದಿಲ್ಲ ಎಂದು ಹೇಳಿದರು. ಒಳ್ಳೆಯದು… ನಾನೂ ನಿದ್ರಿಸುವುದಿಲ್ಲ.',
    ml: 'നഗരം ഉറങ്ങില്ല എന്ന് അവർ പറഞ്ഞു. നല്ലത്… ഞാനും ഉറങ്ങില്ല.',
    bn: 'তারা বলেছিল শহর কখনো ঘুমায় না। ভালো… আমিও ঘুমাই না।',
    mr: 'ते म्हणाले शहर कधी झोपत नाही. चांगले… मीही झोपत नाही.',
    gu: 'તેઓ કહ્યું શહેર ઊંઘતું નથી. સારું… હું પણ ઊંઘતો નથી.',
    pa: 'ਉਨ੍ਹਾਂ ਕਿਹਾ ਸ਼ਹਿਰ ਕਦੇ ਨਹੀਂ ਸੌਂਦਾ। ਚੰਗਾ… ਮੈਂ ਵੀ ਨਹੀਂ ਸੌਂਦਾ।',
  },
  action_hero: {
    en: "Are you not entertained? Because I'm just getting started.",
    hi: 'क्या तुम मनोरंजित नहीं हो? क्योंकि मैंने तो अभी शुरुआत ही की है।',
    ta: 'நீங்கள் மகிழவில்லையா? ஏனென்றால் நான் இப்போதுதான் தொடங்கியிருக்கிறேன்.',
    te: 'మీకు వినోదం కలగడం లేదా? ఎందుకంటే నేను ఇప్పుడే మొదలుపెట్టాను.',
    kn: 'ನಿಮಗೆ ಮನರಂಜನೆ ಆಗಲಿಲ್ಲವೇ? ಏಕೆಂದರೆ ನಾನು ಇನ್ನೂ ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೇನೆ.',
    ml: 'നിങ്ങൾക്ക് വിനോദം ഇല്ലേ? കാരണം ഞാൻ ഇപ്പോൾ മാത്രമേ ആരംഭിച്ചിട്ടുള്ളൂ.',
    bn: 'আপনি কি বিনোদিত নন? কারণ আমি তো এইমাত্র শুরু করেছি।',
    mr: 'तुम्हाला मनोरंजन नाही का? कारण मी आत्ताच सुरुवात केली आहे.',
    gu: 'શું તમે મનોરંજિત નથી? કારણ કે હું હમણાં જ શરૂ કર્યું છે.',
    pa: 'ਕੀ ਤੁਸੀਂ ਮਨੋਰੰਜਿਤ ਨਹੀਂ ਹੋ? ਕਿਉਂਕਿ ਮੈਂ ਹੁਣੇ ਸ਼ੁਰੂ ਕਰ ਰਿਹਾ ਹਾਂ।',
  },
  film_noir: {
    en: "Romance is just a myth we tell ourselves to survive the rain. But a good mystery? That's real.",
    hi: 'रोमांस सिर्फ एक मिथक है जो हम बारिश में जीने के लिए सुनाते हैं। लेकिन एक अच्छा रहस्य? वो असली है।',
    ta: 'காதல் என்பது மழையில் உயிர்வாழ நாமே சொல்லும் கட்டுக்கதை. ஆனால் நல்ல மர்மம்? அது உண்மையானது.',
    te: 'రొమాన్స్ వర్షంలో బతకడానికి మనం చెప్పుకునే పురాణం. కానీ మంచి రహస్యం? అది నిజం.',
    kn: 'ರೋಮ್ಯಾನ್ಸ್ ಮಳೆಯಲ್ಲಿ ಬದುಕಲು ನಾವು ಹೇಳಿಕೊಳ್ಳುವ ಕಟ್ಟುಕಥೆ. ಆದರೆ ಒಳ್ಳೆಯ ನಿಗೂಢ? ಅದು ನಿಜ.',
    ml: 'മഴയിൽ ജീവിക്കാൻ നാം പറഞ്ഞുകൊള്ളുന്ന കഥ മാത്രമാണ് പ്രണയം. എന്നാൽ നല്ല രഹസ്യം? അത് യഥാർത്ഥം.',
    bn: 'রোমান্স শুধু একটি মিথ যা আমরা বৃষ্টিতে বাঁচতে বলি। কিন্তু ভালো রহস্য? সেটা সত্যিকারের।',
    mr: 'रोमान्स म्हणजे पावसात टिकण्यासाठी आपण स्वतःला सांगतो ती मिथक. पण चांगले रहस्य? ते खरे असते.',
    gu: 'પ્રેમ એ ફક્ત કથા છે જે વરસાદમાં ટકવા આપણે કહીએ. પણ સારું રહસ્ય? તે સત્ય છે.',
    pa: 'ਰੋਮਾਂਸ ਸਿਰਫ਼ ਇੱਕ ਮਿੱਥ ਹੈ ਜੋ ਮੀਂਹ ਵਿੱਚ ਜਿਉਂਦੇ ਰਹਿਣ ਲਈ ਅਸੀਂ ਆਪਣੇ ਆਪ ਨੂੰ ਦੱਸਦੇ ਹਾਂ। ਪਰ ਚੰਗਾ ਰਹੱਸ? ਉਹ ਅਸਲੀ ਹੈ।',
  },
  animated: {
    en: 'Spring is here, the blossoms are blooming, and absolutely nothing is going to plan!',
    hi: 'वसंत आ गया, फूल खिल रहे हैं, और कुछ भी योजना के अनुसार नहीं हो रहा!',
    ta: 'வசந்தகாலம் வந்தது, பூக்கள் மலர்கின்றன, மற்றும் எதுவும் திட்டமிட்டபடி நடக்கவில்லை!',
    te: 'వసంతం వచ్చింది, పూలు వికసిస్తున్నాయి, మరియు ఏదీ ప్రణాళికలో లేదు!',
    kn: 'ವಸಂತ ಬಂದಿದೆ, ಹೂಗಳು ಅರಳುತ್ತಿವೆ, ಮತ್ತು ಏನೂ ಯೋಜನೆಯಂತೆ ನಡೆಯುತ್ತಿಲ್ಲ!',
    ml: 'വസന്തം വന്നു, പൂക്കൾ വിരിഞ്ഞു, ഒന്നും പദ്ധതിയനുസരിച്ച് നടക്കുന്നില്ല!',
    bn: 'বসন্ত এসে গেছে, ফুল ফুটছে, আর কিছুই পরিকল্পনামতো হচ্ছে না!',
    mr: 'वसंत आला, फुले फुलत आहेत, आणि काहीही योजनेप्रमाणे होत नाही!',
    gu: 'વસંત આવ્યો, ફૂલ ખીલ્યાં, અને કંઈ પણ યોજના પ્રમાણે નથી!',
    pa: 'ਬਸੰਤ ਆ ਗਿਆ, ਫੁੱਲ ਖਿੜ ਰਹੇ ਹਨ, ਅਤੇ ਕੁਝ ਵੀ ਯੋਜਨਾ ਅਨੁਸਾਰ ਨਹੀਂ ਹੋ ਰਿਹਾ!',
  },
  treasure_hunter: {
    en: 'Some secrets are meant to stay buried. Too bad I brought a shovel.',
    hi: 'कुछ राज़ दफ़न ही रहने के लिए होते हैं। बुरा हुआ कि मैं फावड़ा ले आया।',
    ta: 'சில இரகசியங்கள் புதைந்தே இருக்க வேண்டியவை. துரதிர்ஷ்டவசமாக நான் கொத்தாளி கொண்டு வந்தேன்.',
    te: 'కొన్ని రహస్యాలు పూడ్చిపెట్టబడే ఉండాలి. పాపం నేను పార తీసుకొచ్చాను.',
    kn: 'ಕೆಲವು ರಹಸ್ಯಗಳು ಹೂಳಿಯೇ ಇರಬೇಕು. ದುರದೃಷ್ಟವಶಾತ್ ನಾನು ಗುದ್ದಲಿ ತಂದೆ.',
    ml: 'ചില രഹസ്യങ്ങൾ അടക്കപ്പെട്ടു കിടക്കാൻ ഉദ്ദേശിക്കപ്പെട്ടവ. കഷ്ടം, ഞാൻ ഒരു പാര കൊണ്ടുവന്നു.',
    bn: 'কিছু রহস্য কবরেই থাকার জন্য। দুর্ভাগ্যবশত আমি কোদাল নিয়ে এসেছি।',
    mr: 'काही रहस्ये गाडलेलीच राहायला हवीत. दुर्दैव म्हणजे मी कुदळ घेऊन आलो.',
    gu: 'કેટલાક રહસ્ય દફન જ રહેવા જોઈએ. દુર્ભાગ્ય, હું ઉપડો લઈ આવ્યો.',
    pa: 'ਕੁਝ ਰਾਜ਼ ਦੱਬੇ ਹੀ ਰਹਿਣੇ ਚਾਹੀਦੇ ਹਨ। ਬੁਰਾ ਹੋਇਆ ਕਿ ਮੈਂ ਕਹੀ ਲੈ ਆਇਆ।',
  },
  custom: {
    en: '',
    hi: '',
    ta: '',
    te: '',
    kn: '',
    ml: '',
    bn: '',
    mr: '',
    gu: '',
    pa: '',
  },
};

/* Component */

export default function DialogueSelector({
  selectedTemplate,
  selectedLanguage,
  setSelectedLanguage,
  dialogueText,
  setDialogueText,
}: Props) {
  const [editing, setEditing] = useState(false);

  const templateId = selectedTemplate?.id ?? 'custom';
  const translations = DIALOGUES[templateId] ?? DIALOGUES.custom;
  const original = translations['en'] ?? '';
  const translated = translations[selectedLanguage] ?? original;
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage)!;

  // When language changes, auto-fill the textarea with the translation
  useEffect(() => {
    if (!editing) {
      setDialogueText(translated);
    }
  }, [selectedLanguage, templateId]);

  function handleLanguageSelect(code: LanguageCode) {
    setSelectedLanguage(code);
    setEditing(false);
    setDialogueText(translations[code] ?? '');
  }

  function handleReset() {
    setDialogueText(translated);
    setEditing(false);
  }

  const isEdited = dialogueText !== translated && dialogueText !== '';

  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 2 of 5" title="Choose your dialogue" className="mb-0">
        Select a language — then edit the dialogue if you want to customise it.
      </StepHeading>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card/70 p-4 shadow-sm lg:col-span-5">
          <FieldLabel className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Select language
          </FieldLabel>

          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-5 gap-2.5">
            {LANGUAGES.map((lang) => {
              const active = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={cn(
                    'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2 text-center transition-all duration-200',
                    'hover:scale-[1.02] active:scale-98',
                    active
                      ? 'border-foreground bg-foreground/5 ring-1 ring-foreground shadow-sm'
                      : 'border-border bg-background/35 hover:border-foreground/30 hover:bg-accent/40 hover:shadow-md hover:shadow-black/5',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-bold leading-none transition-colors duration-150 xl:text-base',
                      active ? 'text-foreground' : 'text-foreground/90',
                    )}
                  >
                    {lang.native}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {lang.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3 lg:col-span-7">
          <div className="w-full min-w-0 rounded-xl border border-border bg-card/70 p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Spoken Preview
            </div>

            <div className="flex w-full min-w-0 items-center gap-4 pt-2">
              <div className="flex flex-shrink-0 flex-col items-center gap-2">
                <div
                  className="relative flex h-14 w-14 items-center justify-center rounded-full border bg-background text-2xl shadow-md transition-all duration-300"
                  style={{
                    borderColor: selectedTemplate ? selectedTemplate.accent : 'var(--border)',
                    boxShadow: selectedTemplate ? `0 0 16px ${selectedTemplate.accent}25` : 'none',
                  }}
                >
                  <span className="animate-pulse-slow">
                    {selectedTemplate ? selectedTemplate.emoji : '🎙️'}
                  </span>
                </div>
                <span className="text-xs xl:text-sm font-bold text-muted-foreground tracking-wider uppercase truncate max-w-[90px] xl:max-w-[110px]">
                  {selectedTemplate ? selectedTemplate.title.split(' ').pop() : 'Presenter'}
                </span>
              </div>

              <div className="relative flex min-h-[72px] min-w-0 flex-1 items-center rounded-xl border border-border/60 bg-muted/30 p-4 shadow-inner">
                <div className="-left-2.5 absolute top-6 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-border/60" />
                <div className="-left-2 absolute top-6 h-0 w-0 border-y-[7px] border-y-transparent border-r-[7px] border-r-muted/30" />

                <p
                  className={cn(
                    'line-clamp-2 w-full text-base leading-relaxed transition-all duration-200',
                    dialogueText.trim()
                      ? 'text-foreground font-medium italic font-display'
                      : 'text-muted-foreground/60 italic text-xs xl:text-sm',
                  )}
                  lang={selectedLanguage}
                >
                  {dialogueText.trim() ? `"${dialogueText}"` : 'Silence (no spoken dialogue)...'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card/70 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <FieldLabel className="mb-0 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  {selectedTemplate?.id === 'custom'
                    ? `Write dialogue in ${currentLang.name}`
                    : `Edit spoken dialogue · ${currentLang.name}`}
                </FieldLabel>
              </div>
              {isEdited && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground underline underline-offset-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>

            <Textarea
              value={dialogueText}
              onChange={(e) => {
                setDialogueText(e.target.value);
                setEditing(true);
              }}
              placeholder={
                selectedTemplate?.id === 'custom'
                  ? `Write the spoken dialogue in ${currentLang.name}…`
                  : `Dialogue in ${currentLang.name}…`
              }
              rows={3}
              maxLength={500}
              lang={selectedLanguage}
              className="resize-none overflow-hidden bg-background text-sm leading-relaxed"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {isEdited ? (
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  Customised
                </span>
              ) : (
                <span>This line will be spoken by your character in the video</span>
              )}
              <span className="tabular-nums font-medium">{dialogueText.length} / 500</span>
            </div>
          </div>

          {selectedTemplate && selectedTemplate.id !== 'custom' && (
            <div className="overflow-hidden rounded-xl border border-border bg-card/70 shadow-sm">
              <div className="h-0.5" style={{ background: selectedTemplate.accent }} />
              <div className="flex gap-3 px-4 py-3">
                <Quote
                  className="mt-0.5 h-4 w-4 flex-shrink-0"
                  style={{ color: selectedTemplate.accent }}
                />
                <div>
                  <FieldLabel className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    Original Scenario Reference · English
                  </FieldLabel>
                  <p className="line-clamp-2 text-sm italic leading-relaxed text-foreground/75">
                    "{original}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedLanguage !== 'en' && selectedTemplate?.id !== 'custom' && translated && (
            <div className="space-y-1 rounded-xl border border-border bg-card/70 bg-muted/5 px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                <FieldLabel className="mb-0 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Official translation reference · {currentLang.name}
                </FieldLabel>
              </div>
              <p
                className="line-clamp-2 pl-5 text-sm font-medium leading-relaxed text-foreground/80"
                lang={selectedLanguage}
              >
                {translated}
              </p>
            </div>
          )}

          {!dialogueText.trim() && (
            <p className="text-center text-xs text-muted-foreground/70 italic pt-1">
              Leave blank to generate the video without spoken dialogue (only soundtrack and video)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
