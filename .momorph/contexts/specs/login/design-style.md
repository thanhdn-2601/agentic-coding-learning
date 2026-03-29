# Design Style: Login Screen

**Frame ID**: `662:14387`
**Frame Name**: `Login`
**Figma Link**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=662:14387
**Extracted At**: 2026-03-23

---

## Design Tokens

### Colors

| Token Name | Hex / RGBA | Usage |
|---|---|---|
| `--Details-Background` | `#00101A` | Page background, button text |
| `--Details-Container` | `#101417` | Container backgrounds |
| `--Details-Container-2` | `#00070C` | Deep container |
| `--Details-Divider` | `#2E3940` | Footer border-top |
| `--Details-Text-Primary-1` | `#FFEA9E` | Login button background |
| `--Details-Text-Primary-2` | `#00101A` | Login button text (dark on yellow) |
| `--Details-Text-Secondary-1` | `#FFFFFF` | Body text, navigation labels |
| `--Details-Text-Secondary-2` | `#999999` | Muted / caption text |
| `--Details-Border` | `#998C5F` | Decorative borders |
| `--Details-Error` | `#B3261E` | Error state |
| `--BG-Update` | `#1E2D39` | Update background |
| `--header-bg` | `rgba(11, 15, 18, 0.8)` | Header translucent background |
| `--cover-gradient` | `linear-gradient(90deg, #00101A 0%, #00101A 25.41%, rgba(0, 16, 26, 0) 100%)` | Left-fade overlay on hero |
| `--footer-gradient` | `linear-gradient(0deg, #00101A 22.48%, rgba(0, 19, 32, 0) 51.74%)` | Bottom fade overlay |
| `--Details-TextButton-Normal` | `rgba(255, 234, 158, 0.1)` | Text button default bg |
| `--Details-PrimaryButton-Hover` | `#FFF8E1` | Login button hover |
| `--Details-SecondaryButton-Normal` | `rgba(255, 234, 158, 0.1)` | Secondary button bg |
| `--Details-ButtonSecondary-Hover` | `rgba(255, 234, 158, 0.4)` | Secondary button hover bg |

### Typography

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| `--text-hero-title` | Montserrat | 200px *(artwork image)* | — | — | — | "ROOT FURTHER" (image asset) |
| `--text-body-bold` | Montserrat | 20px | 700 | 40px | 0.5px | Hero description text |
| `--text-button-primary` | Montserrat | 22px | 700 | 28px | 0px | Login button label |
| `--text-nav-label` | Montserrat | 16px | 700 | 24px | 0.15px | Language selector "VN/EN" |
| `--text-footer` | Montserrat Alternates | 16px | 700 | 24px | 0% | Footer copyright |

### Spacing

| Token Name | Value | Usage |
|---|---|---|
| `--page-padding-x` | 144px | Horizontal page content padding |
| `--page-padding-y` | 96px | Vertical hero section padding |
| `--header-height` | 80px | Fixed header height |
| `--header-padding-x` | 144px | Header horizontal padding |
| `--header-padding-y` | 12px | Header vertical padding |
| `--footer-padding-x` | 90px | Footer horizontal padding |
| `--footer-padding-y` | 40px | Footer vertical padding |
| `--hero-gap` | 120px | Gap between hero sections |
| `--content-gap` | 24px | Gap inside content block |
| `--content-left-pad` | 16px | Left padding of content block |

### Border & Radius

| Token Name | Value | Usage |
|---|---|---|
| `--radius-button` | 8px | Login button border-radius |
| `--radius-language-btn` | 4px | Language selector button border-radius |
| `--border-footer` | `1px solid var(--Details-Divider)` | Footer top border |
| `--focus-ring` | `2px solid #FFEA9E` | Keyboard focus outline (all interactive elements) |
| `--focus-ring-offset` | `2px` | Focus ring offset |

### Shadows / Overlays

| Token Name | Value | Usage |
|---|---|---|
| `--overlay-hero` | `linear-gradient(90deg, #00101A 0%, #00101A 25.41%, rgba(0,16,26,0) 100%)` | Left dark fade over artwork |
| `--overlay-cover` | `linear-gradient(0deg, #00101A 22.48%, rgba(0,19,32,0) 51.74%)` | Bottom dark fade |

---

