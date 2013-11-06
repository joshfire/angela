#!/usr/bin/env bash
set +e

PORT=8080
if [ -n "$1" ]
then
  PORT=$1
fi

# Ensure that all child processes get killed when script is killed
# and stop running server on the Android device
trap 'kill $(jobs -p); adb shell am force-stop org.openqa.selenium.android.app; killall adb' EXIT

adb logcat -c
adb shell am start -a android.intent.action.MAIN -n org.openqa.selenium.android.app/.MainActivity -W -S
adb forward tcp:${PORT} tcp:8080
adb logcat

set -e