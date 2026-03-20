# StealthyLabs Web

Official website for **StealthyLabs** — FPS content creator hub featuring gaming guides, setup showcase, open source projects, and full bilingual support (English / French).

**Live:** [stealthylabs.eu](https://stealthylabs.eu)

## What is this?

StealthyLabs is a personal brand and content creation platform focused on FPS gaming. This repository contains the full source code of the website, which serves as a central hub for:

- **Network** — Social links, Discord status, music player, and Twitch live detection
- **About** — Gaming setup showcase (peripherals & PC specs)
- **Projects** — Open source tools ([Claude Rich Presence](https://github.com/StealthyLabsHQ/claude-rpc), [iframe-edge](https://github.com/StealthyLabsHQ/iframe-edge))
- **Games** — ARC Raiders guides with interactive bestiary, maps viewer, and blueprints tracker
- **Contact** — Contact form powered by a Cloudflare Workers backend

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML / CSS / JavaScript |
| Theme | Pure OLED dark (black `#000`, white/grey accents, no shadows) |
| Backend API | Node.js + Express, Prisma + PostgreSQL |
| Hosting | Apache with `.htaccess` rewrites |
| i18n | Dual-directory structure (`/en/`, `/fr/`) with language auto-detection |
| Security | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |

## Project Structure

```
├── en/                     # English pages
├── fr/                     # French pages (mirrored structure)
├── css/
│   ├── style-main.css      # Global layout & components
│   ├── glass-theme.css     # OLED dark theme overrides
│   ├── style-about.css     # About page
│   ├── style-projects.css  # Projects page
│   ├── style-bestiary.css  # ARC bestiary
│   └── style-maps.css      # ARC maps
├── js/
│   ├── main.js             # Core: language switch, fonts, clock, page transitions
│   ├── index.js            # Homepage & ARC tabs logic
│   ├── arc-tracker.js      # Blueprints tracker (localStorage persistence)
│   ├── network.js          # Social links, Discord status, music player
│   ├── contact.js          # Contact form (Cloudflare Worker API)
│   ├── context-menu.js     # Custom right-click menu
│   └── settings-handler.js # Settings panel (language, font, debug)
├── backend/                # Express API (auth, contact, game data)
├── img/                    # Images & game assets
├── logos/                  # Branding & favicon
└── json/                   # Playlist & privacy tools data
```

## Features

- **Multilingual** — Full EN/FR support with auto-detection (URL, cookie, browser language)
- **OLED Dark Theme** — Pure black design, zero shadows, minimal borders
- **Page Transitions** — Smooth fade animations between internal pages
- **External Link Warnings** — Modal confirmation before leaving the site
- **ARC Raiders Toolkit** — Interactive bestiary, zoomable maps (lightbox), blueprint tracker with localStorage autosave
- **Settings Panel** — Language, font selector (Inter / Raleway / JetBrains Mono), debug tools
- **Custom Context Menu** — Right-click menu with page-aware options
- **SEO** — Canonical URLs, hreflang, OpenGraph, Twitter Cards, Schema.org JSON-LD
- **Security Headers** — Strict CSP, HSTS preload, no-sniff, frame protection

## License

All rights reserved. This is a personal project — source code is provided for reference only.
