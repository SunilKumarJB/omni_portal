import { Pencil, Quote, RotateCcw, Volume2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { LanguageCode, ProductPreset } from '@/lib/types';
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
  selectedProduct: ProductPreset | null;
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

/* Dialogue translations per product */

const DIALOGUES: Record<string, Record<LanguageCode, string>> = {
  lumina_aura: {
    en: "This isn't just style. It's my mood, projected in pure light. Meet Lumina Aura.",
    hi: 'यह सिर्फ स्टाइल नहीं है। यह मेरा मूड है, जो शुद्ध रोशनी में झलकता है। मिलिए ल्यूमिना ऑरा से।',
    ta: 'இது வெறும் ஸ்டைல் அல்ல. இது என் மனநிலை, தூய ஒளியில் பிரதிபலிக்கிறது. லுமினா ஆராவை சந்தியுங்கள்.',
    te: 'ఇది కేవలం స్టైల్ కాదు. ఇది నా మూడ్, స్వచ్ఛమైన కాంతితో ప్రసరిస్తోంది. లూమినా ఆరాను చూడండి.',
    kn: 'ಇದು ಕೇವಲ ಸ್ಟೈಲ್ ಅಲ್ಲ. ಇದು ನನ್ನ ಮೂಡ್, ಶುದ್ಧ ಬೆಳಕಿನಲ್ಲಿ ಮೂಡಿಬಂದಿದೆ. ಲುಮಿನา ಆರಾ ಪರಿಚಯಿಸಿಕೊಳ್ಳಿ.',
    ml: 'ഇത് വെറും സ്റ്റൈൽ അല്ല. ഇത് എന്റെ mood ആണ്, ശുദ്ധമായ വെളിച്ചത്തിൽ പ്രതിഫലിക്കുന്നു. ലൂമിന ഓറയെ പരിചയപ്പെടൂ.',
    bn: 'এটি কেবল স্টাইল নয়। এটি আমার মেজাজ, যা খাঁটি আলোতে প্রতিফলিত হয়। লুমিনা অরার সাথে পরিচিত হন।',
    mr: 'हा फक्त स्टाईल नाही. हा माझा मूड आहे, जो शुद्ध प्रकाशात प्रक्षेपत होतो. ल्युमिना ऑराला भेटा.',
    gu: 'આ ફક્ત સ્ટાઇલ નથી. આ મારો મૂડ છે, જે શુદ્ધ પ્રકાશમાં પ્રગટ થાય છે. લ્યુમિના ઓરાને મળો.',
    pa: 'ਇਹ ਸਿਰਫ਼ ਸਟਾਈਲ ਨਹੀਂ ਹੈ। ਇਹ ਮੇਰਾ ਮੂਡ ਹੈ, ਜੋ ਸ਼ੁੱਧ ਰੌਸ਼ਨੀ ਵਿੱਚ ਦਿਖਾਈ ਦਿੰਦਾ ਹੈ। ਮਿਲੋ ਲਿਊਮਿਨਾ ਔਰਾ ਨਾਲ।',
  },
  solaris_roadster: {
    en: 'Pure electric performance, charged by the sun. The Solaris Roadster has arrived.',
    hi: 'सूरज से चार्ज होने वाली शुद्ध इलेक्ट्रिक परफॉर्मेंस। सोलारिस रोडस्टर आ गई है।',
    ta: 'சூரியனால் சார்ஜ் செய்யப்படும் தூய மின்சார செயல்திறன். சோலாரிஸ் ரோட்ஸ்டர் வந்துவிட்டது.',
    te: 'సూర్యునితో ఛార్జ్ అయ్యే స్వచ్ఛమైన ఎలక్ట్రిక్ పర్ఫార్మెన్స్. సోలారిస్ రోడ్‌స్టర్ వచ్చేసింది.',
    kn: 'ಸೂರ್ಯನಿಂದ ಚಾರ್ಜ್ ಆಗುವ ಶುದ್ಧ ಎಲೆಕ್ಟ್ರಿಕ್ ಪರ್ಫಾರ್ಮೆನ್ಸ್. ಸೋಲಾರಿಸ್ ರೋಡ್‌ಸ್ಟರ್ ಬಂದಿದೆ.',
    ml: 'സൂര്യനിൽ നിന്ന് ചാർജ്ജ് ചെയ്യുന്ന ശുദ്ധമായ ഇലക്ട്രിക് പെർഫോമൻസ്. സോളാരിസ് റോഡ്സ്റ്റർ എത്തിക്കഴിഞ്ഞു.',
    bn: 'সূর্য দ্বারা চার্জযুক্ত খাঁটি বৈদ্যুতিক পারফরম্যান্স। সোলারিস রোডস্টার এসে গেছে।',
    mr: 'सूर्याने चार्ज होणारी शुद्ध इलेक्ट्रिक कामगिरी. सोलारिस रोडस्टर आली आहे.',
    gu: 'સૂર્યથી ચાર્જ થતી શુદ્ધ ઇલેક્ટ્રિક કામગીરી. સોલારિસ રોડસ્ટર આવી ગઈ છે.',
    pa: 'ਸੂਰਜ ਨਾਲ ਚਾਰਜ ਹੋਣ ਵਾਲੀ ਸ਼ੁੱਧ ਇਲੈਕਟ੍ਰਿਕ ਕਾਰਗੁਜ਼ਾਰੀ। ਸੋਲਾਰਿਸ ਰੋਡਸਟਰ ਆ ਗਈ ਹੈ।',
  },
  aether_glass: {
    en: 'The world is my canvas. With Aether Glass, the future is always in sight.',
    hi: 'दुनिया मेरा कैनवास है। ईथर ग्लास के साथ, भविष्य हमेशा नजरों में रहता है।',
    ta: 'உலகமே என் கேன்வாஸ். ஈதர் கிளாஸ் உடன், எதிர்காலம் எப்போதும் கண்முன்னே இருக்கிறது.',
    te: 'ప్రపంచమే నా కాన్వాస్. ఈథర్ గ్లాస్‌తో, భవిష్యత్తు ఎల్లప్పుడూ কళ్ళముందే ఉంటుంది.',
    kn: 'ಪ್ರಪಂಚವೇ ನನ್ನ ಕ್ಯಾನ್ವಾಸ್. ಈಥರ್ ಗ್ಲಾಸ್‌ನೊಂದಿಗೆ, ಭವಿಷ್ಯ ಯಾವಾಗಲೂ ಕಣ್ಣೆದುರೇ ಇರುತ್ತದೆ.',
    ml: 'ലോകം എന്റെ ക്യാൻവാസ് ആണ്. ഈഥർ ഗ്ലാസ്സിലൂടെ, ഭാവി എപ്പോഴും കൺമുന്നിലുണ്ട്.',
    bn: 'পৃথিবী আমার ক্যানভাস। ইথার গ্লাসের সাথে, ভবিষ্যৎ সবসময় চোখের সামনে।',
    mr: 'जग माझा कॅनव्हास आहे. इथर ग्लाससह, भविष्य नेहमी डोळ्यांसमोर असते.',
    gu: 'દુનિયા મારો કેનવાસ છે. ઈથર ગ્લાસ સાથે, ભવિષ્ય હંમેશા નજર સમક્ષ છે.',
    pa: 'ਦੁਨੀਆ ਮੇਰਾ ਕੈਨਵਸ ਹੈ। ਈਥਰ ਗਲਾਸ ਦੇ ਨਾਲ, ਭਵਿੱਖ ਹਮੇਸ਼ਾ ਨਜ਼ਰ ਵਿੱਚ ਰਹਿੰਦਾ ਹੈ।',
  },
  quantum_chrono: {
    en: "Time doesn't control me. I shape it. The Quantum Chrono: absolute precision.",
    hi: 'समय मुझे नियंत्रित नहीं करता। मैं इसे आकार देता हूँ। क्वांटम क्रोनो: पूर्ण सटीकता।',
    ta: 'நேரம் என்னை கட்டுப்படுத்துவதில்லை. நானே அதை வடிவமைக்கிறேன். குவாண்டம் குரோனோ: முழுமையான துல்லியம்.',
    te: 'సమయం నన్ను నియంత్రించదు. నేనే దానిని రూపుదిద్దుతాను. క్వాంటం క్రోనో: సంపూర్ణ ఖచ్చితత్వం.',
    kn: 'ಸಮಯ ನನ್ನನ್ನು ನಿಯಂತ್ರಿಸುವುದಿಲ್ಲ. ನಾನು ಅದನ್ನು ರೂಪಿಸುತ್ತೇನೆ. ಕ್ವಾಂಟಮ್ ಕ್ರೋನೋ: ಸಂಪೂರ್ಣ ನಿಖರತೆ.',
    ml: 'സമയം എന്നെ നിയന്ത്രിക്കുന്നില്ല. ഞാൻ അതിനെ രൂപപ്പെടുത്തുന്നു. ക്വാണ്ടം ക്രോണോ: പൂർണ്ണമായ കൃത്യത.',
    bn: 'সময় আমাকে নিয়ন্ত্রণ করে না। আমি একে রূপ দিই। কোয়ান্টাম ক্রোনো: পরম নির্ভুলতা।',
    mr: 'वेळ मला नियंत्रित करत नाही. मी त्याला आकार देतो. क्वांटम क्रोनो: परिपूर्ण अचूकता.',
    gu: 'સમય મને નિયંત્રિત કરતો નથી. હું તેને આકાર આપું છું. ક્વોન્ટમ ક્રોનો: સંપૂર્ણ ચોકસાઈ.',
    pa: 'ਸਮਾਂ ਮੈਨੂੰ ਕੰਟਰੋਲ ਨਹੀਂ ਕਰਦਾ। ਮੈਂ ਇਸਨੂੰ ਆਕਾਰ ਦਿੰਦਾ ਹਾਂ। ਕੁਆਂਟਮ ਕ੍ਰੋਨो: ਸੰਪੂਰਨ ਸ਼ੁੱਧਤਾ।',
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
  selectedProduct,
  selectedLanguage,
  setSelectedLanguage,
  dialogueText,
  setDialogueText,
}: Props) {
  const [editing, setEditing] = useState(false);

  const productId = selectedProduct?.id ?? 'custom';
  const translations = DIALOGUES[productId] ?? DIALOGUES.custom;
  const original = translations['en'] ?? '';
  const translated = translations[selectedLanguage] ?? original;
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage)!;

  // When language changes, auto-fill the textarea with the translation
  useEffect(() => {
    if (!editing) {
      setDialogueText(translated);
    }
  }, [selectedLanguage, productId]);

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
      <StepHeading eyebrow="Step 3 of 6" title="Choose your dialogue" className="mb-0">
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
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border bg-background text-2xl shadow-md transition-all duration-300 border-border">
                  <span className="animate-pulse-slow">
                    {selectedProduct ? selectedProduct.emoji : '🎙️'}
                  </span>
                </div>
                <span className="text-xs xl:text-sm font-bold text-muted-foreground tracking-wider uppercase truncate max-w-[90px] xl:max-w-[110px]">
                  {selectedProduct ? selectedProduct.name.split(' ').pop() : 'Presenter'}
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
                  {selectedProduct?.id === 'custom'
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
                selectedProduct?.id === 'custom'
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

          {selectedProduct && selectedProduct.id !== 'custom' && (
            <div className="overflow-hidden rounded-xl border border-border bg-card/70 shadow-sm">
              <div className="h-0.5 bg-border" />
              <div className="flex gap-3 px-4 py-3">
                <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <FieldLabel className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    Original Product Script Reference · English
                  </FieldLabel>
                  <p className="line-clamp-2 text-sm italic leading-relaxed text-foreground/75">
                    "{original}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedLanguage !== 'en' && selectedProduct?.id !== 'custom' && translated && (
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
