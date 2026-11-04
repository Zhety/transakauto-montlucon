#!/bin/bash
# Arrête et retire le service « plaquettes » (agent launchd).
set -euo pipefail
LABEL="com.transakauto.plaquette-worker"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$PLIST"
echo "Service retiré."
