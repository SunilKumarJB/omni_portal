import { Check } from 'lucide-react';
import type { ProductPreset } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading';

export const PRODUCT_PRESETS: ProductPreset[] = [
  {
    id: 'lumina_aura',
    name: 'Lumina Aura',
    tagline: 'Wear your vibe. Shape your light.',
    description:
      'An elegant, shifting ambient wearable that weaves soft ribbons of colored light around you based on your mood.',
    visualDescription:
      'wearing the Lumina Aura, a sleek collar-like futuristic wearable emitting soft, shifting ribbons of colored light that elegantly contour their neck and shoulders',
    emoji: '✨',
    gradient: 'from-pink-500/10 via-purple-500/10 to-indigo-500/10 border-purple-500/20',
  },
  {
    id: 'solaris_roadster',
    name: 'Solaris Roadster',
    tagline: 'Powered by stars. Driven by design.',
    description:
      'An ultra-luxury electric sports car featuring a seamless reflective body powered entirely by ambient light.',
    visualDescription:
      'standing next to the Solaris Roadster, an ultra-luxury electric sports car with a seamless reflective body, glowing solar-cell panels, and sleek aerodynamic contours',
    emoji: '🏎️',
    gradient: 'from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-orange-500/20',
  },
  {
    id: 'aether_glass',
    name: 'Aether Glass',
    tagline: 'Reality, upgraded in real-time.',
    description:
      'Minimalist, premium holographic smart glasses projecting a subtle, high-tech spatial HUD directly in front of you.',
    visualDescription:
      'wearing the Aether Glass, a pair of minimalist, premium holographic smart glasses projecting a subtle, high-tech semi-transparent HUD overlay in front of their eyes',
    emoji: '👓',
    gradient: 'from-cyan-500/10 via-blue-500/10 to-teal-500/10 border-cyan-500/20',
  },
  {
    id: 'quantum_chrono',
    name: 'Quantum Chrono',
    tagline: 'Own your time. Master your flow.',
    description:
      'A luxurious timepiece with a glowing holographic dial that visualizes personal schedules as rotating timelines.',
    visualDescription:
      'wearing the Quantum Chrono, a luxurious wristwatch featuring a glowing holographic dial showing delicate, rotating timelines above the watch face',
    emoji: '⌚',
    gradient: 'from-blue-500/10 via-indigo-500/10 to-violet-500/10 border-blue-500/20',
  },
];

interface ProductSelectorProps {
  selectedProduct: ProductPreset | null;
  setSelectedProduct: (product: ProductPreset) => void;
}

export default function ProductSelector({
  selectedProduct,
  setSelectedProduct,
}: ProductSelectorProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 2 of 6" title="Select your hero product" className="mb-0">
        Choose a premium, futuristic product to anchor your campaign.
      </StepHeading>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 items-center max-h-[480px]">
        {PRODUCT_PRESETS.map((prod) => {
          const selected = selectedProduct?.id === prod.id;
          return (
            <div
              key={prod.id}
              className={cn(
                'group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 bg-card transition-all duration-300',
                'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
                selected
                  ? 'border-foreground ring-1 ring-foreground bg-gradient-to-br'
                  : 'border-border hover:-translate-y-1 hover:border-foreground/30 hover:shadow-xl hover:shadow-black/5',
              )}
              style={{
                backgroundImage: selected
                  ? `linear-gradient(135deg, var(--card) 60%, transparent 100%)`
                  : undefined,
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedProduct(prod)}
                className="absolute inset-0 z-0 cursor-pointer focus:outline-none"
                aria-label={`Select product: ${prod.name}`}
                aria-pressed={selected}
              />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{prod.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      {prod.name}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {prod.tagline}
                    </p>
                  </div>
                </div>
                {selected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground">
                    <Check className="h-3 w-3 text-background" strokeWidth={3.5} />
                  </div>
                )}
              </div>

              <div
                className={cn(
                  'relative z-10 mt-4 flex-1 rounded-xl border border-border/50 bg-background/30 p-4 transition-colors duration-300',
                  selected && 'bg-background/60',
                )}
              >
                <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/90 transition-colors">
                  {prod.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
