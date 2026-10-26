# DESIGN.md — Compara Pró

Documented after the `/` landing redesign (Impeccable finish). Product UI inherits these tokens; marketing surfaces may amplify composition while keeping the same material world.

## Palette

| Role | Value | Use |
|------|-------|-----|
| Background | `#f7f8fc` | Light canvas. Dark mode uses `#172a49`. |
| Foreground | `#192b49` | Primary text |
| Primary | `#245bcf` | Identity, links, and the main action. Hover `#1747ab`. White text on the solid button. |
| Soft | `#eaf0ff` | Quiet blue surface |
| Muted | `#657187` | Secondary text |
| Border | `#dce2ec` | Hairlines |
| Card | `#ffffff` | Elevated work surfaces |
| Success | `#1f8a65` | Approved state and the winning price |
| Warning | `#3b4f86` | Pending and blocked. Not orange. |
| Destructive | `#cf2d56` | Error and rejected |

Strategy: cool neutrals, one blue accent. Green marks the better price. Red marks failure. Warning stays a separate indigo so it is not the brand button and not an orange alert.

## Typography

- Sans / UI: **Geist** (`--font-geist-sans`)
- Mono / data: **Geist Mono** (`--font-geist-mono`)
- Display scale jumps on marketing; body measure ~65–75ch
- No Inter / Roboto; no default serif display on dashboards

## Radius & depth

- `--radius: 0.5rem` (technical)
- Shadows: offset + soft blur (no zero-offset glow)

## Comparison desk

The buyer comparison and any surface that marks a winning offer use the same reading as the public example:

- Suppliers sit in columns. The table scrolls sideways when there are more than fit. The item column stays visible.
- The lowest price of the row uses `bg-success/10` and `text-success`, with a check and the words "Menor preço".
- Other prices use muted text. A missing offer is an em dash.
- The chosen offer that is not the lowest gets a `ring-primary` outline, so selection is not the same signal as the win.
- A "Melhor oferta" column names the winning supplier.
- The legend reads "Verde = menor preço da linha."

Green elsewhere still means success, savings, or a price that fell. It is not applied to every price.

## Landing composition (`/`)

- Mode: **Persuade**
- Form: **Comparison desk** (seed `f51ad587`, dealt index 7)
- First viewport: brand + offer left; live comparison surface right
- Forbidden: eyebrow badges, three equal icon cards, invented customer logos / % guarantees

## Motion

- Framer Motion; honor `prefers-reduced-motion`
- Hero stagger + row cascade on the desk; one authored entrance language, not identical section fades everywhere
