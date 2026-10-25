# Privacy

> Draft. This page is shown in the app under Settings → Privacy from Phase 1 item 2, and the two must stay the same.

## What's stored

Everything you enter stays on this device, in the app's own storage (IndexedDB) in your browser. There's no account, no server and no tracking or analytics. The app's developer can't see your data.

Your theme choice and the debug-console switch are kept in the browser's local storage on this device.

## What's sent

Nothing, by default. The app makes no network requests except to download its own updates.

The one exception is optional and off by default: if you turn on photo meal recognition and add **your own** Google Gemini API key, the app sends food photos (shrunk to about 800 px wide) and your menu item names to Google's Gemini API. Nothing else is sent. On Gemini's free tier, Google may use what you send to improve its models. Your API key stays on this device and is never included in backups.

## Export or delete everything

- **Export:** Settings → Backup → Export saves one JSON file with all your data. Keep it somewhere safe, such as Files → iCloud Drive.
- **Delete:** Settings → Delete all data removes everything from this device after you type a confirmation. This can't be undone, so export a backup first if you might want your data back.

Deleting the Home Screen app, or clearing Safari's website data, also removes your data.

## Health note

Every number in Daily Quest is an estimate, not medical advice. If you have a medical condition, see a doctor before changing how you eat or train.
