# NCH GPS Tracker — Assets

Place the following image files in this `/assets` directory before building:

| File | Size | Usage |
|---|---|---|
| `icon.png` | 1024×1024 px | App icon (iOS & Android) |
| `splash.png` | 1284×2778 px | Splash screen |
| `adaptive-icon.png` | 1024×1024 px | Android adaptive icon foreground |
| `favicon.png` | 48×48 px | Web favicon |
| `notification-icon.png` | 96×96 px | Android notification icon (white on transparent) |

## Design Specs

- Background color for splash: `#333788` (already set in app.json)
- Icon should feature the NCH logo or a navigation/GPS symbol on `#333788` background
- Notification icon must be **white silhouette on transparent background** (Android requirement)

## Quick Placeholder

For local development with `npx expo start`, Expo will use default placeholder images
if these files are missing. The app will still run — only the app icon and splash
will appear as generic Expo defaults until you add real assets.
