import { Pencil, Quote, RotateCcw, Volume2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import StepHeading, { FieldLabel } from './StepHeading.jsx';

/* ── Types ─────────────────────────────────────────────────── */

interface Language {
  code: string;
  name: string;
  native: string;
  script: string;
}

interface Template {
  id: string;
  title: string;
  emoji: string;
  accent: string;
  dialogue: string;
}

interface Props {
  selectedTemplate: Template | null;
  selectedLanguage: string;
  setSelectedLanguage: (code: string) => void;
  dialogueText: string;
  setDialogueText: (text: string) => void;
}

/* ── Language list ─────────────────────────────────────────── */

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

/* ── Dialogue translations per template ─────────────────────── */

const DIALOGUES: Record<string, Record<string, string>> = {
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

/* ── Component ─────────────────────────────────────────────── */

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

  function handleLanguageSelect(code: string) {
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
    <div className="mx-auto max-w-3xl animate-slide-up space-y-7">
      <StepHeading eyebrow="Step 2 of 5" title="Choose your dialogue" className="mb-0">
        Select a language — then edit the dialogue if you want to customise it.
      </StepHeading>

      {/* ── Original English dialogue card ──────────────── */}
      {selectedTemplate && selectedTemplate.id !== 'custom' && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="h-0.5" style={{ background: selectedTemplate.accent }} />
          <div className="flex gap-3 px-5 py-4">
            <Quote
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              style={{ color: selectedTemplate.accent }}
            />
            <div>
              <FieldLabel className="mb-1">Original · English</FieldLabel>
              <p className="text-sm italic leading-relaxed text-foreground/80">{original}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Language selector ───────────────────────────── */}
      <div>
        <FieldLabel className="mb-3">Select language</FieldLabel>

        <div
          className="flex gap-2 pb-2"
          style={{ overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {LANGUAGES.map((lang) => {
            const active = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={cn(
                  'flex min-w-[72px] flex-shrink-0 select-none flex-col items-center gap-1 rounded-md border px-4 py-2.5 transition-all duration-150',
                  active
                    ? 'border-foreground bg-foreground/5'
                    : 'border-border bg-card hover:border-foreground/30 hover:bg-accent/40',
                )}
              >
                <span
                  className={cn(
                    'text-base font-medium leading-none',
                    active ? 'text-foreground' : 'text-foreground/90',
                  )}
                >
                  {lang.native}
                </span>
                <span className="text-[10px] text-muted-foreground">{lang.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Translated dialogue display ─────────────────── */}
      {selectedLanguage !== 'en' && selectedTemplate?.id !== 'custom' && translated && (
        <div className="space-y-1 rounded-lg border border-border bg-card px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            <FieldLabel className="mb-0">
              Translation · {currentLang.name} ({currentLang.script} script)
            </FieldLabel>
          </div>
          <p className="text-base leading-relaxed text-foreground/90" lang={selectedLanguage}>
            {translated}
          </p>
        </div>
      )}

      {/* ── Editable dialogue textarea ──────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            <FieldLabel className="mb-0">
              {selectedTemplate?.id === 'custom'
                ? `Write dialogue in ${currentLang.name}`
                : `Edit dialogue · ${currentLang.name}`}
            </FieldLabel>
          </div>
          {isEdited && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
          className="resize-none text-base"
        />

        <div className="flex items-center justify-between">
          {isEdited ? (
            <span className="text-[10px] text-warning">Customised</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              This line will be spoken by your character in the video
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{dialogueText.length}/500</span>
        </div>
      </div>

      {/* Skip note */}
      {!dialogueText.trim() && (
        <p className="text-center text-xs text-muted-foreground">
          Leave blank to generate the video without spoken dialogue
        </p>
      )}
    </div>
  );
}
