# BWW Viewer – Browser Extension

Browser-Extension zur Darstellung von **BWW-Dateien** (Bagpipe Writer) als Notenblatt direkt im Browser. Verfügbar für Chrome und Firefox.

## Features

- **Direktanzeige**: BWW-Dateien werden beim Öffnen automatisch als Notenblatt gerendert
- **Canvas-Rendering**: Professionelle Notendarstellung mit Staff-Linien, Notenschlüssel, Taktangaben
- **Tab-Ansicht**: Umschalten zwischen Notenblatt und BWW-Quelltext|

## Projektstruktur

```
bww-chrome/
├── lib/                  ← Gemeinsame Bibliotheken
│   ├── bww-parser.js     ← BWW-Format Parser
│   └── bww-renderer.js   ← Canvas Renderer
├── chrome/               ← Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── viewer.html
│   ├── viewer.js
│   └── lib -> ../lib     ← Symlink
├── firefox/              ← Firefox Extension (Manifest V2)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── viewer.html
│   ├── viewer.js
│   └── lib/              ← Kopie (Firefox unterstützt keine Symlinks)
└── sync-lib.sh           ← Synchronisiert lib/ nach firefox/lib/
```

## Installation

### Chrome
1. `chrome://extensions` öffnen
2. **Entwicklermodus** aktivieren
3. **Entpackte Erweiterung laden** → `chrome/` Ordner auswählen

### Firefox
1. `about:debugging` öffnen
2. **Dieses Firefox** → **Temporäres Add-on laden**
3. `firefox/manifest.json` auswählen

## Entwicklung

Nach Änderungen an `lib/`:

```bash
./sync-lib.sh
```

Dies kopiert `lib/` nach `firefox/lib/` (Chrome nutzt einen Symlink).
