# Changelog

All notable changes to the StealthyLabs website are documented here.

---

## [2026-04-17]

### Fixed
- Mobile menu: `#mobileMenu` now relocated to `<body>` on load so `position: fixed` anchors to viewport instead of `.container`'s transformed containing block
- Mobile menu overlay height: `100dvh` + `inset: 0` so it fills viewport on mobile browsers with dynamic URL bar
- Cookie banner: OK button was never wired — added delegated click listener + `localStorage` fallback so consent persists on HTTP (Secure cookies dropped on localhost)
- Contact page no longer scrolls (was caused by mobile menu taking layout space)
- Network page: content vertically centered, footer anchored to bottom without large empty band

### Added
- Changelog link in desktop nav on EN + FR contact pages

### Changed
- Close menu button nudged (top 18→24, right 25→20)

---

## [2026-04-06]

### Changed
- Arklay bot docs fully rewritten from GitHub README (v3):
  Music 22→27 commands (Lavalink+Shoukaku, /favorites, /playlist, /history, /247, /lyrics-translate, /stats, /recommend),
  AI 9→16 commands (ChatGPT/OpenAI, Ollama, /code, /cloudai, /localai, /persona, /explain, /debate, /llm),
  Utility +2 (/screenshot, /qrcode), Fun +2 (/gif, /quote)
- Arklay index card updated: 99 commands, multi-provider AI (Claude, Gemini, ChatGPT, Ollama), Lavalink
- Arklay banner and logo images added (`img/arklay/`)
- Release card version badge: hardcoded version → `latest`, download link → `/releases/latest`
- Release card bullets: em dash (—) replaced by bullet (•) in CSS
- Changelog nav link added to all pages (EN + FR)

### Removed
- Specter bot: index cards (EN + FR), documentation pages (EN + FR), language router

---

## [2026-03-20]

### Added
- Claude Rich Presence v2.0.0 release card on docs index
- Language-aware redirect pages for all project doc URLs

### Changed
- Specter docs: 74 commands listed, Installation/Configuration sections removed

---

## [2026-03-10]

### Added
- Categorized docs index with filter buttons
- 10 new project documentation pages
- AI Fluency & Claude API docs
- Backend auth security hardening (fail-fast secrets, CORS, requireAuth middleware)

### Changed
- Projects section renamed to Docs
- Docs pages with language redirect support

### Fixed
- Contact form: updated worker URL to contact-api-stealthylabs
- Spotify step layout in iframe-edge docs
- Footer sticking to bottom on short-content pages

---

## [2026-02-XX]

### Changed
- Redesign: Swiss/editorial minimal aesthetic + UX improvements
- Claude Rich Presence updated to v2.0.0
