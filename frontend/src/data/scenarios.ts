import type { ProductPosture, VideoTemplate } from '@/lib/types';

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'bollywood_romance',
    number: '01',
    title: 'Bollywood Romance',
    style: 'Cinematic Drama · Warm Gold',
    location: 'Udaipur Palace / Punjab Fields',
    dialogue: 'They say love is in the air. Personally, I prefer a more premium elevation.',
    prompt:
      'A slow push-in, medium shot of [REF_Character] in a grand Bollywood romance scene. The lighting is warm and golden, casting a romantic glow. Wind gently blows through their hair and clothes as marigold petals drift in the background. High-saturation colors and dramatic slow-motion capture the emotional depth and premium grandeur of the moment.',
    accent: '#EA4335',
    emoji: '🎬',
    videoSrc: '/assets/videos/template_bollywood_romance.mp4',
    poster: '/assets/posters/template_bollywood_romance.webp',
  },
  {
    id: 'cyberpunk_bengaluru',
    number: '02',
    title: 'Cyberpunk Bengaluru',
    style: 'Sci-Fi · Neon Saffron',
    location: 'Bengaluru Tech-Hub 2050',
    dialogue: 'They said the city never sleeps. Good… neither do my innovations.',
    prompt:
      'One continuous tracking shot on a 35mm lens, gliding in front of [REF_Character] as they walk through a futuristic Bengaluru in 2050 at night. The scene is illuminated by electric saffron and deep teal neon lights. Hovering auto-rickshaws fly in the background, and glowing Sanskrit holographic billboards light up the rain-slicked streets and futuristic street-food stalls.',
    accent: '#FF9900',
    emoji: '🛺',
    videoSrc: '/assets/videos/template_cyberpunk_bengaluru.mp4',
    poster: '/assets/posters/template_cyberpunk_bengaluru.webp',
  },
  {
    id: 'monsoon_drama',
    number: '03',
    title: 'Monsoon Backwaters',
    style: 'Moody Travelogue · Emerald Green',
    location: 'Kerala Houseboat',
    dialogue: 'In the heart of the monsoon, peace isn’t just a feeling. It’s a luxury.',
    prompt:
      'A serene, slow-drifting medium shot of [REF_Character] on a luxurious wooden houseboat drifting along the tranquil backwaters of Kerala during a lush monsoon. Moody slate-grey skies and rich emerald-green palms frame the scene. Heavy rain patters on the water, and mist rises from the canals, with slow-motion close-ups capturing the rich wood textures and rain droplets.',
    accent: '#34A853',
    emoji: '🌧️',
    videoSrc: '/assets/videos/template_monsoon_drama.mp4',
    poster: '/assets/posters/template_monsoon_drama.webp',
  },
  {
    id: 'mythology_fusion',
    number: '04',
    title: 'Ancient-Tech Hampi',
    style: 'Epic Fantasy · Glowing Gold',
    location: 'Hampi Temple Ruins',
    dialogue: 'Some legends are carved in stone. Others are written in the stars.',
    prompt:
      'A majestic, sweeping wide shot of [REF_Character] standing amidst the grand stone ruins of an ancient temple in Hampi, infused with futuristic technology. Ancient stone carvings glow with golden energy runes, and stone monoliths float silently in the air. Dramatic volumetric sun rays stream through the pillars, creating an epic, mythological atmosphere of grand scale.',
    accent: '#4285F4',
    emoji: '🔱',
    videoSrc: '/assets/videos/template_mythology_fusion.mp4',
    poster: '/assets/posters/template_mythology_fusion.webp',
  },
  {
    id: 'pixar_style',
    number: '05',
    title: '3D Pixar Style',
    style: '3D Animated · Warm Digital',
    location: 'Festive Indian Home',
    dialogue: 'Home is where the heart is. And today, it’s glowing.',
    prompt:
      'A warm, vibrant 3D Pixar-style digital animation. [REF_Character], a cute character with highly expressive eyes, is in a brightly lit Indian home decorated with marigold garlands. The camera captures the glossy surfaces, colorful design, and fun animations of the festive room in the soft, warm light.',
    accent: '#34A853',
    emoji: '🏡',
    videoSrc: '/assets/videos/template_pixar_style.mp4',
    poster: '/assets/posters/template_pixar_style.webp',
  },
  {
    id: 'custom',
    number: '✦',
    title: 'Custom Prompt',
    style: 'Your own vision',
    location: 'Any location you describe',
    dialogue: 'Write exactly what you want Omni to create.',
    prompt: '',
    accent: '#888888',
    emoji: '✏️',
    videoSrc: null,
    poster: null,
  },
];

