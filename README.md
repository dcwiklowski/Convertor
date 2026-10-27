# Convertor
Metric to Imperial conversion app

**Measure** is a single-page PWA built from the Claude Design handoff (Classical design system). It has three screens (Convert, Reference and History), seven categories, ingredient-aware cooking conversions, and a small settings sheet. It works offline and needs no build step.

## Run locally
```
npx http-server@14.1.1 . -p 8137 -c-1
```
Then open http://localhost:8137.

## Install on a phone
Host the folder over HTTPS (GitHub Pages works), open it on the phone, and use **Add to Home Screen** (iOS Safari) or **Install app** (Android Chrome).

## Files
- `index.html`: the whole app (styles, unit data, logic)
- `service-worker.js`: offline cache, including the Google Fonts
- `manifest.json`, `icons/`: install metadata
- `tools/make-icons.js`: regenerates the icons (`node tools/make-icons.js`)
