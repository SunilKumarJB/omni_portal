# Frontend Redesign — GML Brand System, shadcn/ui & Theming

**Date:** 2026-06-23
**Branch:** `feat/adhish-dev`
**Scope:** `frontend/` only. No backend/API changes (`src/lib/api.js` untouched).
**Audience:** Whoever (human or Gemini model) extends this UI next. This documents
**what we changed, why, and the rules to keep following** so new work stays consistent.

---

## 0. Why this redesign happened

The Omni Portal is shown at a **customer demo for Google Marketing Live (GML) 2026**.
The previous UI had two problems:

1. **Off-brand.** It was blue-chrome-on-near-black everywhere (`#4285F4` accents). The GML
   2026 brand (see `~/DATA/Brand-Guidelines-PART.pdf`) says the brand *"speaks primarily in
   black and white"* — blue-everywhere is explicitly *not* the system.
2. **Un-themeable.** ~450 hardcoded colors (`bg-[#0A0A0A]`, `text-white/60`, inline hex). None
   of it can flip to light mode, so a dark/light toggle was impossible without a token layer.

The brand is **bi-tonal by design** — it specifies *both* "45% Black on White" and "45% White
on Black" — so a dark/light toggle is native to the system, not a bolt-on.

**Decisions taken (confirmed with the product owner):**
- **Full GML brand realignment** (not a reskin of the old blue look).
- **Dark theme by default**; user can toggle to light; choice persists.
- **Full shadcn/ui migration** for a maintainable, scalable primitive + token system.
- **Upgraded React 18 → 19** (latest), since this was a ground-up rewrite.

---

## 1. The GML brand rules we encoded (the important part)

From the brand deck. **These are the constraints all future UI must respect.**

### Color distribution: 50 / 25 / 25
- **50% Black & White** — the brand's primary voice. Surfaces and text are pure neutral.
- **25% AI Gradient** — the four-color accent, used *sparingly* for "brand moments."
- **25% Customer Tones** — a vertical gradient derived from a *spotlighted product's* dominant
  color (used when featuring a partner brand).

### The AI Gradient (four core colors)
`Vibrant Blue #2986FF · Core Red #EA4335 · Vibrant Yellow #FFC30E · Vibrant Green #2EBA53`
- **Confined to ONE corner** (top-left or bottom-right) of a composition.
- **≤ 10–15% of canvas height.** Never a full-bleed wash, never a full-width stripe.
- For *key brand moments only* — "where minimal black and white isn't appropriate."

### What this means in our app
- **Monochrome-first.** Primary actions are **black-on-white (light) / white-on-black (dark)**,
  NOT blue. The old ubiquitous Google-blue chrome was removed.
- **The AI gradient appears in exactly two places** (spend boldness once):
  1. The **hero** top-left corner wash (`.ai-gradient-corner`).
  2. The **"video ready" success moment** in `ResultPanel`, bottom-right
     (`.ai-gradient-corner--br`), shown only when `status === 'completed'`.
  Plus a 2px hairline (`.ai-gradient-line`) on a couple of cards. That's the whole budget.
- We **removed** the old full-width 4-block "rainbow bar" — it violated the corner-confinement
  rule (this was the deliberate "remove one accessory" cut).
- **Functional status colors are kept** because they *are* brand hues: success `#2EBA53`,
  warning `#FFC30E`, destructive `#EA4335`. Used only for state (banners, badges), never as chrome.
- **Per-template accents** (cyberpunk cyan, etc.) survive ONLY as a 2px media-top strip + the
  map-pin icon on that template's own card — a small "customer tone" nod. Selection state itself
  is monochrome (`ring-foreground`) for shell consistency.

### Typography
- Brand face is **Google Sans**. Demo machines are Google-internal, so the stack leads with
  `'Google Sans Display'/'Google Sans'` (display) and `'Google Sans Text'/'Google Sans'` (body).
- **Off-corp fallbacks** are loaded from Google Fonts (`index.html`): **Poppins** (display
  geometry) and **Inter** (body), so the geometric character renders everywhere.
- Tailwind exposes `font-display`, `font-sans`, `font-mono`. Headings use `font-display`.

