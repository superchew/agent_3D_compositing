#!/bin/bash
# TV Featuring Composer — Gatekeeper bypass launcher
# Recipients: right-click this file → Open (once), then double-click works normally.

APP="/Applications/TV Featuring Composer.app"

if [ -d "$APP" ]; then
  xattr -rc "$APP"
  open "$APP"
else
  osascript -e 'display alert "App Not Found" message "Please drag '"'"'TV Featuring Composer.app'"'"' to your Applications folder first, then run this launcher."'
fi
