#!/bin/bash
# Kopiert lib/ in chrome/ und firefox/ Ordner
# Ausführen nach Änderungen an lib/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Synchronisiere lib/ ..."

# Chrome: Symlink funktioniert
if [ -L "$SCRIPT_DIR/chrome/lib" ] || [ -d "$SCRIPT_DIR/chrome/lib" ]; then
  rm -rf "$SCRIPT_DIR/chrome/lib"
fi
ln -s ../lib "$SCRIPT_DIR/chrome/lib"

# Firefox: braucht echte Kopie
rm -rf "$SCRIPT_DIR/firefox/lib"
cp -r "$SCRIPT_DIR/lib" "$SCRIPT_DIR/firefox/lib"

echo "Fertig. chrome/lib → Symlink, firefox/lib → Kopie"
