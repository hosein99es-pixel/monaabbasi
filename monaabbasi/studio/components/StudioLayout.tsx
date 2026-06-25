import type {LayoutProps} from 'sanity'
import {vazirmatnFontCss} from './vazirmatnFont'

// The Sanity theme API (buildLegacyTheme) only controls colours/fonts, not shape
// or sizing. To bring the Studio closer to the site's Material-3-Expressive feel
// — rounder cards, pill buttons, larger touch targets, mobile-friendly — we inject
// a small global stylesheet targeting @sanity/ui's stable [data-ui] hooks.
const studioCss = `
  /* Calmer vertical rhythm so labels, help text and inputs aren't cramped.
     Persian needs more line-height than Latin, so we keep it generous. */
  [data-ui="Text"] { line-height: 1.6; }
  [data-ui="Label"] { line-height: 1.5; letter-spacing: 0.01em; }
  [data-ui="Card"] [data-ui="Text"][data-size="1"] { margin-top: 0.15rem; }

  /* Bigger, easier-to-see icons in the navigation, list rows and buttons. */
  [data-sanity-icon] { font-size: 1.3em; }

  /* List/preview rows: separate the subtitle from the title so they aren't
     glued together. */
  [data-ui="Text"][data-size="2"] + [data-ui="Text"][data-size="1"],
  [data-ui="Text"][data-size="1"] + [data-ui="Text"][data-size="0"] { margin-top: 4px; }
`

const studioCssMain = `
  /* Branded guidance band above the default navbar — makes the header feel
     bigger and "tells" the editor what to do, bilingually. */
  .mona-brandband {
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    padding: 0.7rem 1.1rem;
    background: linear-gradient(90deg, #fdeef0 0%, #fff6f0 100%);
    border-bottom: 1px solid #f0dfe2;
    color: #241a1c;
    font-family: "Google Sans", Inter, Estedad, system-ui, sans-serif;
  }
  .mona-brandband__title { font-size: 1.05rem; }
  .mona-brandband__title strong { color: #b1466a; }
  .mona-brandband__title span { color: #6b5560; }
  .mona-brandband__hint {
    flex: 1 1 280px; min-width: 0;
    font-size: 0.85rem; line-height: 1.4; color: #6b5560;
  }
  .mona-brandband__hint b { color: #1f7a55; }
  .mona-brandband__link {
    margin-inline-start: auto;
    border: 1px solid #b1466a; border-radius: 999px;
    padding: 0.4rem 1rem;
    color: #b1466a; font-weight: 600; text-decoration: none; white-space: nowrap;
    transition: background 0.12s ease, color 0.12s ease;
  }
  .mona-brandband__link:hover { background: #b1466a; color: #fff; }
  @media (max-width: 700px) {
    .mona-brandband__hint { display: none; }
    .mona-brandband { padding: 0.55rem 0.9rem; }
  }

  /* Rounder, more "expressive" surfaces */
  [data-ui="Card"] { border-radius: 16px; }
  [data-ui="Dialog"] [data-ui="Card"],
  [data-ui="Popover"] [data-ui="Card"] { border-radius: 22px; }
  [data-ui="TextInput"],
  [data-ui="TextArea"],
  [data-ui="Select"],
  [data-ui="Autocomplete"] { border-radius: 13px; }
  [data-ui="TextInput"] input,
  [data-ui="TextArea"] textarea { padding: 0.8rem 0.95rem; }

  /* Bigger, pill-shaped, easier-to-hit buttons */
  [data-ui="Button"],
  [data-ui="ToneButton"] { border-radius: 999px; }
  [data-ui="Button"] { min-height: 2.6rem; font-weight: 600; }

  /* Branded focus ring — modern, on-brand, replaces the stock blue glow */
  [data-ui="TextInput"]:focus-within,
  [data-ui="TextArea"]:focus-within,
  [data-ui="Select"]:focus-within,
  [data-ui="Autocomplete"]:focus-within { box-shadow: 0 0 0 2px rgba(184, 134, 47, 0.45); }

  /* Tactile buttons: subtle hover lift + press feedback */
  [data-ui="Button"] { transition: transform 0.08s ease, filter 0.12s ease; }
  [data-ui="Button"]:hover { filter: brightness(1.04); }
  [data-ui="Button"]:active { transform: translateY(1px); }

  /* Mobile: even larger targets and tighter radii so panels fit small screens */
  @media (max-width: 600px) {
    [data-ui="Button"] { min-height: 3rem; }
    [data-ui="Card"] { border-radius: 13px; }
    [data-ui="TextInput"] input,
    [data-ui="TextArea"] textarea { padding: 0.9rem 1rem; font-size: 16px; }
  }
`

export function StudioLayout(props: LayoutProps) {
  return (
    <>
      <style>{vazirmatnFontCss + studioCss + studioCssMain}</style>
      {props.renderDefault(props)}
    </>
  )
}