## Layout Specifications

### Frame (Desktop — 1440×1024px)

| Layer | Position | Size | Notes |
|---|---|---|---|
| C_Keyvisual | `0, 2` | `1441×1022px` | Full-bleed background artwork (absolute) |
| A_Header | `0, 0` | `1440×80px` | Fixed top, z-index above all |
| Rectangle 57 (overlay) | `1, 0` | `1442×1024px` | Gradient overlay (absolute) |
| B_Bìa (Hero section) | `0, 88` | `1440×845px` | padding: `96px 144px` |
| Cover (overlay) | `0, 138` | `1440×1093px` | Bottom gradient (absolute) |
| D_Footer | `0, 933` | `1440×91px` | Fixed bottom |

### A_Header

```
width: 1440px; height: 80px;
display: flex; flex-direction: row; justify-content: space-between; align-items: center;
padding: 12px 144px;
background: rgba(11, 15, 18, 0.8);
position: fixed; top: 0; left: 0; z-index: 100;
```

- **A.1_Logo**: position left, size `52×48px`
- **A.2_Language**: position right, size `108×56px`
  - Inner button: `padding: 16px`, `border-radius: 4px`
  - Flag icon: `20×15px`
  - Text "VN/EN": Montserrat 700, 16px
  - Chevron icon: `24×24px`

### B_Bìa (Hero)

```
width: 1440px; min-height: 845px;
display: flex; flex-direction: column; align-items: flex-start;
padding: 96px 144px;
gap: 120px;
position: relative; top: 88px;
```

#### B.1_Key Visual

```
width: 1152px; height: auto;
/* Contains "ROOT FURTHER" image asset: 451×200px */
```

#### B.2_content (Text block)

```
width: 496px;
display: flex; flex-direction: column; gap: 24px;
padding-left: 16px;
```

- **Description text**: Montserrat 700, 20px, line-height 40px, 0.5px letter-spacing, color white
  - Line 1 (vi): "Bắt đầu hành trình của bạn cùng SAA 2025."
  - Line 2 (vi): "Đăng nhập để khám phá!"
  - Line 1 (en): "Begin your journey with SAA 2025."
  - Line 2 (en): "Log in to explore!"

#### B.3_Login (Login Button)

```
width: 305px; height: 60px;
display: flex; flex-direction: row; align-items: center;
padding: 16px 24px; gap: 8px;
background: #FFEA9E;
border-radius: 8px;
cursor: pointer;
```

- **Label**: Montserrat 700, 22px, line-height 28px, color `#00101A`
  - (vi): "LOGIN With Google"
  - (en): "LOGIN With Google" *(same)*
- **Google icon**: `24×24px` (right of label)
- **Hover**: background `#FFF8E1`, slight `box-shadow: 0 4px 12px rgba(0,0,0,0.3)` lift
- **Disabled**: `opacity: 0.5; cursor: not-allowed; pointer-events: none`
- **Loading**: Replace Google icon with circular spinner `24×24px`, color `#00101A`, keep label text; button disabled

### D_Footer

```
width: 1440px;
display: flex; align-items: center; justify-content: space-between;
padding: 40px 90px;
border-top: 1px solid #2E3940;
position: absolute; bottom: 0;
```

- **Copyright text**: Montserrat Alternates 700, 16px, line-height 24px, color white, centered
  - "Bản quyền thuộc về Sun* © 2025"

---

## Responsive Design

### Mobile (375px)

```
/* Header */
padding: 12px 16px;

/* Hero */
padding: 80px 16px 40px;
gap: 40px;

/* B.1 Key Visual image */
width: 100%; max-width: 280px;

/* Description text */
font-size: 16px; line-height: 28px;
width: 100%;

/* Login Button */
width: 100%; /* full-width on mobile */
height: 56px;
font-size: 18px;

/* Footer */
padding: 24px 16px;
```

### Tablet (768px)

```
/* Header */
padding: 12px 32px;

/* Hero */
padding: 80px 32px 60px;

/* B.1 Key Visual image */
max-width: 360px;

/* Login Button */
width: auto; min-width: 280px;

/* Footer */
padding: 32px 32px;
```

### Desktop (1440px)

As per Figma specification above.

---

## Component States

### Login Button States

