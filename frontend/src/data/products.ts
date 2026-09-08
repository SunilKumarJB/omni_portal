import type { ProductCategory, ProductPreset } from '@/lib/types';

/** How many products the hero step shows per demo run. Fits the 3x2 grid without scrolling. */
export const HERO_PRODUCT_SLOTS = 6;
/** Cap per category so a run never shows six kitchen gadgets together. */
export const HERO_MAX_PER_CATEGORY = 2;

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  kitchen: 'Kitchen',
  home: 'Home & Sleep',
  wearables: 'Wearables',
  mobility: 'Mobility',
  wellness: 'Wellness',
  gadgets: 'Gadgets',
};

/**
 * Full catalog. Everything the wizard needs for a product lives on its entry: the card copy,
 * the visual clause spliced into the video prompt, the scenario posture and the default pitch
 * line per language. Adding a product means adding one object here and nothing else.
 *
 * Translations for the products added in September 2026 were machine-drafted and have not
 * been checked by a native reader.
 */
export const PRODUCT_CATALOG: ProductPreset[] = [
  /* Kitchen */
  {
    id: 'aggressive_toaster',
    name: 'Aggressive Toaster',
    tagline: 'Toast or else. No compromises.',
    description:
      'A high-performance toaster that aggressively launches perfectly browned toast up to three feet in the air with dramatic sound effects.',
    visualDescription:
      'catching golden-brown toast launched three feet into the air by the Aggressive Toaster, a high-octane chrome kitchen device sporting glowing red heat indicators',
    emoji: '🍞',
    category: 'kitchen',
    posture: 'active',
    dialogue: {
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
  },
  {
    id: 'impatient_spoon',
    name: 'Impatient Chai Spoon',
    tagline: 'Stir faster, drink sooner.',
    description:
      'A high-speed self-stirring spoon that stirs at sonic speeds and aggressively alerts you the exact millisecond your chai is ready.',
    visualDescription:
      'holding the Impatient Chai Spoon, a sleek copper self-stirring spoon stirring a cup of steaming masala chai at hyper-speed, creating a dramatic, rapid whirlpool in the cup with tea swirling violently, the spoon flashing bright green to signal it is ready',
    emoji: '🥄',
    category: 'kitchen',
    posture: 'active',
    dialogue: {
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
  },
  {
    id: 'diet_plate',
    name: 'Diet Plate',
    tagline: 'Guilt-free dining by optical illusion.',
    description:
      'An interactive smart plate using optical projection to make small portions look massive and visually pushing away unhealthy foods.',
    visualDescription:
      'looking at a salad served on the Diet Plate, a smart glass plate projecting a holographic magnifying field to make food portions appear twice their actual size',
    emoji: '🍽️',
    category: 'kitchen',
    posture: 'active',
    dialogue: {
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
  },
  {
    id: 'telepathic_kettle',
    name: 'Telepathic Kettle',
    tagline: 'It knows you want chai.',
    description:
      'A smart kettle that reads your morning mood from your voice and starts boiling the moment you so much as think about chai.',
    visualDescription:
      'reaching for the Telepathic Kettle, a brushed-copper smart kettle already steaming on the counter with a soft violet ring glowing around its lid as it anticipates the first chai of the day',
    emoji: '🫖',
    category: 'kitchen',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. Think of chai, and it's already boiling. Your mind, your kettle. The Telepathic Kettle.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। चाय के बारे में सोचिए, और यह पहले से उबल रही है। आपका मन, आपकी केतली। द टेलीपैथिक केटल।',
      ta: 'வணக்கம், நான் [Character_Name]. சாயை நினைத்தாலே போதும், அது ஏற்கனவே கொதிக்கிறது. உங்கள் மனம், உங்கள் கெட்டில். தி டெலிபதிக் கெட்டில்.',
      te: 'నమస్తే, నేను [Character_Name]. చాయ్ గురించి ఆలోచించండి, అది అప్పటికే మరుగుతోంది. మీ మనసు, మీ కెటిల్. ది టెలిపతిక్ కెటిల్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಚಹಾದ ಬಗ್ಗೆ ಯೋಚಿಸಿ, ಅದು ಆಗಲೇ ಕುದಿಯುತ್ತಿದೆ. ನಿಮ್ಮ ಮನಸ್ಸು, ನಿಮ್ಮ ಕೆಟಲ್. ದಿ ಟೆಲಿಪತಿಕ್ ಕೆಟಲ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ചായയെക്കുറിച്ച് ചിന്തിക്കൂ, അത് ഇതിനകം തിളയ്ക്കുന്നു. നിങ്ങളുടെ മനസ്സ്, നിങ്ങളുടെ കെറ്റിൽ. ദി ടെലിപതിക് കെറ്റിൽ.',
      bn: 'নমস্কার, আমি [Character_Name]। চায়ের কথা ভাবুন, আর এটি ইতিমধ্যেই ফুটছে। আপনার মন, আপনার কেটলি। দ্য টেলিপ্যাথিক কেটল।',
      mr: 'नमस्कार, मी [Character_Name]. चहाचा विचार करा, आणि ती आधीच उकळत आहे. तुमचं मन, तुमची किटली. द टेलिपॅथिक केटल.',
      gu: 'નમસ્તે, હું [Character_Name] છું. ચા વિશે વિચારો, અને તે પહેલેથી જ ઉકળી રહી છે. તમારું મન, તમારી કીટલી. ધ ટેલિપેથિક કેટલ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਚਾਹ ਬਾਰੇ ਸੋਚੋ, ਅਤੇ ਇਹ ਪਹਿਲਾਂ ਹੀ ਉਬਲ ਰਹੀ ਹੈ। ਤੁਹਾਡਾ ਮਨ, ਤੁਹਾਡੀ ਕੇਤਲੀ। ਦ ਟੈਲੀਪੈਥਿਕ ਕੇਟਲ।',
    },
  },

  /* Home & Sleep */
  {
    id: 'snooze_blanket',
    name: 'Snooze Blanket',
    tagline: 'Instant sleep. Zero resistance.',
    description:
      'An ultra-soft smart-weave weighted blanket emitting relaxing sub-bass frequencies and warm sleep-inducing micro-currents.',
    visualDescription:
      'wrapped snugly under the Snooze Blanket, an ultra-soft deep navy weighted blanket with glowing micro-weave fibers radiating warm, relaxing light pulses',
    emoji: '🛏️',
    category: 'home',
    posture: 'relaxed',
    dialogue: {
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
  },
  {
    id: 'zero_g_hammock',
    name: 'Zero-G Hammock',
    tagline: 'Float. Forget the floor.',
    description:
      'A magnetic-levitation hammock with no ropes or stands that floats you gently at any height and rocks in sync with your breathing.',
    visualDescription:
      'floating weightlessly in the Zero-G Hammock, a sleek levitating white hammock hovering a metre above a sunlit balcony with a soft blue anti-gravity glow beneath it',
    emoji: '🪐',
    category: 'home',
    posture: 'relaxed',
    dialogue: {
      en: "Hi, I'm [Character_Name]. No ropes. No floor. Just you, floating. The Zero-G Hammock.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। न रस्सी, न फर्श। बस आप, हवा में तैरते हुए। द ज़ीरो-जी हैमॉक।',
      ta: 'வணக்கம், நான் [Character_Name]. கயிறு இல்லை. தரை இல்லை. நீங்கள் மட்டும், மிதந்தபடி. தி ஜீரோ-ஜி ஹேமக்.',
      te: 'నమస్తే, నేను [Character_Name]. తాళ్లు లేవు. నేల లేదు. కేవలం మీరు, గాలిలో తేలుతూ. ది జీరో-జి హ్యామక్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಹಗ್ಗವಿಲ್ಲ. ನೆಲವಿಲ್ಲ. ಕೇವಲ ನೀವು, ತೇಲುತ್ತಾ. ದಿ ಜೀರೋ-ಜಿ ಹ್ಯಾಮಕ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. കയറില്ല. തറയില്ല. നിങ്ങൾ മാത്രം, ഒഴുകി നടക്കുന്നു. ദി സീറോ-ജി ഹാമക്ക്.',
      bn: 'নমস্কার, আমি [Character_Name]। কোনো দড়ি নেই। কোনো মেঝে নেই। শুধু আপনি, ভাসছেন। দ্য জিরো-জি হ্যামক।',
      mr: 'नमस्कार, मी [Character_Name]. दोरी नाही. जमीन नाही. फक्त तुम्ही, तरंगत. द झिरो-जी हॅमॉक.',
      gu: 'નમસ્તે, હું [Character_Name] છું. કોઈ દોરડું નહીં. કોઈ ફર્શ નહીં. બસ તમે, હવામાં તરતા. ધ ઝીરો-જી હેમોક.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਨਾ ਰੱਸੀ, ਨਾ ਫਰਸ਼। ਬਸ ਤੁਸੀਂ, ਹਵਾ ਵਿੱਚ ਤੈਰਦੇ ਹੋਏ। ਦ ਜ਼ੀਰੋ-ਜੀ ਹੈਮੌਕ।',
    },
  },
  {
    id: 'sunrise_curtains',
    name: 'Sunrise Curtains',
    tagline: 'Wake up to your own dawn.',
    description:
      'Smart curtains that paint a slow, personalised sunrise across your bedroom wall so you wake gently at exactly the right moment.',
    visualDescription:
      'stretching contentedly in bed as the Sunrise Curtains, floor-length smart fabric panels, glow with a slow amber-to-gold dawn gradient across a calm bedroom',
    emoji: '🌅',
    category: 'home',
    posture: 'relaxed',
    dialogue: {
      en: "Hi, I'm [Character_Name]. No alarms. Just your own private dawn. Wake up beautifully. The Sunrise Curtains.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। कोई अलार्म नहीं। बस आपकी अपनी निजी सुबह। खूबसूरती से जागिए। द सनराइज़ कर्टेन्स।',
      ta: 'வணக்கம், நான் [Character_Name]. அலாரம் இல்லை. உங்களுக்கே சொந்தமான விடியல். அழகாக விழித்தெழுங்கள். தி சன்ரைஸ் கர்டன்ஸ்.',
      te: 'నమస్తే, నేను [Character_Name]. అలారం లేదు. కేవలం మీ సొంత ఉదయం. అందంగా మేల్కొనండి. ది సన్‌రైజ్ కర్టెన్స్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಅಲಾರಂ ಇಲ್ಲ. ನಿಮ್ಮದೇ ಆದ ಖಾಸಗಿ ಮುಂಜಾನೆ. ಸುಂದರವಾಗಿ ಎಚ್ಚರಗೊಳ್ಳಿ. ದಿ ಸನ್‌ರೈಸ್ ಕರ್ಟನ್ಸ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. അലാറമില്ല. നിങ്ങളുടെ സ്വന്തം പ്രഭാതം മാത്രം. മനോഹരമായി ഉണരൂ. ദി സൺറൈസ് കർട്ടൻസ്.',
      bn: 'নমস্কার, আমি [Character_Name]। কোনো অ্যালার্ম নেই। শুধু আপনার নিজের ভোর। সুন্দরভাবে জেগে উঠুন। দ্য সানরাইজ কার্টেনস।',
      mr: 'नमस्कार, मी [Character_Name]. गजर नाही. फक्त तुमची स्वतःची पहाट. सुंदरपणे जागे व्हा. द सनराइज कर्टन्स.',
      gu: 'નમસ્તે, હું [Character_Name] છું. કોઈ એલાર્મ નહીં. બસ તમારી પોતાની સવાર. સુંદર રીતે જાગો. ધ સનરાઇઝ કર્ટન્સ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਕੋਈ ਅਲਾਰਮ ਨਹੀਂ। ਬਸ ਤੁਹਾਡੀ ਆਪਣੀ ਸਵੇਰ। ਸੋਹਣੇ ਢੰਗ ਨਾਲ ਜਾਗੋ। ਦ ਸਨਰਾਈਜ਼ ਕਰਟਨਜ਼।',
    },
  },
  {
    id: 'power_nap_pod',
    name: 'Power Nap Pod',
    tagline: 'Twenty minutes. Fully recharged.',
    description:
      'A compact reclining pod that dims the world, plays a personal soundscape and wakes you feeling like you slept all night.',
    visualDescription:
      'reclining serenely inside the Power Nap Pod, a sleek egg-shaped white pod with a soft teal interior glow and its translucent lid half closed in a quiet office corner',
    emoji: '🛌',
    category: 'home',
    posture: 'relaxed',
    dialogue: {
      en: "Hi, I'm [Character_Name]. Twenty minutes in. A whole night out. Recharge anywhere. The Power Nap Pod.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। बीस मिनट अंदर। पूरी रात की नींद बाहर। कहीं भी रिचार्ज करें। द पावर नैप पॉड।',
      ta: 'வணக்கம், நான் [Character_Name]. இருபது நிமிடம் உள்ளே. ஒரு முழு இரவின் ஓய்வு. எங்கும் ரீசார்ஜ் செய்யுங்கள். தி பவர் நேப் பாட்.',
      te: 'నమస్తే, నేను [Character_Name]. ఇరవై నిమిషాలు లోపల. పూర్తి రాత్రి విశ్రాంతి. ఎక్కడైనా రీఛార్జ్ అవ్వండి. ది పవర్ నాప్ పాడ్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಇಪ್ಪತ್ತು ನಿಮಿಷ ಒಳಗೆ. ಇಡೀ ರಾತ್ರಿಯ ವಿಶ್ರಾಂತಿ. ಎಲ್ಲಿ ಬೇಕಾದರೂ ರೀಚಾರ್ಜ್ ಆಗಿ. ದಿ ಪವರ್ ನ್ಯಾಪ್ ಪಾಡ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഇരുപത് മിനിറ്റ് അകത്ത്. ഒരു രാത്രി മുഴുവൻ ഉറങ്ങിയ ഉന്മേഷം. എവിടെയും റീചാർജ് ചെയ്യൂ. ദി പവർ നാപ്പ് പോഡ്.',
      bn: 'নমস্কার, আমি [Character_Name]। বিশ মিনিট ভিতরে। সারা রাতের বিশ্রাম। যেকোনো জায়গায় রিচার্জ করুন। দ্য পাওয়ার ন্যাপ পড।',
      mr: 'नमस्कार, मी [Character_Name]. वीस मिनिटं आत. संपूर्ण रात्रीची विश्रांती. कुठेही रिचार्ज व्हा. द पॉवर नॅप पॉड.',
      gu: 'નમસ્તે, હું [Character_Name] છું. વીસ મિનિટ અંદર. આખી રાતનો આરામ. ગમે ત્યાં રિચાર્જ થાઓ. ધ પાવર નેપ પોડ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਵੀਹ ਮਿੰਟ ਅੰਦਰ। ਪੂਰੀ ਰਾਤ ਦਾ ਆਰਾਮ। ਕਿਤੇ ਵੀ ਰੀਚਾਰਜ ਹੋਵੋ। ਦ ਪਾਵਰ ਨੈਪ ਪੌਡ।',
    },
  },

  /* Wearables */
  {
    id: 'flying_sneakers',
    name: 'AeroSneaks',
    tagline: 'Defy gravity. Walk on air.',
    description:
      'Premium street sneakers equipped with mini ion-thrusters in the soles, allowing short bursts of controlled levitation.',
    visualDescription:
      'hovering a foot above the ground wearing the AeroSneaks, premium high-top sneakers featuring glowing blue ion thruster ports in the soles',
    emoji: '👟',
    category: 'wearables',
    posture: 'active',
    dialogue: {
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
  },
  {
    id: 'babel_earrings',
    name: 'Babel Earrings',
    tagline: 'Every language. Zero effort.',
    description:
      "Elegant earrings with a built-in neural translator that whisper any language into your ear in real time, in the speaker's own voice.",
    visualDescription:
      'leaning in to listen at a bustling market while wearing the Babel Earrings, elegant teardrop earrings glowing with a faint cyan pulse as they translate the conversation in real time',
    emoji: '💎',
    category: 'wearables',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. Every language, whispered to you. Speak to the whole world. The Babel Earrings.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। हर भाषा, आपके कान में। पूरी दुनिया से बात कीजिए। द बेबल इयररिंग्स।',
      ta: 'வணக்கம், நான் [Character_Name]. ஒவ்வொரு மொழியும், உங்கள் காதில். உலகம் முழுவதுடன் பேசுங்கள். தி பேபல் இயர்ரிங்ஸ்.',
      te: 'నమస్తే, నేను [Character_Name]. ప్రతి భాష, మీ చెవిలో. ప్రపంచం మొత్తంతో మాట్లాడండి. ది బాబెల్ ఇయర్‌రింగ్స్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಪ್ರತಿ ಭಾಷೆ, ನಿಮ್ಮ ಕಿವಿಯಲ್ಲಿ. ಇಡೀ ಜಗತ್ತಿನೊಂದಿಗೆ ಮಾತನಾಡಿ. ದಿ ಬಾಬೆಲ್ ಇಯರ್‌ರಿಂಗ್ಸ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. എല്ലാ ഭാഷയും, നിങ്ങളുടെ ചെവിയിൽ. ലോകം മുഴുവനോടും സംസാരിക്കൂ. ദി ബാബേൽ ഇയർറിംഗ്സ്.',
      bn: 'নমস্কার, আমি [Character_Name]। প্রতিটি ভাষা, আপনার কানে। সারা বিশ্বের সাথে কথা বলুন। দ্য ব্যাবেল ইয়াররিংস।',
      mr: 'नमस्कार, मी [Character_Name]. प्रत्येक भाषा, तुमच्या कानात. संपूर्ण जगाशी बोला. द बॅबल इअररिंग्ज.',
      gu: 'નમસ્તે, હું [Character_Name] છું. દરેક ભાષા, તમારા કાનમાં. આખી દુનિયા સાથે વાત કરો. ધ બેબલ ઇયરરિંગ્સ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਹਰ ਭਾਸ਼ਾ, ਤੁਹਾਡੇ ਕੰਨ ਵਿੱਚ। ਪੂਰੀ ਦੁਨੀਆ ਨਾਲ ਗੱਲ ਕਰੋ। ਦ ਬੇਬਲ ਈਅਰਰਿੰਗਜ਼।',
    },
  },
  {
    id: 'climate_jacket',
    name: 'Climate Jacket',
    tagline: 'Your weather. Your rules.',
    description:
      'A lightweight jacket with a personal micro-climate that keeps you at a perfect 22 degrees, whether it is a Delhi summer or a Shimla winter.',
    visualDescription:
      'striding confidently through a heatwave in the Climate Jacket, a sleek matte-graphite jacket with thin glowing cooling channels along the seams and a faint shimmer of cool air around the collar',
    emoji: '🧥',
    category: 'wearables',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. Delhi summer or Shimla winter, I'm always twenty-two degrees. Your weather, your rules. The Climate Jacket.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। दिल्ली की गर्मी हो या शिमला की सर्दी, मैं हमेशा बाईस डिग्री पर हूँ। आपका मौसम, आपके नियम। द क्लाइमेट जैकेट।',
      ta: 'வணக்கம், நான் [Character_Name]. டெல்லி கோடையோ ஷிம்லா குளிரோ, நான் எப்போதும் இருபத்தி இரண்டு டிகிரி. உங்கள் வானிலை, உங்கள் விதிகள். தி கிளைமேட் ஜாக்கெட்.',
      te: 'నమస్తే, నేను [Character_Name]. ఢిల్లీ ఎండైనా షిమ్లా చలైనా, నేను ఎప్పుడూ ఇరవై రెండు డిగ్రీలు. మీ వాతావరణం, మీ నియమాలు. ది క్లైమేట్ జాకెట్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ದೆಹಲಿಯ ಬೇಸಿಗೆಯಾಗಲಿ ಶಿಮ್ಲಾದ ಚಳಿಯಾಗಲಿ, ನಾನು ಯಾವಾಗಲೂ ಇಪ್ಪತ್ತೆರಡು ಡಿಗ್ರಿ. ನಿಮ್ಮ ಹವಾಮಾನ, ನಿಮ್ಮ ನಿಯಮಗಳು. ದಿ ಕ್ಲೈಮೇಟ್ ಜಾಕೆಟ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഡൽഹി വേനലായാലും ഷിംല തണുപ്പായാലും, ഞാൻ എപ്പോഴും ഇരുപത്തിരണ്ട് ഡിഗ്രി. നിങ്ങളുടെ കാലാവസ്ഥ, നിങ്ങളുടെ നിയമങ്ങൾ. ദി ക്ലൈമറ്റ് ജാക്കറ്റ്.',
      bn: 'নমস্কার, আমি [Character_Name]। দিল্লির গরম হোক বা শিমলার শীত, আমি সবসময় বাইশ ডিগ্রিতে। আপনার আবহাওয়া, আপনার নিয়ম। দ্য ক্লাইমেট জ্যাকেট।',
      mr: 'नमस्कार, मी [Character_Name]. दिल्लीचा उन्हाळा असो वा शिमल्याची थंडी, मी नेहमी बावीस अंशांवर. तुमचं हवामान, तुमचे नियम. द क्लायमेट जॅकेट.',
      gu: 'નમસ્તે, હું [Character_Name] છું. દિલ્હીનો ઉનાળો હોય કે શિમલાનો શિયાળો, હું હંમેશા બાવીસ ડિગ્રી પર. તમારું હવામાન, તમારા નિયમો. ધ ક્લાઇમેટ જેકેટ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਦਿੱਲੀ ਦੀ ਗਰਮੀ ਹੋਵੇ ਜਾਂ ਸ਼ਿਮਲਾ ਦੀ ਸਰਦੀ, ਮੈਂ ਹਮੇਸ਼ਾ ਬਾਈ ਡਿਗਰੀ ਤੇ। ਤੁਹਾਡਾ ਮੌਸਮ, ਤੁਹਾਡੇ ਨਿਯਮ। ਦ ਕਲਾਈਮੇਟ ਜੈਕੇਟ।',
    },
  },
  {
    id: 'recall_glasses',
    name: 'Recall Glasses',
    tagline: 'Never forget a face. Or the keys.',
    description:
      'Stylish smart glasses that quietly remember everything you see and whisper names, places and where you left your keys the moment you need them.',
    visualDescription:
      'greeting a crowd at a rooftop party wearing the Recall Glasses, slim titanium smart glasses with a faint golden holographic name tag floating beside each face they look at',
    emoji: '👓',
    category: 'wearables',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. Every name. Every face. Every lost key, found. Never forget again. The Recall Glasses.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। हर नाम। हर चेहरा। हर खोई हुई चाबी, मिल गई। अब कभी मत भूलिए। द रिकॉल ग्लासेस।',
      ta: 'வணக்கம், நான் [Character_Name]. ஒவ்வொரு பெயரும். ஒவ்வொரு முகமும். தொலைந்த சாவியும், கண்டுபிடிக்கப்பட்டது. இனி மறக்க வேண்டாம். தி ரீகால் கிளாசஸ்.',
      te: 'నమస్తే, నేను [Character_Name]. ప్రతి పేరు. ప్రతి ముఖం. పోయిన ప్రతి తాళం చెవి, దొరికింది. ఇక మర్చిపోవద్దు. ది రీకాల్ గ్లాసెస్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಪ್ರತಿ ಹೆಸರು. ಪ್ರತಿ ಮುಖ. ಕಳೆದುಹೋದ ಪ್ರತಿ ಕೀಲಿಕೈ, ಸಿಕ್ಕಿತು. ಇನ್ನು ಮರೆಯಬೇಡಿ. ದಿ ರೀಕಾಲ್ ಗ್ಲಾಸಸ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഓരോ പേരും. ഓരോ മുഖവും. നഷ്ടപ്പെട്ട ഓരോ താക്കോലും, കണ്ടെത്തി. ഇനി ഒരിക്കലും മറക്കേണ്ട. ദി റീകോൾ ഗ്ലാസസ്.',
      bn: 'নমস্কার, আমি [Character_Name]। প্রতিটি নাম। প্রতিটি মুখ। প্রতিটি হারানো চাবি, পাওয়া গেছে। আর কখনো ভুলবেন না। দ্য রিকল গ্লাসেস।',
      mr: 'नमस्कार, मी [Character_Name]. प्रत्येक नाव. प्रत्येक चेहरा. हरवलेली प्रत्येक किल्ली, सापडली. पुन्हा कधीही विसरू नका. द रिकॉल ग्लासेस.',
      gu: 'નમસ્તે, હું [Character_Name] છું. દરેક નામ. દરેક ચહેરો. દરેક ખોવાયેલી ચાવી, મળી ગઈ. ફરી ક્યારેય ન ભૂલો. ધ રિકોલ ગ્લાસિસ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਹਰ ਨਾਮ। ਹਰ ਚਿਹਰਾ। ਹਰ ਗੁਆਚੀ ਚਾਬੀ, ਲੱਭ ਗਈ। ਹੁਣ ਕਦੇ ਨਾ ਭੁੱਲੋ। ਦ ਰੀਕਾਲ ਗਲਾਸਿਜ਼।',
    },
  },

  /* Mobility */
  {
    id: 'flying_suv',
    name: 'AeroCruiser SUV',
    tagline: 'No roads. No limits. Pure elevation.',
    description:
      'An electric family SUV with retractable wings and clean-fusion jet engines, designed for high-altitude luxury cruising.',
    visualDescription:
      'standing beside the AeroCruiser SUV as its sleek carbon-fiber wings slowly unfold and its blue fusion jet engines glow intensely, preparing for takeoff on an elevated sky terrace',
    emoji: '🚙',
    category: 'mobility',
    posture: 'vehicle',
    dialogue: {
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
  },
  {
    id: 'sky_rickshaw',
    name: 'SkyRick',
    tagline: 'Skip the traffic. Literally.',
    description:
      'The classic auto-rickshaw reborn as a three-seat electric hover taxi that lifts straight over the jam and lands at your doorstep.',
    visualDescription:
      'stepping out of the SkyRick, a gleaming green-and-yellow hover auto-rickshaw hovering a few feet above a crowded street with soft blue thrusters humming under its chassis',
    emoji: '🛺',
    category: 'mobility',
    posture: 'vehicle',
    dialogue: {
      en: "Hi, I'm [Character_Name]. The traffic is down there. I'm up here. Skip the jam, literally. The SkyRick.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। ट्रैफिक वहाँ नीचे है। मैं यहाँ ऊपर हूँ। जाम के ऊपर से निकल जाइए। द स्काईरिक।',
      ta: 'வணக்கம், நான் [Character_Name]. போக்குவரத்து அங்கே கீழே. நான் இங்கே மேலே. நெரிசலைத் தாண்டிப் பறங்கள். தி ஸ்கைரிக்.',
      te: 'నమస్తే, నేను [Character_Name]. ట్రాఫిక్ అక్కడ కింద. నేను ఇక్కడ పైన. జామ్‌ను దాటి ఎగరండి. ది స్కైరిక్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಟ್ರಾಫಿಕ್ ಅಲ್ಲಿ ಕೆಳಗೆ. ನಾನು ಇಲ್ಲಿ ಮೇಲೆ. ಜಾಮ್ ಮೇಲಿಂದ ಹಾರಿ ಹೋಗಿ. ದಿ ಸ್ಕೈರಿಕ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ട്രാഫിക് അവിടെ താഴെ. ഞാൻ ഇവിടെ മുകളിൽ. ബ്ലോക്കിന് മുകളിലൂടെ പറക്കൂ. ദി സ്കൈറിക്ക്.',
      bn: 'নমস্কার, আমি [Character_Name]। ট্রাফিক ওই নিচে। আমি এই উপরে। জ্যামের উপর দিয়ে উড়ে যান। দ্য স্কাইরিক।',
      mr: 'नमस्कार, मी [Character_Name]. ट्रॅफिक तिथे खाली आहे. मी इथे वर आहे. जॅमवरून थेट उडून जा. द स्कायरिक.',
      gu: 'નમસ્તે, હું [Character_Name] છું. ટ્રાફિક ત્યાં નીચે છે. હું અહીં ઉપર છું. જામ પરથી સીધા ઉડી જાઓ. ધ સ્કાયરિક.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਟ੍ਰੈਫਿਕ ਉੱਥੇ ਹੇਠਾਂ ਹੈ। ਮੈਂ ਇੱਥੇ ਉੱਪਰ ਹਾਂ। ਜਾਮ ਦੇ ਉੱਪਰੋਂ ਉੱਡ ਜਾਓ। ਦ ਸਕਾਈਰਿਕ।',
    },
  },
  {
    id: 'pocket_cycle',
    name: 'PocketCycle',
    tagline: 'A bicycle in your bag.',
    description:
      'A full-size electric bicycle made of shape-memory alloy that folds into a slim briefcase in three seconds and unfolds with a tap.',
    visualDescription:
      'standing beside the PocketCycle as it unfolds itself from a slim silver briefcase into a full-size electric bicycle with glowing white spokes on a busy metro platform',
    emoji: '🚲',
    category: 'mobility',
    posture: 'vehicle',
    dialogue: {
      en: "Hi, I'm [Character_Name]. A full bicycle, in my bag. Tap, unfold, ride. The PocketCycle.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। पूरी साइकिल, मेरे बैग में। टैप कीजिए, खोलिए, चलिए। द पॉकेटसाइकिल।',
      ta: 'வணக்கம், நான் [Character_Name]. ஒரு முழு சைக்கிள், என் பையில். தட்டுங்கள், விரியுங்கள், ஓட்டுங்கள். தி பாக்கெட்சைக்கிள்.',
      te: 'నమస్తే, నేను [Character_Name]. పూర్తి సైకిల్, నా బ్యాగ్‌లో. ట్యాప్ చేయండి, విప్పండి, తొక్కండి. ది పాకెట్‌సైకిల్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಪೂರ್ಣ ಸೈಕಲ್, ನನ್ನ ಬ್ಯಾಗ್‌ನಲ್ಲಿ. ಟ್ಯಾಪ್ ಮಾಡಿ, ಬಿಡಿಸಿ, ಓಡಿಸಿ. ದಿ ಪಾಕೆಟ್‌ಸೈಕಲ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഒരു മുഴുവൻ സൈക്കിൾ, എന്റെ ബാഗിൽ. ടാപ്പ് ചെയ്യൂ, നിവർത്തൂ, ഓടിക്കൂ. ദി പോക്കറ്റ്സൈക്കിൾ.',
      bn: 'নমস্কার, আমি [Character_Name]। একটা পুরো সাইকেল, আমার ব্যাগে। ট্যাপ করুন, খুলুন, চালান। দ্য পকেটসাইকেল।',
      mr: 'नमस्कार, मी [Character_Name]. पूर्ण सायकल, माझ्या बॅगेत. टॅप करा, उघडा, चालवा. द पॉकेटसायकल.',
      gu: 'નમસ્તે, હું [Character_Name] છું. આખી સાયકલ, મારી બેગમાં. ટેપ કરો, ખોલો, ચલાવો. ધ પોકેટસાયકલ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਪੂਰੀ ਸਾਈਕਲ, ਮੇਰੇ ਬੈਗ ਵਿੱਚ। ਟੈਪ ਕਰੋ, ਖੋਲ੍ਹੋ, ਚਲਾਓ। ਦ ਪਾਕੇਟਸਾਈਕਲ।',
    },
  },
  {
    id: 'glide_board',
    name: 'GlideBoard',
    tagline: 'The ground is optional.',
    description:
      "A personal hover scooter that glides a hand's width above any surface, from cobbled lanes to monsoon puddles, with zero wheels and zero noise.",
    visualDescription:
      "gliding silently down a rain-slicked lane on the GlideBoard, a sleek matte-black hover scooter floating a hand's width above the ground on a shimmering cushion of blue light",
    emoji: '🛹',
    category: 'mobility',
    posture: 'vehicle',
    dialogue: {
      en: "Hi, I'm [Character_Name]. No wheels. No noise. No ground required. The GlideBoard.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। न पहिए, न शोर। ज़मीन की भी ज़रूरत नहीं। द ग्लाइडबोर्ड।',
      ta: 'வணக்கம், நான் [Character_Name]. சக்கரம் இல்லை. சத்தம் இல்லை. தரையே தேவையில்லை. தி கிளைட்போர்டு.',
      te: 'నమస్తే, నేను [Character_Name]. చక్రాలు లేవు. శబ్దం లేదు. నేల కూడా అవసరం లేదు. ది గ్లైడ్‌బోర్డ్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಚಕ್ರವಿಲ್ಲ. ಶಬ್ದವಿಲ್ಲ. ನೆಲವೂ ಬೇಕಿಲ್ಲ. ದಿ ಗ್ಲೈಡ್‌ಬೋರ್ಡ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ചക്രങ്ങളില്ല. ശബ്ദമില്ല. നിലം പോലും വേണ്ട. ദി ഗ്ലൈഡ്ബോർഡ്.',
      bn: 'নমস্কার, আমি [Character_Name]। কোনো চাকা নেই। কোনো শব্দ নেই। মাটিরও দরকার নেই। দ্য গ্লাইডবোর্ড।',
      mr: 'नमस्कार, मी [Character_Name]. चाकं नाहीत. आवाज नाही. जमिनीचीही गरज नाही. द ग्लाइडबोर्ड.',
      gu: 'નમસ્તે, હું [Character_Name] છું. કોઈ પૈડાં નહીં. કોઈ અવાજ નહીં. જમીનની પણ જરૂર નહીં. ધ ગ્લાઇડબોર્ડ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਨਾ ਪਹੀਏ, ਨਾ ਸ਼ੋਰ। ਜ਼ਮੀਨ ਦੀ ਵੀ ਲੋੜ ਨਹੀਂ। ਦ ਗਲਾਈਡਬੋਰਡ।',
    },
  },

  /* Wellness */
  {
    id: 'zen_bottle',
    name: 'Zen Bottle',
    tagline: 'Sip. Breathe. Reset.',
    description:
      'A water bottle that senses your stress from your grip and hums a calming tone tuned to your heartbeat as you drink.',
    visualDescription:
      'sitting cross-legged on a quiet terrace at dawn holding the Zen Bottle, a frosted-glass smart bottle glowing with a slow, calming lavender pulse in time with their breathing',
    emoji: '🧘',
    category: 'wellness',
    posture: 'relaxed',
    dialogue: {
      en: "Hi, I'm [Character_Name]. Sip. Breathe. Reset. Calm, one drink at a time. The Zen Bottle.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। घूँट लीजिए। सांस लीजिए। रीसेट कीजिए। हर घूँट के साथ शांति। द ज़ेन बॉटल।',
      ta: 'வணக்கம், நான் [Character_Name]. பருகுங்கள். மூச்சு விடுங்கள். புதுப்பியுங்கள். ஒவ்வொரு மிடறிலும் அமைதி. தி ஜென் பாட்டில்.',
      te: 'నమస్తే, నేను [Character_Name]. తాగండి. శ్వాస తీసుకోండి. రీసెట్ అవ్వండి. ప్రతి గుటకతో ప్రశాంతత. ది జెన్ బాటిల్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಗುಟುಕು ಕುಡಿಯಿರಿ. ಉಸಿರಾಡಿ. ರೀಸೆಟ್ ಆಗಿ. ಪ್ರತಿ ಗುಟುಕಿನಲ್ಲೂ ಶಾಂತಿ. ದಿ ಜೆನ್ ಬಾಟಲ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. കുടിക്കൂ. ശ്വസിക്കൂ. റീസെറ്റ് ചെയ്യൂ. ഓരോ ഇറക്കിലും ശാന്തി. ദി സെൻ ബോട്ടിൽ.',
      bn: 'নমস্কার, আমি [Character_Name]। চুমুক দিন। শ্বাস নিন। রিসেট করুন। প্রতিটি চুমুকে শান্তি। দ্য জেন বটল।',
      mr: 'नमस्कार, मी [Character_Name]. घोट घ्या. श्वास घ्या. रीसेट करा. प्रत्येक घोटात शांतता. द झेन बॉटल.',
      gu: 'નમસ્તે, હું [Character_Name] છું. ઘૂંટ લો. શ્વાસ લો. રિસેટ કરો. દરેક ઘૂંટ સાથે શાંતિ. ધ ઝેન બોટલ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਘੁੱਟ ਭਰੋ। ਸਾਹ ਲਓ। ਰੀਸੈੱਟ ਕਰੋ। ਹਰ ਘੁੱਟ ਨਾਲ ਸ਼ਾਂਤੀ। ਦ ਜ਼ੈਨ ਬੋਟਲ।',
    },
  },
  {
    id: 'honest_mirror',
    name: 'Honest Mirror',
    tagline: 'The truth, beautifully delivered.',
    description:
      'A smart mirror that tracks your posture, sleep and hydration and tells you, politely but firmly, exactly what to fix today.',
    visualDescription:
      'standing tall in front of the Honest Mirror, a slim full-length smart mirror with glowing white posture guide lines and a friendly green health score floating beside their reflection',
    emoji: '🪞',
    category: 'wellness',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. It sees everything. It says it kindly. Fix today, shine tomorrow. The Honest Mirror.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। यह सब देखता है। प्यार से कहता है। आज सुधारिए, कल चमकिए। द ऑनेस्ट मिरर।',
      ta: 'வணக்கம், நான் [Character_Name]. இது எல்லாவற்றையும் பார்க்கிறது. அன்பாகச் சொல்கிறது. இன்று சரிசெய்யுங்கள், நாளை ஜொலியுங்கள். தி ஹானஸ்ட் மிரர்.',
      te: 'నమస్తే, నేను [Character_Name]. ఇది అన్నీ చూస్తుంది. ప్రేమగా చెబుతుంది. ఈరోజు సరిచేయండి, రేపు మెరవండి. ది హానెస్ట్ మిర్రర్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಇದು ಎಲ್ಲವನ್ನೂ ನೋಡುತ್ತದೆ. ಪ್ರೀತಿಯಿಂದ ಹೇಳುತ್ತದೆ. ಇಂದು ಸರಿಪಡಿಸಿ, ನಾಳೆ ಹೊಳೆಯಿರಿ. ದಿ ಆನೆಸ್ಟ್ ಮಿರರ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഇത് എല്ലാം കാണുന്നു. സ്നേഹത്തോടെ പറയുന്നു. ഇന്ന് ശരിയാക്കൂ, നാളെ തിളങ്ങൂ. ദി ഓണസ്റ്റ് മിറർ.',
      bn: 'নমস্কার, আমি [Character_Name]। এটি সব দেখে। ভালোবেসে বলে। আজ ঠিক করুন, কাল ঝলমল করুন। দ্য অনেস্ট মিরর।',
      mr: 'नमस्कार, मी [Character_Name]. हा सगळं पाहतो. प्रेमाने सांगतो. आज सुधारा, उद्या चमका. द ऑनेस्ट मिरर.',
      gu: 'નમસ્તે, હું [Character_Name] છું. તે બધું જુએ છે. પ્રેમથી કહે છે. આજે સુધારો, કાલે ચમકો. ધ ઓનેસ્ટ મિરર.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਇਹ ਸਭ ਕੁਝ ਵੇਖਦਾ ਹੈ। ਪਿਆਰ ਨਾਲ ਕਹਿੰਦਾ ਹੈ। ਅੱਜ ਸੁਧਾਰੋ, ਕੱਲ੍ਹ ਚਮਕੋ। ਦ ਆਨੈਸਟ ਮਿਰਰ।',
    },
  },
  {
    id: 'hydration_halo',
    name: 'Hydration Halo',
    tagline: 'Never thirsty. Never nagged.',
    description:
      'A slim headband that mists a cool, mineral-rich cloud around you whenever your body needs water, so you stay hydrated without thinking.',
    visualDescription:
      'jogging along a sunlit promenade wearing the Hydration Halo, a slim silver headband releasing a fine sparkling cloud of cool mist that shimmers around their head',
    emoji: '💧',
    category: 'wellness',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. My body asks. The Halo answers. Hydration, without thinking. The Hydration Halo.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। मेरा शरीर मांगता है। हेलो जवाब देता है। बिना सोचे हाइड्रेशन। द हाइड्रेशन हेलो।',
      ta: 'வணக்கம், நான் [Character_Name]. என் உடல் கேட்கிறது. ஹேலோ பதிலளிக்கிறது. யோசிக்காமலே நீர்ச்சத்து. தி ஹைட்ரேஷன் ஹேலோ.',
      te: 'నమస్తే, నేను [Character_Name]. నా శరీరం అడుగుతుంది. హాలో సమాధానం ఇస్తుంది. ఆలోచించకుండానే హైడ్రేషన్. ది హైడ్రేషన్ హాలో.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ನನ್ನ ದೇಹ ಕೇಳುತ್ತದೆ. ಹೇಲೋ ಉತ್ತರಿಸುತ್ತದೆ. ಯೋಚಿಸದೆಯೇ ಹೈಡ್ರೇಶನ್. ದಿ ಹೈಡ್ರೇಶನ್ ಹೇಲೋ.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. എന്റെ ശരീരം ചോദിക്കുന്നു. ഹാലോ ഉത്തരം നൽകുന്നു. ചിന്തിക്കാതെ തന്നെ ഹൈഡ്രേഷൻ. ദി ഹൈഡ്രേഷൻ ഹാലോ.',
      bn: 'নমস্কার, আমি [Character_Name]। আমার শরীর চায়। হ্যালো উত্তর দেয়। না ভেবেই হাইড্রেশন। দ্য হাইড্রেশন হ্যালো।',
      mr: 'नमस्कार, मी [Character_Name]. माझं शरीर मागतं. हेलो उत्तर देतो. विचार न करता हायड्रेशन. द हायड्रेशन हेलो.',
      gu: 'નમસ્તે, હું [Character_Name] છું. મારું શરીર માંગે છે. હેલો જવાબ આપે છે. વિચાર્યા વગર હાઇડ્રેશન. ધ હાઇડ્રેશન હેલો.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਮੇਰਾ ਸਰੀਰ ਮੰਗਦਾ ਹੈ। ਹੇਲੋ ਜਵਾਬ ਦਿੰਦਾ ਹੈ। ਬਿਨਾਂ ਸੋਚੇ ਹਾਈਡ੍ਰੇਸ਼ਨ। ਦ ਹਾਈਡ੍ਰੇਸ਼ਨ ਹੇਲੋ।',
    },
  },
  {
    id: 'mood_lamp',
    name: 'Mood Lamp',
    tagline: 'Light that listens.',
    description:
      "A floating lamp that reads the room's mood from voices and heartbeats and shifts its colour and warmth to calm, energise or celebrate.",
    visualDescription:
      'unwinding on a low sofa beside the Mood Lamp, a levitating brass orb lamp drifting gently in the air and glowing a warm, soothing amber that slowly deepens to rose',
    emoji: '🪔',
    category: 'wellness',
    posture: 'relaxed',
    dialogue: {
      en: "Hi, I'm [Character_Name]. It listens to the room. Then it lights it just right. The Mood Lamp.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। यह कमरे को सुनता है। फिर उसे बिल्कुल सही रोशनी देता है। द मूड लैंप।',
      ta: 'வணக்கம், நான் [Character_Name]. இது அறையைக் கேட்கிறது. பிறகு சரியான வெளிச்சம் தருகிறது. தி மூட் லேம்ப்.',
      te: 'నమస్తే, నేను [Character_Name]. ఇది గదిని వింటుంది. తర్వాత సరిగ్గా వెలిగిస్తుంది. ది మూడ్ ల్యాంప్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಇದು ಕೋಣೆಯನ್ನು ಕೇಳುತ್ತದೆ. ನಂತರ ಸರಿಯಾದ ಬೆಳಕು ನೀಡುತ್ತದೆ. ದಿ ಮೂಡ್ ಲ್ಯಾಂಪ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഇത് മുറിയെ കേൾക്കുന്നു. പിന്നെ കൃത്യമായ വെളിച്ചം നൽകുന്നു. ദി മൂഡ് ലാമ്പ്.',
      bn: 'নমস্কার, আমি [Character_Name]। এটি ঘরের কথা শোনে। তারপর ঠিক সেভাবেই আলো দেয়। দ্য মুড ল্যাম্প।',
      mr: 'नमस्कार, मी [Character_Name]. हा खोलीचं ऐकतो. मग अगदी योग्य प्रकाश देतो. द मूड लॅम्प.',
      gu: 'નમસ્તે, હું [Character_Name] છું. તે રૂમને સાંભળે છે. પછી બિલકુલ યોગ્ય પ્રકાશ આપે છે. ધ મૂડ લેમ્પ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਇਹ ਕਮਰੇ ਨੂੰ ਸੁਣਦਾ ਹੈ। ਫਿਰ ਬਿਲਕੁਲ ਸਹੀ ਰੌਸ਼ਨੀ ਦਿੰਦਾ ਹੈ। ਦ ਮੂਡ ਲੈਂਪ।',
    },
  },

  /* Gadgets */
  {
    id: 'umbrella_drone',
    name: 'Umbrella Drone',
    tagline: 'Rain happens. Not to you.',
    description:
      'A personal drone that hovers above your head with a wide invisible shield, following you through any monsoon with both hands free.',
    visualDescription:
      'walking hands-free through a heavy monsoon downpour beneath the Umbrella Drone, a compact white quadcopter hovering overhead and projecting a shimmering transparent shield that scatters the rain',
    emoji: '☂️',
    category: 'gadgets',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. Rain everywhere. Not a drop on me. Hands free, always dry. The Umbrella Drone.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। हर तरफ बारिश। मुझ पर एक बूँद भी नहीं। हाथ खाली, हमेशा सूखे। द अम्ब्रेला ड्रोन।',
      ta: 'வணக்கம், நான் [Character_Name]. எங்கும் மழை. என் மீது ஒரு துளி கூட இல்லை. கைகள் சுதந்திரம், எப்போதும் உலர்வு. தி அம்ப்ரெல்லா ட்ரோன்.',
      te: 'నమస్తే, నేను [Character_Name]. అంతటా వర్షం. నాపై ఒక్క చుక్క కూడా లేదు. చేతులు ఖాళీ, ఎప్పుడూ పొడిగా. ది అంబ్రెల్లా డ్రోన్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಎಲ್ಲೆಡೆ ಮಳೆ. ನನ್ನ ಮೇಲೆ ಒಂದು ಹನಿಯೂ ಇಲ್ಲ. ಕೈಗಳು ಖಾಲಿ, ಯಾವಾಗಲೂ ಒಣ. ದಿ ಅಂಬ್ರೆಲಾ ಡ್ರೋನ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. എല്ലായിടത്തും മഴ. എന്റെ മേൽ ഒരു തുള്ളി പോലുമില്ല. കൈകൾ സ്വതന്ത്രം, എപ്പോഴും ഉണങ്ങിയത്. ദി അംബ്രല്ല ഡ്രോൺ.',
      bn: 'নমস্কার, আমি [Character_Name]। চারদিকে বৃষ্টি। আমার গায়ে এক ফোঁটাও নেই। হাত খালি, সবসময় শুকনো। দ্য আমব্রেলা ড্রোন।',
      mr: 'नमस्कार, मी [Character_Name]. सगळीकडे पाऊस. माझ्यावर एक थेंबही नाही. हात मोकळे, नेहमी कोरडे. द अम्ब्रेला ड्रोन.',
      gu: 'નમસ્તે, હું [Character_Name] છું. બધે વરસાદ. મારા પર એક ટીપું પણ નહીં. હાથ ખાલી, હંમેશા સૂકા. ધ અમ્બ્રેલા ડ્રોન.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਹਰ ਪਾਸੇ ਮੀਂਹ। ਮੇਰੇ ਉੱਤੇ ਇੱਕ ਬੂੰਦ ਵੀ ਨਹੀਂ। ਹੱਥ ਖਾਲੀ, ਹਮੇਸ਼ਾ ਸੁੱਕੇ। ਦ ਅੰਬਰੈਲਾ ਡਰੋਨ।',
    },
  },
  {
    id: 'smart_tiffin',
    name: 'Smart Tiffin',
    tagline: 'Hot at noon. Every single day.',
    description:
      'A classic steel tiffin with a built-in micro-oven and freshness sensor that warms each layer to the perfect temperature exactly when you open it.',
    visualDescription:
      'opening the Smart Tiffin at a sunny office desk, a gleaming stainless-steel stacked tiffin with a thin glowing orange ring on each tier as fragrant steam rises from the freshly warmed food',
    emoji: '🍱',
    category: 'gadgets',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. Packed at dawn. Piping hot at noon. Ghar ka khana, anywhere. The Smart Tiffin.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। सुबह पैक किया। दोपहर में गरमागरम। घर का खाना, कहीं भी। द स्मार्ट टिफिन।',
      ta: 'வணக்கம், நான் [Character_Name]. காலையில் அடைத்தது. மதியம் சூடாக. வீட்டு உணவு, எங்கும். தி ஸ்மார்ட் டிஃபின்.',
      te: 'నమస్తే, నేను [Character_Name]. ఉదయం ప్యాక్ చేశాను. మధ్యాహ్నం వేడివేడిగా. ఇంటి భోజనం, ఎక్కడైనా. ది స్మార్ట్ టిఫిన్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಬೆಳಿಗ್ಗೆ ಪ್ಯಾಕ್ ಮಾಡಿದ್ದು. ಮಧ್ಯಾಹ್ನ ಬಿಸಿಬಿಸಿ. ಮನೆ ಊಟ, ಎಲ್ಲಿ ಬೇಕಾದರೂ. ದಿ ಸ್ಮಾರ್ಟ್ ಟಿಫಿನ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. രാവിലെ പായ്ക്ക് ചെയ്തത്. ഉച്ചയ്ക്ക് ചൂടോടെ. വീട്ടിലെ ഭക്ഷണം, എവിടെയും. ദി സ്മാർട്ട് ടിഫിൻ.',
      bn: 'নমস্কার, আমি [Character_Name]। ভোরে প্যাক করা। দুপুরে গরম গরম। ঘরের খাবার, যেকোনো জায়গায়। দ্য স্মার্ট টিফিন।',
      mr: 'नमस्कार, मी [Character_Name]. पहाटे भरलेला. दुपारी गरमागरम. घरचं जेवण, कुठेही. द स्मार्ट टिफिन.',
      gu: 'નમસ્તે, હું [Character_Name] છું. સવારે પેક કર્યું. બપોરે ગરમાગરમ. ઘરનું ભોજન, ગમે ત્યાં. ધ સ્માર્ટ ટિફિન.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਸਵੇਰੇ ਪੈਕ ਕੀਤਾ। ਦੁਪਹਿਰ ਨੂੰ ਗਰਮਾ-ਗਰਮ। ਘਰ ਦਾ ਖਾਣਾ, ਕਿਤੇ ਵੀ। ਦ ਸਮਾਰਟ ਟਿਫ਼ਨ।',
    },
  },
  {
    id: 'pocket_cinema',
    name: 'Pocket Cinema',
    tagline: 'A theatre in your palm.',
    description:
      'A coin-sized projector that throws a crisp, wall-sized cinema screen onto any surface, with surround sound beamed straight to your ears.',
    visualDescription:
      'lounging on a rooftop at night as the Pocket Cinema, a small glowing brass disc resting on the parapet, projects a huge, vivid cinema screen onto the wall of the building opposite',
    emoji: '🎥',
    category: 'gadgets',
    posture: 'relaxed',
    dialogue: {
      en: "Hi, I'm [Character_Name]. A theatre in my palm. Any wall, any night. The Pocket Cinema.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। मेरी हथेली में एक सिनेमाघर। कोई भी दीवार, कोई भी रात। द पॉकेट सिनेमा।',
      ta: 'வணக்கம், நான் [Character_Name]. என் உள்ளங்கையில் ஒரு திரையரங்கு. எந்த சுவரும், எந்த இரவும். தி பாக்கெட் சினிமா.',
      te: 'నమస్తే, నేను [Character_Name]. నా అరచేతిలో ఒక థియేటర్. ఏ గోడైనా, ఏ రాత్రైనా. ది పాకెట్ సినిమా.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ನನ್ನ ಅಂಗೈಯಲ್ಲಿ ಒಂದು ಥಿಯೇಟರ್. ಯಾವ ಗೋಡೆಯಾದರೂ, ಯಾವ ರಾತ್ರಿಯಾದರೂ. ದಿ ಪಾಕೆಟ್ ಸಿನಿಮಾ.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. എന്റെ കൈപ്പത്തിയിൽ ഒരു തിയേറ്റർ. ഏത് ചുവരും, ഏത് രാത്രിയും. ദി പോക്കറ്റ് സിനിമ.',
      bn: 'নমস্কার, আমি [Character_Name]। আমার হাতের তালুতে একটা সিনেমা হল। যেকোনো দেয়াল, যেকোনো রাত। দ্য পকেট সিনেমা।',
      mr: 'नमस्कार, मी [Character_Name]. माझ्या तळहातावर एक थिएटर. कोणतीही भिंत, कोणतीही रात्र. द पॉकेट सिनेमा.',
      gu: 'નમસ્તે, હું [Character_Name] છું. મારી હથેળીમાં એક થિયેટર. કોઈપણ દીવાલ, કોઈપણ રાત. ધ પોકેટ સિનેમા.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਮੇਰੀ ਹਥੇਲੀ ਵਿੱਚ ਇੱਕ ਸਿਨੇਮਾ। ਕੋਈ ਵੀ ਕੰਧ, ਕੋਈ ਵੀ ਰਾਤ। ਦ ਪਾਕੇਟ ਸਿਨੇਮਾ।',
    },
  },
  {
    id: 'selfie_satellite',
    name: 'Selfie Satellite',
    tagline: 'Your personal orbit.',
    description:
      'A palm-sized camera drone that orbits you silently all day, catching every candid moment from the perfect angle without you touching a thing.',
    visualDescription:
      'laughing mid-stride on a colourful festival street as the Selfie Satellite, a tiny chrome sphere with a glowing lens, orbits smoothly around their head capturing the moment',
    emoji: '🛰️',
    category: 'gadgets',
    posture: 'active',
    dialogue: {
      en: "Hi, I'm [Character_Name]. It orbits. It watches. It never misses the moment. The Selfie Satellite.",
      hi: 'नमस्ते, मैं [Character_Name] हूँ। यह घूमता है। यह देखता है। यह कोई पल नहीं चूकता। द सेल्फी सैटेलाइट।',
      ta: 'வணக்கம், நான் [Character_Name]. இது சுற்றுகிறது. இது பார்க்கிறது. எந்த தருணத்தையும் தவறவிடாது. தி செல்ஃபி சாட்டிலைட்.',
      te: 'నమస్తే, నేను [Character_Name]. ఇది తిరుగుతుంది. ఇది చూస్తుంది. ఏ క్షణాన్నీ వదిలిపెట్టదు. ది సెల్ఫీ శాటిలైట్.',
      kn: 'ನಮಸ್ತೆ, ನಾನು [Character_Name]. ಇದು ಸುತ್ತುತ್ತದೆ. ಇದು ನೋಡುತ್ತದೆ. ಯಾವ ಕ್ಷಣವನ್ನೂ ತಪ್ಪಿಸುವುದಿಲ್ಲ. ದಿ ಸೆಲ್ಫಿ ಸ್ಯಾಟಲೈಟ್.',
      ml: 'നമസ്കാരം, ഞാൻ [Character_Name]. ഇത് ചുറ്റും കറങ്ങുന്നു. ഇത് കാണുന്നു. ഒരു നിമിഷവും നഷ്ടപ്പെടുത്തില്ല. ദി സെൽഫി സാറ്റലൈറ്റ്.',
      bn: 'নমস্কার, আমি [Character_Name]। এটি ঘোরে। এটি দেখে। কোনো মুহূর্ত মিস করে না। দ্য সেলফি স্যাটেলাইট।',
      mr: 'नमस्कार, मी [Character_Name]. हा फिरतो. हा पाहतो. एकही क्षण चुकवत नाही. द सेल्फी सॅटेलाइट.',
      gu: 'નમસ્તે, હું [Character_Name] છું. તે ફરે છે. તે જુએ છે. તે એક પણ ક્ષણ ચૂકતું નથી. ધ સેલ્ફી સેટેલાઇટ.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ [Character_Name] ਹਾਂ। ਇਹ ਘੁੰਮਦਾ ਹੈ। ਇਹ ਵੇਖਦਾ ਹੈ। ਇਹ ਕੋਈ ਪਲ ਨਹੀਂ ਖੁੰਝਾਉਂਦਾ। ਦ ਸੈਲਫੀ ਸੈਟੇਲਾਈਟ।',
    },
  },
];
