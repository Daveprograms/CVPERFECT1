# Resume template + formatting engine (design-only, content-driven)

This defines the resume template engine you asked for:

- True separation between **Resume Content** (`ResumeDocument`) and **Resume Design** (templates + themes).
- Instant template switching with deterministic rendering.
- Drag/drop section ordering, per-section visibility toggles.
- Multi-column layouts and pagination that match exported PDFs.

It is designed to feel like Resume.io / Rezi / Reactive Resume / Canva editor quality, while
remaining ATS-safe for the “safe templates”.

---

## 1. Core contract

### Inputs
- `ResumeDocument` (content): `frontend/lib/resume-document/*`
- `TemplateId` + `ThemeId` (design)
- `RenderOptions`:
  - `mode: 'screen' | 'pdf' | 'docx'`
  - `page: { size: 'letter' | 'a4', margin: ... }`
  - `locale: string`
  - `atsSafe: boolean`

### Output
The template engine has two render targets:

1. **Preview DOM** (React) — live in the editor and library.
2. **Export DOM** (HTML) — rendered headlessly by Chromium to PDF.

Hard requirement: **preview DOM and export DOM are the same component tree**. Only the
`RenderOptions.mode` changes print-specific CSS.

---

## 2. Template model (design only)

Templates are versioned packages:

```ts
type ResumeTemplate = {
  id: string
  slug: string
  name: string
  description?: string
  atsSafe: boolean
  version: number

  layout: {
    columns: 1 | 2
    sidebar?: {
      widthPct: number // 0-50
      slotSections: Array<SectionKey>
    }
    main: {
      slotSections: Array<SectionKey>
    }
  }

  tokens: TemplateTokens
}
```

The template never contains resume content.

### TemplateTokens
Tokens are the only design vocabulary templates can use:
- typography scale (font families, sizes, weights)
- spacing scale (4/8/12/16…)
- colors (primary/text/muted/divider)
- section styling (heading variants, bullet style)

---

## 3. Theme model

A theme is a concrete palette + typography selection that overrides template defaults.

```ts
type ResumeTheme = {
  id: string
  templateId: string
  slug: string
  name: string
  palette: {
    text: string
    muted: string
    primary: string
    divider: string
    background: string
  }
  typography: {
    bodyFont: string
    headingFont: string
  }
}
```

ATS-safe templates ignore color and force `bodyFont` to an allowlist.

---

## 4. Section ordering + visibility (content-driven)

### Source of truth
- `ResumeDocument.metadata.section_order`
- `ResumeDocument.metadata.section_visibility`

### Template slot map
Templates provide a slot map describing where a section is allowed to render.

Rules:
1. If a section is hidden (`visibility=false`), it is omitted everywhere.
2. If a section appears in `sidebar.slotSections`, it renders in the sidebar.
3. Else it renders in the main column.
4. The final render order is: for each column, iterate `section_order` and include the
   sections that belong to that column.

This makes switching templates deterministic: only the slot map changes.

---

## 5. Drag/drop design

Drag/drop in the editor updates:
- `section_order` (for section reordering)
- item arrays (e.g. reorder `experience[]`)

No template code runs during drag/drop; the preview is just a rerender.

---

## 6. Pagination strategy (HTML/CSS + deterministic break rules)

Goal: the browser preview looks like a paged document, and the exported PDF uses the exact
same pagination.

### CSS page model
We render into a fixed-width “paper” container (A4/Letter) and use print CSS:
- `@page` margins for PDF export.
- For preview: emulate pages with wrappers sized to page height.

### Break rules
Each section and each list item can opt into break constraints via CSS:
- `break-inside: avoid` on:
  - section headings + first bullet
  - experience items
  - education items
  - skill groups

We never allow:
- a heading at the bottom of a page with content on the next page
- a single orphan bullet on the next page when the whole item could move

### Determinism requirement
Pagination is sensitive to font metrics. Therefore:
- fonts are self-hosted and loaded before render
- exports run in a pinned Chromium version
- templates avoid layout that depends on unstable measurement

---

## 7. Renderer interfaces

### Web/preview renderer (React)

```ts
renderResume({
  doc: ResumeDocument,
  template: ResumeTemplate,
  theme: ResumeTheme,
  options: RenderOptions,
}): ReactNode
```

### PDF renderer (Chromium)

```ts
renderPdf({ variantId, templateId, themeId }): { bytes, mimeType }
```

Implementation: a small Node renderer service that:
1. Fetches `ResumeVariant.content_json`
2. Uses the same template components to render HTML
3. Runs Playwright `page.pdf()`

### DOCX renderer
DOCX is produced from `ResumeDocument` (not from PDF). Each template ships a docx adapter.

---

## 8. ATS-safe vs creative templates

Templates declare `atsSafe: boolean`.

ATS-safe constraints:
- single-column or “fake two column” via a table only
- no icons, no images, no background colors
- no text boxes, no absolute positioning
- font allowlist (Calibri/Arial/Times/Helvetica equivalents)

Creative templates can use:
- real two-column layout
- color
- subtle icons
- more typography variation

But: creative templates still must export clean text (no SVG-as-text).

---

## 9. Minimal code scaffolding (where it will live)

Frontend:
- `frontend/lib/resume-templates/registry.ts` — list of templates
- `frontend/lib/resume-templates/tokens.ts` — token types and defaults
- `frontend/lib/resume-templates/render.tsx` — renderer entrypoint

Backend:
- `resume_templates` / `resume_themes` tables (already added in migration)
- export system writes `resume_exports` rows and stores artifact bytes

