import { Pencil, Quote, RotateCcw, Volume2 } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
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
  userName: string;
  selectedProduct: ProductPreset | null;
  selectedLanguage: LanguageCode;
  setSelectedLanguage: React.Dispatch<React.SetStateAction<LanguageCode>>;
  dialogueText: string;
  setDialogueText: React.Dispatch<React.SetStateAction<string>>;
  /** Set once the director has typed here; lives in the parent so it survives unmount. */
  dialogueTouched: boolean;
  setDialogueTouched: React.Dispatch<React.SetStateAction<boolean>>;
}

/* Language list */

export const LANGUAGES: Language[] = [
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
  aggressive_toaster: {
    en: "Hi, I'm [Character_Name]. Perfect toast, launched with absolute power. No delays, no compromise. Aggressive Toaster.",
    hi: 'नमस्ते, मैं [Character_Name] हूँ। परफेक्ट टोस्ट, पूरी ताकत से लॉन्च किया गया। कोई देरी नहीं, कोई समझौता नहीं। अग्रेसिव टोस्टर।',
    ta: 'வணக்கம், நான் [Character_Name]. முழு ஆற்றலுடன் ஏவப்பட்ட சரியான டோஸ்ட். தாமதமும் இல்லை, சமரசமும் இல்லை. அக்ரசிவ் டோஸ்டர்.',
    te: 'నమస్తే, నేను [Character_Name]. సంపూర్ణ శక్తితో లాంచ్ చేయబడిన పర్ఫెక్ట్ టోస్ట్. ఆలస్యం లేదు, రాజీ లేదు. అగ్రెసివ్ టోస్టర్.',
    kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಸಂಪೂರ್ಣ ಶಕ್ತಿಯಿಂದ ಲಾಂಚ್ ಆದ ಪರಿಪೂರ್ಣ ಟೋಸ್ಟ್. ವಿಳಂಬವಿಲ್ಲ, ರಾಜಿ ಇಲ್ಲ. ಅಗ್ರೆಸಿವ್ ಟೋಸ್ಟರ್.',
    ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. പൂർണ്ണ ശക്തിയിൽ പുറത്തുവരുന്ന മികച്ച ടോസ്റ്റ്. വൈകില്ല, വിട്ടുവീഴ്ചയുമില്ല. അഗ്രസീവ് ടോസ്റ്റർ.',
    bn: 'নমস্কার, আমি [Character_Name]। নিখুঁত টোস্ট, নিখাদ শক্তিতে লঞ্চ করা হয়েছে। কোনো দেরি নেই, কোনো আপস নেই। অ্যাগ্রেসিভ টোস্টার।',
    mr: 'नमस्कार, मी [Character_Name]. भरपूर ताकदीने लाँच झालेला परफेक्ट टोस्ट. उशीर नाही, तडजोड नाही. अग्रेसिव्ह टोस्टर.',
    gu: 'નમસ્તે, હું [Character_Name] છું. સંપૂર્ણ શક્તિથી લોન્ચ થયેલ પરફેક્ટ ટોસ્ટ. કોઈ વિલંબ નહીં, કોઈ બાંધછોડ નહીં. અગ્રેસિવ ટોસ્ટર.',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਪਰਫੈਕਟ ਟੋਸਟ, ਪੂਰੀ ਤਾਕਤ ਨਾਲ ਲਾਂਚ ਕੀਤਾ ਗਿਆ। ਕੋਈ ਦੇਰੀ ਨਹੀਂ, ਕੋਈ ਸਮਝੌਤਾ ਨਹੀਂ। ਅਗਰੈਸਿਵ ਟੋਸਟਰ।',
  },
  snooze_blanket: {
    en: "Hi, I'm [Character_Name]. Instant sleep, zero resistance. Wrap yourself in pure serenity. The Snooze Blanket.",
    hi: 'नमस्ते, मैं [Character_Name] हूँ। तुरंत नींद, कोई रुकावट नहीं। खुद को शुद्ध शांति में लपेटें। द स्नूज़ ब्लैंकेट।',
    ta: 'வணக்கம், நான் [Character_Name]. உடனடி தூக்கம், பூஜ்ஜிய எதிர்ப்பு. தூய அமைதியில் உங்களை மூழ்கடியுங்கள். தி ஸ்னூஸ் பிளாங்கெட்.',
    te: 'నమస్తే, నేను [Character_Name]. తక్షణ నిద్ర, సున్నా నిరోధకత. మిమ్మల్ని స్వచ్ఛమైన ప్రశాంతతలో ముంచేసుకోండి. ది స్నూజ్ బ్లాంకెట్.',
    kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ತಕ್ಷಣದ ನಿದ್ದೆ, ಯಾವುದೇ ಅಡೆತಡೆಯಿಲ್ಲ. ನಿಮ್ಮನ್ನು ಶುದ್ಧ ಶಾಂತಿಯಲ್ಲಿ ಸುತ್ತಿಕೊಳ್ಳಿ. ದಿ ಸ್ನೂಜ್ ಬ್ಲಾಂಕೆಟ್.',
    ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഉടൻ ഉറക്കം, ഒട്ടും തടസ്സമില്ലാതെ. ശുദ്ധമായ ശാന്തതയിൽ സ്വയം പൊതിയൂ. ദി സ്നൂസ് ബ്ലാങ്കറ്റ്.',
    bn: 'নমস্কার, আমি [Character_Name]। তাৎক্ষণিক ঘুম, কোনো বাধা ছাড়াই। নিজেকে খাঁটি শান্তিতে জড়িয়ে নিন। দ্য স্নুজ ব্ল্যাঙ্কেট।',
    mr: 'नमस्कार, मी [Character_Name]. झटपट झोप, कोणतीही अडचण नाही. स्वतःला शुद्ध शांततेत गुंडाळा. द स्नूझ ब्लँकेट.',
    gu: 'નમસ્તે, હું [Character_Name] છું. તરત જ ઊંઘ, કોઈ અવરોધ વિના. તમારી જાતને શુદ્ધ શાંતિમાં લપેટી લો. ધ સ્નૂઝ બ્લેન્કેટ.',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਤੁਰੰਤ ਨੀਂਦ, ਕੋਈ ਰੁਕਾਵਟ ਨਹੀਂ। ਆਪਣੇ ਆਪ ਨੂੰ ਸ਼ੁੱਧ ਸ਼ਾਂਤੀ ਵਿੱਚ ਲਪੇਟੋ। ਦ ਸਨੂਜ਼ ਬਲੈਂਕੇਟ।',
  },
  flying_sneakers: {
    en: "Hi, I'm [Character_Name]. Why walk when you can fly? Defy gravity and walk on air. The AeroSneaks.",
    hi: 'नमस्ते, मैं [Character_Name] हूँ। जब उड़ सकते हैं तो चलना क्यों? गुरुत्वाकर्षण को चुनौती दें और हवा में चलें। द एयरोस्नीक्स।',
    ta: 'வணக்கம், நான் [Character_Name]. பறக்க முடியும் போது ஏன் நடக்க வேண்டும்? ஈர்ப்பு விசையை எதிர்த்து காற்றில் நடங்கள். தி ஏரோஸ்னீக்ஸ்.',
    te: 'నమస్తే, నేను [Character_Name]. ఎగరగలిగినప్పుడు నడవడం ఎందుకు? గురుత్వాకర్షణను ఎదిరించి గాల్లో నడవండి. ది ఏరోస్నీక్స్.',
    kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಹಾರಲು ಸಾಧ್ಯವಿರುವಾಗ ನಡೆಯುವುದು ಏಕೆ? ಗುರುತ್ವಾಕರ್ಷಣೆಯನ್ನು ಮೀರಿ ಗಾಳಿಯಲ್ಲಿ ನಡೆಯಿರಿ. ದಿ ಏರೋಸ್ನೀಕ್ಸ್.',
    ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. പറക്കാൻ കഴിയുമ്പോൾ എന്തിനാണ് നടക്കുന്നത്? ഗുരുത്വാകർഷണത്തെ വെല്ലുവിളിച്ച് വായുവിൽ നടക്കൂ. ദി എയറോസ്നീക്സ്.',
    bn: 'নমস্কার, আমি [Character_Name]। যখন উড়তে পারেন তখন হাঁটবেন কেন? মাধ্যাকর্ষণকে জয় করে বাতাসে হাঁটুন। দ্য অ্যারোস্নিক্স।',
    mr: 'नमस्कार, मी [Character_Name]. जेव्हा उडू शकता तेव्हा चालायचं कशाला? गुरुत्वाकर्षण झुगारा आणि हवेत चाला. द एरोस्नीक्स.',
    gu: 'નમસ્તે, હું [Character_Name] છું. જ્યારે ઉડી શકો છો તો ચાલવું શા માટે? ગુરુત્વાકર્ષણને પડકારો અને હવામાં ચાલો. ધ એરોસ્નીક્સ.',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਜਦੋਂ ਤੁਸੀਂ ਉੱਡ ਸਕਦੇ ਹੋ ਤਾਂ ਤੁਰਨਾ ਕਿਉਂ? ਗੁਰੂਤਾਕਰਸ਼ਣ ਨੂੰ ਚੁਣੌਤੀ ਦਿਓ ਅਤੇ ਹਵਾ ਵਿੱਚ ਚੱਲੋ। ਦ ਐਰੋਸਨੀਕਸ।',
  },
  flying_suv: {
    en: "Hi, I'm [Character_Name]. No roads. No limits. Elevate your family journeys into the skies. AeroCruiser SUV.",
    hi: 'नमस्ते, मैं [Character_Name] हूँ। कोई सड़कें नहीं। कोई सीमाएं नहीं। अपने पारिवारिक सफ़र को आसमान तक ले जाएं। एयरोक्रूज़र एसयूवी।',
    ta: 'வணக்கம், நான் [Character_Name]. சாலைகள் இல்லை. எல்லைகள் இல்லை. உங்கள் குடும்ப பயணங்களை வானத்திற்கு உயர்த்துங்கள். ஏரோக்ரூஸர் எஸ்யூவி.',
    te: 'నమస్తే, నేను [Character_Name]. రోడ్లు లేవు. పరిమితులు లేవు. మీ కుటుంబ ప్రయాణాలను ఆకాశంలోకి తీసుకెళ్లండి. ఏరోక్రూజర్ ఎస్‌యూవీ.',
    kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ರಸ್ತೆಗಳಿಲ್ಲ. ಮಿತಿಗಳಿಲ್ಲ. ನಿಮ್ಮ ಕೌಟುಂಬಿಕ ಪ್ರಯಾಣವನ್ನು ಆಕಾಶಕ್ಕೆ ಕೊಂಡೊಯ್ಯಿರಿ. ಏರೋಕ್ರೂಸರ್ ಎಸ್‌ಯುವಿ.',
    ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. റോഡുകളില്ല. പരിധികളില്ല. നിങ്ങളുടെ കുടുംബ യാത്രകളെ ആകാശത്തേക്ക് ഉയർത്തൂ. എയറോക്രൂസർ എസ് യു വി.',
    bn: 'নমস্কার, আমি [Character_Name]। কোনো রাস্তা নেই। কোনো সীমা নেই। আপনার পারিবারিক ভ্রমণকে আকাশে উন্নীত করুন। অ্যারোক্রুজার এসইউভি।',
    mr: 'नमस्कार, मी [Character_Name]. रस्ते नाहीत. मर्यादा नाहीत. तुमच्या कौटुंबिक प्रवासाला थेट आकाशात घेऊन जा. एरोक्रूझर एसयूव्ही.',
    gu: 'નમસ્તે, હું [Character_Name] છું. કોઈ રસ્તા નથી. કોઈ સીમા નથી. તમારી કૌટુંબિક સફરને આકાશમાં લઈ જાઓ. એરોક્રૂઝર એસયૂવી.',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਕੋਈ ਸੜਕਾਂ ਨਹੀਂ। ਕੋਈ ਹੱਦਾਂ ਨਹੀਂ। ਆਪਣੇ ਪਰਿਵਾਰਕ ਸਫ਼ਰ ਨੂੰ ਅਸਮਾਨ ਵਿੱਚ ਲੈ ਜਾਓ। ਐਰੋਕਰੂਜ਼ਰ ਐਸਯੂਵੀ।',
  },
  impatient_spoon: {
    en: "Hi, I'm [Character_Name]. Because every second counts. Get the perfect stir in a flash. The Impatient Chai Spoon.",
    hi: 'नमस्ते, मैं [Character_Name] हूँ। क्योंकि हर सेकंड कीमती है। पलक झपकते ही सही मिक्स पाएं। द इम्पेसिएंट चाय स्पून।',
    ta: 'வணக்கம், நான் [Character_Name]. ஏனெனில் ஒவ்வொரு நொடியும் முக்கியம். ஒரு நொடியில் சரியான கலவையைப் பெறுங்கள். தி இம்பேஷியண்ட் சாய் ஸ்பூன்.',
    te: 'నమస్తే, నేను [Character_Name]. ఎందుకంటే ప్రతి క్షణం విలువైనది. క్షణంలో పరిపూర్ణమైన కలయికను పొందండి. ది ఇంపేషెంట్ చాయ్ స్పూన్.',
    kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಏಕೆಂದರೆ ಪ್ರತಿ ಕ್ಷಣವೂ ಮುಖ್ಯ. ಕ್ಷಣಾರ್ಧದಲ್ಲಿ ಪರಿಪೂರ್ಣ ಕಲಕುವಿಕೆ ಪಡೆಯಿರಿ. ದಿ ಇಂಪೇಷಿಯಂಟ್ ಚಾಯ್ ಸ್ಪೂನ್.',
    ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഓരോ സെക്കൻഡും വിലപ്പെട്ടതായതുകൊണ്ട്. ഒരു നിമിഷം കൊണ്ട് ചായ നന്നായി ഇളക്കൂ. ദി ഇംപേഷ്യന്റ് ചായ സ്പൂൺ.',
    bn: 'নমস্কার, আমি [Character_Name]। কারণ প্রতিটি সেকেন্ড মূল্যবান। পলকের মধ্যে নিখুঁত নাড়ানি পান। দ্য ইমপেশেন্ট চা স্পুন।',
    mr: 'नमस्कार, मी [Character_Name]. कारण प्रत्येक सेकंद महत्त्वाचा आहे. चुटकीसरशी परफेक्ट ढवळून घ्या. द इम्पेशंट चहा स्पून.',
    gu: 'નમસ્તે, હું [Character_Name] છું. કારણ કે દરેક સેકન્ડ કિંમતી છે. આંખના પલકારામાં પરફેક્ટ મિક્સ મેળવો. ધ ઇમ્પેશેન્ટ ચાઇ સ્પૂન.',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਕਿਉਂਕਿ ਹਰ ਸੈਕਿੰਡ ਕੀਮਤੀ ਹੈ। ਪਲਕ ਝਪਕਦਿਆਂ ਹੀ ਪਰਫੈਕਟ ਘੋਲ ਪ੍ਰਾਪਤ ਕਰੋ। ਦ ਇਮਪੇਸ਼ੈਂਟ ਚਾਹ ਸਪੂਨ।',
  },
  diet_plate: {
    en: "Hi, I'm [Character_Name]. Guilt-free dining by optical illusion. Make small portions look massive. The Diet Plate.",
    hi: 'नमस्ते, मैं [Character_Name] हूँ। ऑप्टिकल इल्यूजन से अपराध-मुक्त भोजन। छोटे हिस्से को भी बड़ा दिखाएं। द डाइट प्लेट।',
    ta: 'வணக்கம், நான் [Character_Name]. ஒளியியல் மாயை மூலம் குற்ற உணர்ச்சியற்ற உணவு. சிறிய அளவை பெரியதாகக் காட்டுங்கள். தி டயட் பிளேட்.',
    te: 'నమస్తే, నేను [Character_Name]. ఆప్టికల్ ఇల్యూషన్ ద్వారా పశ్చాత్తాపం లేని భోజనం. చిన్న భాగాలను పెద్దవిగా చూపించండి. ది డైట్ ప్లేట్.',
    kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಆಪ್ಟಿಕಲ್ ಇಲ್ಯೂಷನ್ ಮೂಲಕ ಅಪರಾಧ ಪ್ರಜ್ಞೆಯಿಲ್ಲದ ಊಟ. ಸಣ್ಣ ಪ್ರಮಾಣವನ್ನು ದೊಡ್ಡದಾಗಿ ತೋರಿಸಿ. ದಿ ಡಯಟ್ ಪ್ಲೇಟ್.',
    ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ആപ്റ്റിക്കൽ മിഥ്യയിലൂടെ കുറ്റബോധമില്ലാത്ത ഭക്ഷണം. ചെറിയ ഭാഗങ്ങളെ വലുതായി കാണിക്കൂ. ദി ഡയറ്റ് പ്ലേറ്റ്.',
    bn: 'নমস্কার, আমি [Character_Name]। অপটিক্যাল ইলিউশনের সাহায্যে অপরাধবোধ-মুক্ত ভোজন। ছোট অংশকে বিশাল দেখান। দ্য ডায়েট প্লেট।',
    mr: 'नमस्कार, मी [Character_Name]. ऑप्टिकल इल्यूजनने अपराधमुक्त जेवण. लहान भागही मोठा दाखवा. द डाएट प्लेट.',
    gu: 'નમસ્તે, હું [Character_Name] છું. ઓપ્ટિકલ ઇલ્યુઝન દ્વારા અપરાધ-મુક્ત ભોજન. નાના ભાગોને પણ વિશાળ બનાવો. ધ ડાયેટ પ્લેટ.',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਆਪਟੀਕਲ ਭੁਲੇਖੇ ਰਾਹੀਂ ਅਪਰਾਧ-ਮੁਕਤ ਭੋਜਨ। ਛੋਟੇ ਹਿੱਸੇ ਨੂੰ ਵੱਡਾ ਦਿਖਾਓ। ਦ ਡਾਈਟ ਪਲੇਟ।',
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
  userName,
  selectedProduct,
  selectedLanguage,
  setSelectedLanguage,
  dialogueText,
  setDialogueText,
  dialogueTouched,
  setDialogueTouched,
}: Props) {
  const productId = selectedProduct?.id ?? 'custom';
  const translations = DIALOGUES[productId] ?? DIALOGUES.custom;
  const original = translations['en'] ?? '';
  const rawTranslated = translations[selectedLanguage] ?? original;

  // Replace [Character_Name] with the actual character name
  const cName = userName || 'our character';
  const translated = rawTranslated.replace(/\[Character_Name\]/g, cName);

  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage)!;

  // The dialogue lives in the parent, so entering the step seeds it with the default
  // translation for the current product/name. Once the director has typed here —
  // including clearing the line on purpose — their text is never overwritten again.
  useEffect(() => {
    if (!dialogueTouched) setDialogueText(translated);
  }, []);

  function handleLanguageSelect(code: LanguageCode) {
    setSelectedLanguage(code);
    if (dialogueTouched) return; // keep the director's own line
    const rawSel = translations[code] ?? '';
    setDialogueText(rawSel.replace(/\[Character_Name\]/g, cName));
  }

  function handleReset() {
    setDialogueText(translated);
    setDialogueTouched(false);
  }

  const isEdited = dialogueTouched && dialogueText !== translated;

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
                setDialogueTouched(true);
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