---

## 2. Architecture: token system + shadcn/ui

### Token layer (the key to theming)
Theming is **CSS custom properties** in `src/index.css`, switched by a class on `<html>`:
- `:root { … }` = **light**, `.dark { … }` = **dark** (set by `next-themes`).
- All values are neutral (`0 0% L%`) by design — the brand is B/W; color only enters via the
  AI gradient + status hues, which are defined as theme-independent constants.
- `color-scheme` is set per theme so native controls/scrollbars match.

Semantic tokens (shadcn convention, HSL triplets consumed as `hsl(var(--x) / <alpha>)`):
`--background --foreground --card --popover --primary --secondary --muted --accent
--destructive --success --warning --border --input --ring --radius`, plus brand constants
`--ai-blue/red/yellow/green` and `--gml-ai-gradient`.

`tailwind.config.js` maps these to utility classes (`bg-background`, `text-muted-foreground`,
`border-border`, `bg-primary`, etc.). **This is the contract:** new UI should use these
semantic classes, never raw hex or `text-white/NN`. That's what makes both themes work for free.

### Why a token system over `dark:` variants
Tailwind's `dark:bg-x` approach would mean doubling every color class and editing ~450 sites by
hand, error-prone. One semantic token layer flips the whole app and matches the brand's bi-tonal
intent exactly.

### shadcn/ui primitives — `src/components/ui/`
Radix-based, theme-token-styled primitives (the reusable vocabulary):
`button, card, tabs, switch, tooltip, dialog, badge, progress, input, textarea, separator,
scroll-area, skeleton, sonner` (toasts). `button` variants: `default` (mono primary),
`secondary, outline, ghost, link, destructive`.
- Config in `components.json` (`style: new-york`, `tsx: false` → JS/JSX variant,
  `aliases` use the `@/*` path alias).
- `@/*` → `src/*` is wired in `vite.config.js` (`resolve.alias`) and `jsconfig.json`.
- `src/lib/utils.js` exports `cn()` (clsx + tailwind-merge) — use it to compose classes.

### Theme toggle
- `next-themes` `ThemeProvider` in `src/main.jsx`: `attribute="class"`, `defaultTheme="dark"`,
  `enableSystem={false}`, `disableTransitionOnChange`, `storageKey="omni-theme"`.
- `src/components/ThemeToggle.jsx` — sun/moon button (guards hydration with a `mounted` flag).
- Conceptually the toggle **flips the brand's own polarity** (B-on-W ↔ W-on-B).

### Shared shell
- `src/components/AppHeader.jsx` — ONE header (logo + actions slot + GCP badge + theme toggle),
  replacing three duplicated inline `<header>`s in Home/ResultPanel/VideoView. Pass page-specific
  controls via the `actions` prop (composition, not boolean flags).
- `src/components/StepHeading.jsx` — shared step eyebrow/title/subtitle + `FieldLabel`, since the
  trio repeated in all 5 wizard steps.

---

## 3. Engineering standards applied (Vercel + Web Interface skills)

We ran the code against three skills. What we adopted and why:

**React 19 (composition skill):** primitives use **`ref` as a plain prop**, not `forwardRef`
(the React 19 idiom). New components should do the same:
`function X({ className, ref, ...props }) { return <Prim ref={ref} … /> }`.

**Bundle size (react-best-practices, CRITICAL):** route + heavy deps are code-split.
- `VideoView` is `React.lazy` + `<Suspense>` in `App.jsx` (kept out of the landing bundle).
- `react-webcam` is `lazy()` in `CharacterSelector` (loads only when the Camera tab opens).
- Unused `framer-motion` removed. Result: main chunk < 500 KB; `VideoView`/`react-webcam` are
  separate ~8 KB chunks.

**Web Interface Guidelines (accessibility/UX):**
- Global `:focus-visible` ring (monochrome, token-based); never `outline:none` without a replacement.
- `prefers-reduced-motion` neutralizes animations.
- `color-scheme` per theme; `theme-color` metas in `index.html`.
- `text-wrap: balance` on `h1–h3`; `tabular-nums` on number readouts.
- Icon-only buttons have `aria-label` (theme toggle, copy link); decorative gradient divs are
  `aria-hidden`; async status uses `aria-live="polite"`; read-only share input has
  `autocomplete="off"` + `spellCheck={false}`.
