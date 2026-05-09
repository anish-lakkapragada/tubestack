# Theme Reference Values

These are the computed browser values collected from the source pages for TubeStack's reading themes.

## Anthropic

Source: Anthropic article page.

### Body

- Selector: `.body-2.serif`, `.body-2`
- Font family: `var(--anthropic-serif), serif`
- Font size: `17px`
- Font weight: `400`
- Line height: `155%`
- Letter spacing: `0` on `.body-2`
- Body page font: `var(--anthropic-serif), serif`
- Body page letter spacing: `-0.01em`
- Paragraph margin top: `1em`
- Paragraph margin bottom: `0`
- Text color: `rgb(20, 20, 19)`

### Header

- Selector: `.headline-4`
- Font family: `anthropicSans, "anthropicSans Fallback", sans-serif`
- Font size: `23px`
- Font weight: `600`
- Line height: `27.6px`
- Letter spacing: `0`
- Text color: `rgb(20, 20, 19)`
- Max width: `640px`
- Margin top: `64px`
- Margin bottom: `32px`

## OpenAI

Source: OpenAI article page.

### Body

- Selector: `.text-p1`
- Font family: `"OpenAI Sans", sans-serif`
- Font size: `17px`
- Font weight: `400`
- Line height: `27.999px`
- Letter spacing: `-0.17px`
- Text color: `rgb(255, 255, 255)`
- Background: `#000`
- Font features: `"liga" on, "calt" on`

### Header

- Selector: `.text-h3`
- Font family: `"OpenAI Sans", sans-serif`
- Font size: `30px`
- Font weight: `500`
- Line height: `38.6688px`
- Letter spacing: `-0.3px`
- Text color: `rgb(255, 255, 255)`
- Margin top: `0`
- Margin bottom: `0`

### TubeStack Observations

- The local OpenAI font files make the theme feel meaningfully closer to OpenAI's site than the previous system-font fallback. The shape is wider, smoother, more geometric, and less like generic Apple/System San Francisco.
- Headers are the most obvious place where the font difference shows. OpenAI's large headlines are clean, white, and heavy without feeling chunky, so TubeStack should use the bundled bold face for video/article titles.
- Body text should stay regular weight. OpenAI Sans has a softer, rounded editorial feel than system sans, but if the body size is too large it starts reading like enlarged UI text instead of prose.
- If the OpenAI theme still feels off after the font file is correct, the likely knobs are title size, body size, line height, and paragraph spacing rather than the font family itself.

## Substack

Source: Substack reader page.

### Body

- Selector: `.reader2-post-content`
- Font family: `-apple-system-ui-serif, ui-serif, "Spectral", "Georgia", serif`
- Font size: `19px`
- Font weight: `400`
- Text color: `var(--color-fg-primary)`
- Font smoothing: antialiased

### Header

- Selector: `.typography h2`
- Font family: `"SF Pro Display", -apple-system-headline, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Font size: `30.875px`
- Font weight: `700`
- Line height: `35.815px`
- Margin top: `30.875px`
- Margin bottom: `19.296875px`
- Max width: `600px`

## X

Source: X longform page.

### Body

- Selector: `.longform-unstyled`, `.longform-blockquote`
- Font family: `TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Font size: `17px`
- Line height: `28px`
- Base app body: `15px / 20px`

### Header

- Selectors/classes: `.r-uho16t`, `.r-1vr29t4`
- Font family: `TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Font size: `34px`
- Font weight: `800`
- Line height: `44px`
- Text color: `rgb(231, 233, 234)`
- Margin bottom: `0`

## Implementation Notes

- `medium` should correspond to these source-native values.
- `small`, `large`, and `xl` should scale the full app UI from the same base.
- Theme controls should affect typography, color, spacing, and surfaces.
- Layout width is intentionally shared across themes unless exact source matching is chosen later.
