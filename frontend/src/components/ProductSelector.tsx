import { Check } from 'lucide-react';
import type { ProductPreset } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading';

interface ProductSelectorProps {
  /** The subset shown this run; picked once per run in Home so revisiting the step is stable. */
  products: ProductPreset[];
  selectedProduct: ProductPreset | null;
  setSelectedProduct: (product: ProductPreset) => void;
}

export default function ProductSelector({
  products,
  selectedProduct,
  setSelectedProduct,
}: ProductSelectorProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 2 of 6" title="Select your hero product" className="mb-0">
        Choose a premium, futuristic product to anchor your campaign.
      </StepHeading>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 items-stretch max-h-[480px] overflow-y-auto pt-2 pb-2 px-1 pr-2">
        {products.map((prod) => {
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
