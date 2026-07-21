# GEOMETRY — project website (Hugo)

A bilingual (EN/FR) static site for the MIAI cluster chair **GEOMETRY**.
Interactive 3D landing page, dark mode, and all editorial content kept in
plain markdown files so project members edit **content, not HTML**.

---

## 1. Run it locally

Install Hugo (extended not required, any recent version works):

- macOS: `brew install hugo`
- Debian/Ubuntu: `sudo apt install hugo`  (or download from https://github.com/gohugoio/hugo/releases)
- Windows: `choco install hugo` or `scoop install hugo`

Then, from this folder:

```bash
hugo server          # live preview at http://localhost:1313
```

The page reloads automatically as you edit. Internet access is needed the first
time (fonts, three.js and anime.js load from CDNs — see §6 to vendor them).

## 2. Build for deployment

```bash
hugo                 # outputs the finished site into ./public
```

Upload the **contents of `public/`** to any static host:

- **GitHub Pages** — push the repo, enable Pages (or use the `peaceiris/actions-hugo` workflow). Free, redeploys on every push.
- **University web space** (Gipsa-lab / LISTIC personal or project pages) — SFTP the `public/` files.
- **Netlify / Cloudflare Pages / GitLab Pages** — point them at the repo, build command `hugo`, publish dir `public`.

No server, database or VPS is required.

> If the site is served from a sub-path (e.g. `https://lab.fr/geometry/`),
> set `baseURL = "https://lab.fr/geometry/"` in `hugo.toml` so links resolve.

---

## 3. Editing content (markdown, one file per language)

Editorial content lives in **`content/`** as ordinary markdown, one file per
item per language. English is `*.en.md`, French is `*.fr.md` — Hugo pairs
them automatically by filename. English is served at the plain URL
(`/positions/`), French under `/fr/` (`/fr/positions/`).

| Section | Path | Notes |
|---|---|---|
| Home page | `content/_index.en.md` / `.fr.md` | Front matter: `hero_title`, `hero_lead`, `why_title`, `why_note`, `keywords`. Body markdown = the "why geometry" paragraphs. |
| Work packages | `content/workpackages/wp1.en.md` etc. | Front matter: `num`, `members`, `card` (short blurb), `weight` (1/2/3, sets order). Body markdown = the page, using `##` headings — these become the sidebar jump-links automatically. |
| Team | `content/team/*.en.md` | `group: chair` (with `affil` + bio in the body) or `group: member` (with `role`, `skills`). `weight` sets display order. Collaboration lists are front matter on `content/team/_index.en.md`. |
| News | `content/news/*.en.md` | Front matter: `date` (real date, controls sort order), `date_label` (display text, e.g. "Jul 2026"). Body = the item text. Add a new file to add a news item. |
| Positions | `content/positions/*.en.md` | Front matter: `role_kind`, `dates`, `tag`, `loc`. Body = description. To open a role, add a new markdown file with those fields — it appears on the page automatically (unless `draft: true`). |
| Publications | `content/publications/_index.en.md` | Currently just `intro` / `empty` / `note` front matter. Once there are real publications, add `content/publications/<slug>.en.md` files the same way as news. |
| Internal area | `content/internal/_index.en.md` | `areas` front matter list (the placeholder cards) + `note`. Each card's link is `url_b64` — base64, not plaintext (see below). Password is in `data/site.yaml`, see §4. |

Site-wide **configuration** (not editorial content) stays in `data/site.yaml`:
site name/tagline, footer text, nav labels, partner logos, the 3D hero
settings, and the internal-area password hash.

A little `<em>…</em>` or `<strong>…</strong>` inside markdown text is fine —
raw HTML passthrough is enabled.

### Look & feel (in `data/site.yaml`)

```yaml
look:
  accent: "#4a6741"          # any hex — links, badges, 3D accent
  font_display: "'Space Grotesk', 'IBM Plex Sans', sans-serif"
```

### The landing-page 3D hero (in `data/site.yaml → hero`)

```yaml
hero:
  variant: torus       # torus | flow — visitors can also switch it live
  motion: scroll        # scroll (rotates with page scroll) | orbit | drift | still
  surface: grid          # grid | none | glass
  zoom: 0.88
  speed: 0.4
  density: 0.4           # how many particles
  trail: 55               # trail length
  thickness: 4
```

The hero reacts to click/touch-drag on the landing page (rotate), and shrinks
to half size around the "Why geometry" section before easing back to full
size by the end of the page.

---

## 4. The internal area

`content/internal/_index.en.md` (+ `.fr.md`) hold the cards; the password
gate itself is client-side JS (`static/js/site.js`) comparing a **SHA-256
hash** of what's typed against `data/site.yaml → password_hash` — the
plaintext password is never stored in the repo or sent to the page.

To change the password:

```bash
scripts/hash-password.sh 'yournewpassword'
# → password_hash: <hex>
```

Paste the printed line's value into `password_hash` in `data/site.yaml`.

Each card's link is likewise never stored as a plain URL in `content/internal/_index.*.md`
— it's base64 under `url_b64`, decoded back to a real `href` at build time
(`layouts/_default/internal.html`). This is **not encryption** — base64 is
trivially reversible by anyone who looks — it just keeps the raw link from
sitting as greppable plaintext in the repo. To add or change a card's link:

```bash
scripts/encode-url.sh 'https://your-real-url.example.com/...'
# → url_b64: "<base64>"
```

Paste the printed line in place of the card's existing `url_b64:` line.

**This gate is client-side only** — good for hiding links from casual visitors, not
real security. For genuine protection, put the linked resources behind your
university intranet, an `.htaccess` password on the server, or an SSO-protected space.

---

## 5. Adding a language string used across many pages

Small bits of chrome text that appear identically on several pages (nav
labels, "Read more →", section eyebrows, button labels) stay as inline
`partial "bi.html" (dict "en" "…" "fr" "…")` calls in the layout templates —
that partial just picks the field matching the page's current language.
There's no need to touch these unless you're changing copy that appears
site-wide; regular page content always belongs in `content/`.

---

## 6. Optional: work fully offline (vendor the CDNs)

The site loads three fonts, three.js and anime.js from public CDNs. To self-host:

1. Download `anime.min.js` into `static/js/` and change the `<script src>` in
   `layouts/partials/head.html`.
2. three.js is imported inside `static/js/hero3d.js` (the `THREE_URL` constant at
   the top) — point it at a local copy if needed.
3. Self-host the Google Fonts or swap the `<link>` in `head.html`.

---

## 7. Structure

```
hugo.toml                 site config (baseURL, [languages] en/fr)
data/site.yaml             site-wide config: nav, footer, hero, look, partner logos, password hash
content/                   editorial content — *.en.md / *.fr.md pairs, one section per content type
layouts/
  _default/baseof.html      page shell
  index.html                 landing page
  _default/*.html            one per section (team, wp, news, positions, publications, internal)
  partials/                   head, nav, footer, bi (per-language string picker)
static/js/
  hero3d.js                 the 3D <geo-hero> web component
  site.js                    theme toggle, scroll animation, password gate
```

Design note: this is native Hugo multilingual — English pages live at the
plain URL, French pages under `/fr/…`. The EN/FR switcher in the nav links to
the translated version of whichever page you're on.
