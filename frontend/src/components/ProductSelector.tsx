import { Check } from 'lucide-react';
import type { ProductPreset } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading';

export const PRODUCT_PRESETS: ProductPreset[] = [
  {
    id: 'aggressive_toaster',
    name: 'Aggressive Toaster',
    tagline: 'Toast or else. No compromises.',
    description:
      'A high-performance toaster that aggressively launches perfectly browned toast up to three feet in the air with dramatic sound effects.',
    visualDescription:
      'catching golden-brown toast launched three feet into the air by the Aggressive Toaster, a high-octane chrome kitchen device sporting glowing red heat indicators',
    emoji: '🍞',
    gradient: 'from-red-500/10 via-orange-500/10 to-amber-500/10 border-red-500/20',
  },
  {
    id: 'snooze_blanket',
    name: 'Snooze Blanket',
    tagline: 'Instant sleep. Zero resistance.',
    description:
      'An ultra-soft smart-weave weighted blanket emitting relaxing sub-bass frequencies and warm sleep-inducing micro-currents.',
    visualDescription:
      'wrapped snugly under the Snooze Blanket, an ultra-soft deep navy weighted blanket with glowing micro-weave fibers radiating warm, relaxing light pulses',
    emoji: '🛏️',
    gradient: 'from-indigo-500/10 via-violet-500/10 to-blue-500/10 border-indigo-500/20',
  },
  {
    id: 'flying_sneakers',
    name: 'AeroSneaks',
    tagline: 'Defy gravity. Walk on air.',
    description:
      'Premium street sneakers equipped with mini ion-thrusters in the soles, allowing short bursts of controlled levitation.',
    visualDescription:
      'hovering a foot above the ground wearing the AeroSneaks, premium high-top sneakers featuring glowing blue ion thruster ports in the soles',
    emoji: '👟',
    gradient: 'from-teal-500/10 via-emerald-500/10 to-green-500/10 border-teal-500/20',
  },
  {
    id: 'flying_suv',
    name: 'AeroCruiser SUV',
    tagline: 'No roads. No limits. Pure elevation.',
    description:
      'An electric family SUV with retractable wings and clean-fusion jet engines, designed for high-altitude luxury cruising.',
    visualDescription:
      'standing beside the AeroCruiser SUV as its sleek carbon-fiber wings slowly unfold and its blue fusion jet engines glow intensely, preparing for takeoff on an elevated sky terrace',
    emoji: '🚙',
    gradient: 'from-slate-500/10 via-zinc-500/10 to-neutral-500/10 border-slate-500/20',
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
    gradient: 'from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-500/20',
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
    gradient: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-500/20',
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

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 items-stretch max-h-[480px] overflow-y-auto pt-2 pb-2 px-1 pr-2">
        {PRODUCT_PRESETS.map((prod) => {
          const selected = selectedProduct?.id === prod.id;
          return (
            <button
              key={prod.id}
              type="button"
              onClick={() => setSelectedProduct(prod)}
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 bg-card transition-all duration-300 text-left w-full h-full',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-foreground ring-1 ring-foreground bg-gradient-to-br z-10'
                  : 'border-border hover:-translate-y-1 hover:border-foreground/30 hover:shadow-xl hover:shadow-black/5 hover:z-10',
              )}
              style={{
                backgroundImage: selected
                  ? `linear-gradient(135deg, var(--card) 60%, transparent 100%)`
                  : undefined,
              }}
              aria-label={`Select product: ${prod.name}`}
              aria-pressed={selected}
            >
              <div className="w-full flex items-start justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl">{prod.emoji}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold tracking-tight text-foreground truncate">
                      {prod.name}
                    </h3>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                      {prod.tagline}
                    </p>
                  </div>
                </div>
                {selected && (
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-foreground">
                    <Check className="h-2.5 w-2.5 text-background" strokeWidth={3.5} />
                  </div>
                )}
              </div>

              <div
                className={cn(
                  'w-full mt-3 flex-1 rounded-lg border border-border/50 bg-background/30 p-3 transition-colors duration-300',
                  selected && 'bg-background/60',
                )}
              >
                <p className="text-xs leading-relaxed text-muted-foreground group-hover:text-foreground/90 transition-colors">
                  {prod.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
