#!/bin/bash
# Demo mode launcher for Revu (Tauri/React)
# Runs the dev server with selected demo mode

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Demo modes
MODES=(
    "empty|No repo loaded"
    "withChanges|Files with changes, one selected"
    "withComments|Changes + review comments panel"
    "staged|Files staged, commit panel ready"
    "darkMode|withComments in dark theme"
)

echo "=== Revu Demo Mode Launcher ==="
echo ""
echo "Select a demo mode:"
echo ""

for i in "${!MODES[@]}"; do
    mode="${MODES[$i]%%|*}"
    desc="${MODES[$i]#*|}"
    printf "  %d) %-15s - %s\n" $((i+1)) "$mode" "$desc"
done

echo ""
read -p "Enter choice [1-${#MODES[@]}]: " choice

if [[ ! "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt ${#MODES[@]} ]; then
    echo "Invalid choice"
    exit 1
fi

SELECTED="${MODES[$((choice-1))]}"
SELECTED_MODE="${SELECTED%%|*}"
echo ""
echo "Selected: $SELECTED_MODE"
echo ""

cd "$PROJECT_DIR"

# Launch with demo mode environment variable
echo "Starting dev server with VITE_DEMO_MODE=$SELECTED_MODE..."
echo "(Press Ctrl+C to stop)"
echo ""

VITE_DEMO_MODE="$SELECTED_MODE" bun run tauri dev