/** Scenario prompt per template, written for each product posture. */
export const TAILORED_PROMPTS: Record<string, Record<ProductPosture, string>> = {
  bollywood_romance: {
    active:
      'A slow push-in, medium shot of [REF_Character] in a grand Bollywood romance scene. The lighting is warm and golden, casting a romantic glow. Wind gently blows through their hair and clothes as marigold petals drift in the background. High-saturation colors and dramatic slow-motion capture the emotional depth and premium grandeur of the moment as they actively showcase the product.',
    relaxed:
      'A serene, slow-drifting medium shot of [REF_Character] lounging peacefully on a luxurious heritage daybed on a palace balcony in Udaipur at sunset. Wrapped in the comfort of the product, they look completely relaxed as marigold petals drift around them in the warm, golden hour light, creating a quiet, romantic oasis.',
    vehicle:
      "A grand, low-angle wide shot of [REF_Character] standing beside the vehicle parked on a scenic lakeside palace road in Udaipur at sunset. The warm, golden hour sun casts a romantic glow. The camera sweeps around to showcase the vehicle's impressive scale, sleek lines, and premium details reflecting the vibrant colors of the palace.",
  },
  cyberpunk_bengaluru: {
    active:
      'One continuous tracking shot on a 35mm lens, gliding in front of [REF_Character] as they walk confidently through a futuristic Bengaluru in 2050 at night. The scene is illuminated by electric saffron and deep teal neon lights. [REF_Character] is actively using the product, and the camera focuses on a detailed close-up of the product in action against the backdrop of hovering auto-rickshaws and glowing Sanskrit holographic billboards.',
    relaxed:
      'A slow, atmospheric medium shot of [REF_Character] relaxing in a sleek, high-tech lounge overlooking the glowing neon streets of futuristic Bengaluru in 2050 at night. Illuminated by soft, moody saffron and teal ambient light, [REF_Character] is peacefully enjoying the product. The camera gently drifts, capturing the soothing textures and features of the product in the vibrant, high-tech city.',
    vehicle:
      "A dramatic, sweeping wide shot of [REF_Character] standing on a high-altitude neon-lit sky terrace overlooking futuristic Bengaluru in 2050 at night. The vehicle is parked prominently beside them. The camera pans to showcase the vehicle's sleek aerodynamic lines, glowing engines, and futuristic design reflecting the vibrant saffron and teal neon lights of the city below.",
  },
  monsoon_drama: {
    active:
      "A serene, slow-drifting medium shot of [REF_Character] on the covered deck of a luxurious wooden houseboat in Kerala during a lush monsoon. Moody slate-grey skies and rich emerald-green palms frame the scene. [REF_Character] is actively using the product, and the camera glides in for a close-up, capturing the product's sleek design and textures against the heavy rain pattering on the water.",
    relaxed:
      'A moody, atmospheric medium shot of [REF_Character] relaxing snugly inside the glass-walled cabin of a luxury Kerala houseboat. Wrapped in the comfort of the product, they watch the monsoon rain pour outside. The camera gently drifts, capturing the quiet, soothing comfort of the product against the backdrop of lush green palms and misty waters.',
    vehicle:
      "A dramatic, wet wide shot of the vehicle parked on a lush green jetty in the Kerala backwaters during a monsoon rain. [REF_Character] stands beside the vehicle under a large umbrella. The camera showcases the vehicle's sleek, water-glistening lines, retractable wings, and glowing engines standing out against the misty, emerald-green landscape.",
  },
  mythology_fusion: {
    active:
      "A majestic, sweeping wide shot of [REF_Character] standing amidst the grand stone ruins of an ancient temple in Hampi, infused with futuristic technology. [REF_Character] is actively using the product, which glows with energy. The camera glides in for a-close-up, showcasing the product's high-tech utility against the backdrop of ancient stone carvings glowing with golden energy runes and floating monoliths.",
    relaxed:
      "A serene, slow-drifting medium shot of [REF_Character] lounging peacefully on a stone veranda overlooking the grand temple ruins of Hampi. Wrapped in the comfort of the product, they find peace. Dramatic volumetric sun rays stream through the pillars, highlighting the product's rich textures against the mystical, ancient-tech ruins.",
    vehicle:
      "A grand, sweeping wide shot of the vehicle parked atop a rocky hill overlooking the ancient temple ruins of Hampi. [REF_Character] stands proudly beside the vehicle. The camera showcases the vehicle's impressive scale, sleek lines, and glowing engines standing out against the historic stone gopurams and floating ruins in the golden hour light.",
  },
  pixar_style: {
    active:
      'A warm, vibrant 3D Pixar-style digital animation. [REF_Character], a cute character with highly expressive eyes, is in a brightly lit Indian home decorated with marigold garlands. They are actively using the product, reacting with joyful amazement. The camera focuses on the product, showcasing its glossy surfaces, colorful design, and fun animations in the soft, warm light.',
    relaxed:
      "A cozy, warm 3D Pixar-style digital animation. [REF_Character], a cute expressive character, is lounging happily on a pile of colorful silk cushions in a festive Indian home. Snugly enjoying the product, they look blissfully happy. The camera zooms in on the product's soft, inviting textures and comforting features in the cheerful, sun-drenched room.",
    vehicle:
      "A cheerful, wide-angle shot in a vibrant 3D Pixar-style animation. The vehicle, with a friendly and sleek glossy design, is parked in the driveway of a festive Indian home decorated with lights. [REF_Character] stands beside it, gesturing happily. The camera sweeps around to show the vehicle's fun features and glossy reflections.",
  },
};