| State | Background | Text Color | Border | Cursor | Notes |
|---|---|---|---|---|---|
| Default | `#FFEA9E` | `#00101A` | none | pointer | Normal |
| Hover | `#FFF8E1` | `#00101A` | none | pointer | Light lift shadow |
| Active/Pressed | `rgba(255,234,158,0.8)` | `#00101A` | none | pointer | Slight scale down |
| Disabled | `#FFEA9E` 50% opacity | `#00101A` 50% | none | not-allowed | During OAuth |
| Loading | `#FFEA9E` | `#00101A` | none | wait | Show spinner |

### Language Button States

#### Trigger Button (A.2 — Language Selector, Node: `I662:14391;186:1601`)

| State | Background | Notes |
|---|---|---|
| Default | `rgba(255, 234, 158, 0.10)` | No border |
| Hover | `rgba(255, 234, 158, 0.20)` | Subtle highlight |
| Active (dropdown open) | `rgba(255, 234, 158, 0.30)` | Visually indicates open state |

#### Language Dropdown Panel (A.2.1 — `525:11713`)

| Property | Value |
|---|---|
| Width | `110px` |
| Items | 2 (VN on top, EN below) |
| Item height | `56px` each |
| Panel total height | `112px` |
| Background | `var(--Details-Container)` (`#101417`) |
| Border | `1px solid var(--Details-Divider)` (`#2E3940`) |
| Border radius | `8px` |
| Position | Absolute, top 100% of trigger, right-aligned |
| Z-index | `50` |

#### Dropdown Item States (A.2.1a VN / A.2.1b EN)

| State | Background | Text Color | Notes |
|---|---|---|---|
| Default | transparent | `#FFFFFF` | Normal |
| Hover | `rgba(255,255,255,0.08)` | `#FFFFFF` | Subtle highlight |
| Selected (current locale) | `rgba(255, 234, 158, 0.15)` | `#FFEA9E` | Distinct from hover |

---

## Assets

| Asset | Type | Node ID | Size |
|---|---|---|---|
| SAA 2025 Logo | Image (SVG/PNG) | `I662:14391;178:1033;178:1030` (MM_MEDIA_Logo) | `52×48px` |
| ROOT FURTHER artwork | Image (PNG) | `2939:9548` (MM_MEDIA_Root Further Logo) | `451×200px` |
| Google icon | SVG | `I662:14426;186:1766` (MM_MEDIA_Google) | `24×24px` |
| VN Flag icon | SVG | `MM_MEDIA_VN` | `20×15px` |
| EN Flag icon | SVG | `MM_MEDIA_EN` | `20×15px` |
| Chevron Down icon | SVG | `I662:14391;186:1696;186:1821;186:1441` (MM_MEDIA_Down) | `24×24px` |
| Hero background artwork | Image | `662:14389` (image 1) | 1441×1022px (fullbleed) |

---

## CSS Variables (globals.css additions)

```css
:root {
  /* SAA 2025 Brand Colors */
  --Details-Background: #00101A;
  --Details-Container: #101417;
  --Details-Container-2: #00070C;
  --Details-Divider: #2E3940;
  --Details-Border: #998C5F;
  --Details-Error: #B3261E;
  --BG-Update: #1E2D39;

  /* Text Colors */
  --Details-Text-Primary-1: #FFEA9E;
  --Details-Text-Primary-2: #00101A;
  --Details-Text-Secondary-1: #FFFFFF;
  --Details-Text-Secondary-2: #999999;

  /* Button Colors */
  --Details-TextButton-Normal: rgba(255, 234, 158, 0.10);
  --Details-PrimaryButton-Hover: #FFF8E1;
  --Details-ButtonSecondary-Hover: rgba(255, 234, 158, 0.40);
  --Details-SecondaryButton-Normal: rgba(255, 234, 158, 0.10);
  --Details-Dropdown-List-Hover: rgba(255, 255, 255, 0.08);  /* Dropdown item hover BG */
  --Details-Dropdown-List-Selected: rgba(255, 234, 158, 0.15); /* Dropdown item selected BG */

  /* Accessibility */
  --focus-ring: 2px solid #FFEA9E;
  --focus-ring-offset: 2px;

  /* Layout */
  --page-padding-x: 144px;
  --page-padding-y: 96px;
  --header-height: 80px;
}
```