- `<a>`/`<Link>` for navigation, `<button>` for actions; `…` ellipses and curly quotes in copy.
- `[touch-action:manipulation]` on interactive primitives; `-webkit-tap-highlight-color: transparent`.

**Toasts replace `alert()`** (sonner) — e.g. mic-permission denial, copy-link confirm, submit error.

---

## 4. File map (what changed)

**New**
- `frontend/components.json`, `frontend/jsconfig.json` — shadcn + alias config.
- `frontend/src/lib/utils.js` — `cn()`.
- `frontend/src/components/ui/*` — shadcn primitives.
- `frontend/src/components/AppHeader.jsx`, `ThemeToggle.jsx`, `StepHeading.jsx`.

**Rewritten to tokens/primitives**
- `src/index.css` (token layer + `.ai-gradient-corner*` utilities), `tailwind.config.js`
  (darkMode class, semantic colors, fonts), `index.html` (fonts + theme-color).
- `src/main.jsx` (ThemeProvider), `src/App.jsx` (lazy route + Toaster + TooltipProvider).
- `src/pages/Home.jsx` (hero + AI-gradient corner), `src/pages/VideoView.jsx`.
- `src/components/`: `StepIndicator, PromptSelector, DialogueSelector.tsx, CharacterSelector,
  AudioSelector, ReviewGenerate, ResultPanel`.

**Deleted (dead, imported nowhere)**
- `src/components/ProductUpload.jsx`, `VideoStyleSelector.jsx`, `GenerationStatus.jsx`.

**Dependencies added:** `tailwindcss-animate, class-variance-authority, tailwind-merge,
next-themes, sonner`, Radix primitives. **Removed:** `framer-motion`. **Upgraded:** `react`,
`react-dom` → 19.

---

## 5. How to extend without breaking the system

**DO**
- Use semantic token classes: `bg-background/card/muted`, `text-foreground/muted-foreground`,
  `border-border`, `bg-primary`. They theme automatically.
- Build from `src/components/ui/*`; compose with `cn()`. Pass slots (children/props), not boolean
  modes (composition skill).
- Keep new primitives React-19 style (`ref` as a prop).
- Verify both themes whenever you add a surface.

**DON'T**
- Don't hardcode hex or `text-white/NN` / `bg-[#…]` — it won't flip to light mode.
- Don't expand the AI gradient beyond the two sanctioned corner moments, and never beyond one
  corner / ~15% height. If you need "more color," you probably want a **status hue** or a
  **customer tone**, not the AI gradient.
- Don't reintroduce Google-blue as chrome. Primary = foreground (black/white).

**Customer Tones (not yet built — the obvious next feature):** the brand prescribes deriving a
vertical top→bottom gradient from a spotlighted product's dominant color. If a product-image
upload is added, extract its dominant color and theme a "spotlight" surface with it (token:
add a `--customer-tone` var, gradient runs dark→15% opacity, vertical only). This is the
on-brand way to add color when featuring a customer's product.

---

## 6. Verification done

- `npm run build` — passes; main JS chunk < 500 KB (gzip ~158 KB); route/webcam code-split.
- `npx @biomejs/biome check src` — clean (lint + format).
- Live browser sanity check (dark + light): header, hero AI-gradient corner, stepper, template
  grid, primary CTA all render correctly in both polarities; **toggle flips with no leftover dark
  patches**; default is dark and persists.

**Not yet exercised** (left for local testing): full wizard run-through to generation, the
`ResultPanel` success state (incl. the bottom-right gradient moment), `/video/:id`, camera/mic
capture, and mobile breakpoints.

---

## 7. Quick revert / safety

All changes are `frontend/`-scoped and isolated from backend. To revert the whole redesign,
revert this branch's frontend commits. The token layer is additive — if a specific screen
misbehaves, the offending component can be reverted independently since shared contracts
(`tailwind.config.js`, `index.css`, `components/ui/*`) are stable.
