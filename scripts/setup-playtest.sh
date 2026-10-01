#!/bin/sh
# Prépare le playtest dans un conteneur neuf : Playwright (version accordée au
# Chromium préinstallé dans /opt/pw-browsers), Firefox et WebKit, et les
# bibliothèques système de WebKit. Rien de tout ça n'est servi par le jeu.
set -e
cd "$(dirname "$0")/../tools/playtest"
npm install --silent
npx playwright install firefox webkit
npx playwright install-deps webkit || echo "setup-playtest : dépendances de WebKit non installées (droits ?) ; WebKit indisponible"
echo "setup-playtest : prêt (node run.js --aide)"
