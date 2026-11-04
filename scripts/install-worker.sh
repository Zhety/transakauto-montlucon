UID_="$(id -u)"
launchctl bootout "gui/$UID_/$LABEL" 2>/dev/null || true
# Le retrait est asynchrone : relancer tout de suite échoue avec « Input/output error ».
for _ in $(seq 1 30); do launchctl print "gui/$UID_/$LABEL" >/dev/null 2>&1 || break; sleep 0.5; done
launchctl bootstrap "gui/$UID_" "$PLIST" || { sleep 2; launchctl bootstrap "gui/$UID_" "$PLIST"; }
launchctl kickstart -k "gui/$UID_/$LABEL"
#!/bin/bash
# Installe le service « plaquettes » comme agent launchd de l'utilisateur :
# il démarre à l'ouverture de session et redémarre tout seul s'il s'arrête.
#   bash scripts/install-worker.sh      installe (ou réinstalle) et démarre
#   bash scripts/uninstall-worker.sh    arrête et retire
set -euo pipefail

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.transakauto.plaquette-worker"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
NODE_BIN="$(dirname "$(command -v node)")"
LOG_DIR="$PROJECT/plaquettes"
mkdir -p "$LOG_DIR" "$HOME/Library/LaunchAgents"

if [ ! -f "$PROJECT/.env.local" ] || ! grep -q '^PLAQUETTE_WORKER_TOKEN=.\+' "$PROJECT/.env.local"; then
  echo "PLAQUETTE_WORKER_TOKEN manquant dans $PROJECT/.env.local" >&2
  exit 1
fi

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN/npm</string>
    <string>run</string>
    <string>plaquette:worker</string>
  </array>
  <key>WorkingDirectory</key><string>$PROJECT</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$NODE_BIN:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    <key>HOME</key><string>$HOME</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$LOG_DIR/worker.log</string>
  <key>StandardErrorPath</key><string>$LOG_DIR/worker.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart -k "gui/$(id -u)/$LABEL"
echo "Service installé : $PLIST"
echo "Journal : $LOG_DIR/worker.log"
sleep 3
tail -n 5 "$LOG_DIR/worker.log" 2>/dev/null || true
