# SottoSoglia — App Android & iOS

Budget tracking app with a monthly threshold. Built with Expo (React Native).

## Tech stack

- **Expo** ~52 + Expo Router
- **expo-sqlite** — offline-first local storage
- **Zustand** — state management
- **react-native-iap** — one-time in-app purchase
- **i18next** — Italian + English localization
- **EAS Build** — cloud builds (no Mac required)

## Features

| Feature | Free | Unlocked |
|---------|------|----------|
| Monthly threshold tracking | ✓ | ✓ |
| Add expenses (up to 5) | ✓ | ✓ |
| Recurring / one-time | ✓ | ✓ |
| Exclude from total | ✓ | ✓ |
| Multi-select + sum | ✓ | ✓ |
| Undo delete | ✓ | ✓ |
| Dark / light / auto theme | ✓ | ✓ |
| Unlimited expenses | — | ✓ |
| Filters | — | ✓ |
| CSV export / import | — | ✓ |

## Development

```bash
npm install
npx expo start
```

## Building

```bash
# Android (APK for testing)
eas build --platform android --profile preview

# Production
eas build --platform all --profile production
```

## Store setup

- Android: Google Play Console ($25 one-time)
- iOS: Apple Developer Program (€99/year) — EAS handles certificates without a Mac

## In-App Purchase

Product ID: `sottosoglia_unlock`

Register this product in both:
- Google Play Console → Monetization → In-app products
- App Store Connect → In-App Purchases
