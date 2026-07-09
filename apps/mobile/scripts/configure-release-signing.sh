#!/usr/bin/env bash
# Optional production signing for assembleRelease.
# If ANDROID_KEYSTORE_BASE64 is unset, Expo's default (debug) signing is used.
set -euo pipefail

ANDROID_DIR="${1:-android}"

if [[ -z "${ANDROID_KEYSTORE_BASE64:-}" ]]; then
  echo "No ANDROID_KEYSTORE_BASE64 secret — release APK signed with debug keystore (Expo default)."
  exit 0
fi

: "${ANDROID_KEY_ALIAS:?ANDROID_KEY_ALIAS is required when using a release keystore}"
: "${ANDROID_KEYSTORE_PASSWORD:?ANDROID_KEYSTORE_PASSWORD is required}"
: "${ANDROID_KEY_PASSWORD:?ANDROID_KEY_PASSWORD is required}"

echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > "$ANDROID_DIR/app/release.keystore"

cat >> "$ANDROID_DIR/gradle.properties" <<EOF
MYAPP_UPLOAD_STORE_FILE=release.keystore
MYAPP_UPLOAD_KEY_ALIAS=${ANDROID_KEY_ALIAS}
MYAPP_UPLOAD_STORE_PASSWORD=${ANDROID_KEYSTORE_PASSWORD}
MYAPP_UPLOAD_KEY_PASSWORD=${ANDROID_KEY_PASSWORD}
EOF

python3 <<PY
from pathlib import Path

android_dir = Path("${ANDROID_DIR}")
build_gradle = android_dir / "app" / "build.gradle"
text = build_gradle.read_text()

release_block = """
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }"""

if "MYAPP_UPLOAD_STORE_FILE" not in text:
    text = text.replace(
        "    signingConfigs {\n        debug {",
        f"    signingConfigs {{{release_block}\n        debug {{",
    )
    text = text.replace(
        "        release {\n            // Caution! In production, you need to generate your own keystore file.\n"
        "            // see https://reactnative.dev/docs/signed-apk-android.\n"
        "            signingConfig signingConfigs.debug",
        "        release {\n            signingConfig signingConfigs.release",
        1,
    )
    build_gradle.write_text(text)
    print("Patched android/app/build.gradle for release keystore signing.")
PY
