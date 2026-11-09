# Design system

Source of truth: [`app/globals.css`](../../app/globals.css). Product context: [`PRODUCT.md`](../../PRODUCT.md).

```text
Component → semantic token (bg-primary, text-muted-foreground…) → CSS variable → official ramp step → hex
```

Never put hex values or raw Tailwind palette colours (`neutral-*`, `orange-*`) in components.

## Colour

**Official ramps:** `text`, `background`, `primary`, `secondary` and `accent`, from 50 to 950. Each is exposed as a utility (`bg-primary-500`, `text-text-900`…). `.dark` swaps every ramp for its official inversion.

**Semantic slots are defined per mode.** The ramps are mirror images, so the 500 step is identical in both modes. A pairing like "text on primary" therefore needs a different step in each mode.

| Slot | Use | Light | Dark |
| --- | --- | --- | --- |
| `background` / `foreground` | page, running text | bg-50 / text-900 (14.9:1) | bg-50 / text-900 (15.9:1) |
| `card` | surfaces, bands, footer | bg-100 | bg-100 |
| `muted-foreground` | secondary text | text-700 (5.5:1) | text-600 (9.4:1) |
| `primary` / `primary-foreground` | main actions, fills | primary-500 / text-950 (10.2:1) | primary-500 / text-50 (10.2:1) |
| `primary-ink` | primary as text, links, icons | primary-800 (8.0:1) | primary-500 (10.2:1) |
| `accent-ink` | highlights as text | accent-700 (4.8:1) | accent-500 (9.2:1) |
| `ring` | focus outline | primary-700 (4.5:1) | primary-500 |
| `input` | form control edges | bg-600 (3.2:1) | bg-300 (3.3:1) |
| `border` | decorative separation only | bg-200 | bg-200 |
| `destructive` | danger (functional, not brand) | #b42318 (6.0:1) | #ff7a6e (7.5:1) |
| `logo-mark` / `logo-arrow` | brand mark only | #38bdf8 / #2563eb | same |

Use `accent` sparingly, for highlights, badges and achievements. It is never the dominant colour.

## Typography

- **Typeface:** Poppins 400 and 700 only. Other weights such as `font-medium` or `font-semibold` would be synthesized by the browser, so they are not used.
- **Scale:** sm 0.75 · base 1 · xl 1.333 · 2xl 1.777 · 3xl 2.369 · 4xl 3.158 · 5xl 4.21 rem.

| Role | Classes |
| --- | --- |
| Hero | `text-3xl sm:text-4xl lg:text-5xl font-bold leading-display tracking-display`. Two lines maximum at every width. |
| Section | `text-2xl md:text-3xl font-bold leading-display tracking-display` |
| Card | `text-xl font-bold` |
| Body | `text-base leading-7` (lead copy: `md:text-xl`) |
| Metadata | `text-sm` |

## Layout

- **Widths:** use `<Container size="reading | content | wide">` only. The tokens are `--container-reading` 42rem, `--container-content` 72rem and `--container-wide` 80rem. No ad-hoc `max-w-*` page widths.
- **Gutters:** 16 / 24 / 32px.
- **Section rhythm:** `py-24 md:py-32`.
- **Separation:** surfaces change by tone (`bg-card`), not by hairlines or shadows. Shadows are reserved for things that float (menus, dialogs).

## Shape

Square corners everywhere (shadcn "Sera" preset): controls, cards, media. Avatars are the only round elements.

## Motion

- **Easing:** `ease-out-strong` (`cubic-bezier(0.23, 1, 0.32, 1)`).
- **Duration:** UI transitions last 150–300 ms and animate only the properties named in the transition (no `transition-all`).
- **Entrances:**
  - The hero uses `starting:` (@starting-style).
  - Sections use the `reveal` utility, which only runs in browsers with scroll-driven animations. Content is always visible without it.
- **Reduced motion:** `prefers-reduced-motion` collapses all motion (see `globals.css`).

## States and accessibility

- **Data states:** every data-driven list renders `EmptyState` when empty. Never show fake data.
- **Focus:** a single global `:focus-visible` outline in `--ring`. Do not remove it.
- **Icons:** lucide only, decorative icons get `aria-hidden`, and icons never replace an ambiguous text label.
- **Language:** text in another language carries `lang`, as the locale switcher does.

## Components

- **Primitives** (`components/ui`): Button, Badge, Avatar, Sheet, NavigationMenu, Accordion, Input, Label, Textarea, NativeSelect, DropdownMenu and Alert. These are Base UI, not Radix: there is no `asChild`.
- **Links that look like buttons:** use `ButtonLink` (internal, locale-aware) or `ButtonAnchor` (external), from `components/ui/button-link`. Never `<Button render={<Link/>} nativeButton={false}>`: Base UI gives that element `role="button"`, so screen readers would announce navigation as a button.
- **Product components:**
  - `GZLogo`
  - `Container` (`form`, `reading`, `content` and `wide` widths), `SiteShell`, `LocaleSwitcher`
  - `VerifiedBadge`, `EmptyState`
  - `ArticleCard`, `ArticleGrid`, `Byline` and `ArticleView`. `ArticleView` is the reading layout shared by the public page and the preview.
  - `StatusPill`: one status mark per row. Published uses the brand hue; the other states stay quiet.
  - Editor: `ArticleEditor`, `EditorToolbar`, `TagInput`, `CoverField` and `CoAuthorPicker`.
  - Community: `ArticleReaction`, `CommentSection`, `CommentCard`, `CommentForm` and `DeleteComment`. Comments have no box around them; hierarchy and space separate them. Deleting confirms in place, in two steps.
  - `AvatarField`: the profile photo in Settings. It saves on its own, separately from the profile form.
  - `WriterCard`: a person credited on published work, on the landing and `/team`.
  - Dashboard (`components/dashboard/activity`): `Metric` sets numbers as type, never as tiles; `ActivityPanel` keeps its heading when empty.
  - Landing sections in `components/marketing`

## Article typography

`.article-prose` (in `globals.css`) is the single reading style. It is used by the public article page, the studio preview and the editor canvas, so writers see exactly what readers get.

- **Measure:** `Container size="reading"` (42rem).
- **Text:** body at `--leading-prose` (1.8). Section headings are `text-2xl`, subheadings `text-xl`.
- **Code:** monospace (`--font-mono`) at `--text-code` (0.875rem). Syntax colours come from `--code-keyword`, `--code-string`, `--code-comment` and `--code-number`, with contrast measured against `--card` in both modes.
- **Italics:** real Poppins italics are loaded (400/700), never synthesized.
