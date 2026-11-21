# Changelog

Every HelpHive Android release, newest first. Each GitHub release's notes come from its section here.

**Version numbers.** `1.N.0` is Production N: it adds or changes features. `1.N.1`, `1.N.2` and so on are fix-only builds
of Production N. A test build before a release is `1.N.0-beta.K`. Profile → App version shows the version and, in
brackets, the build number, which only ever goes up. Releases up to Production 14 all reported version 1.0.0.

## 1.15.0 (Production 15), 2026-11-21

### Changed

-   The demo accounts are now `user@helphive.himaiz.com` and `provider@helphive.himaiz.com`. The demo tiles on the
    sign-in screen use them. Older app versions still sign in with the previous addresses.
-   The app reports its real version, 1.15.0, in Profile → App version and in error reports, instead of 1.0.0.

## 1.14.0 (Production 14), 2026-11-20

Reported as version 1.0.0 (build 24).

### Added

-   Providers stay online with the app closed: "New job available" arrives as a push notification until they switch
    off or sign out. Switching on sends a "You're online" push.
-   Booking cards in chat when a booking is accepted, started, completed or cancelled, with the current booking shown
    under the chat header.
-   Dark mode (Profile → Appearance: System, Light or Dark). The splash screen and the date and time pickers follow it.
-   A download for phones only (`helphive-phones.apk`), about 52 MB.

### Changed

-   If a provider accepts a booking but never starts it, it is cancelled and the customer is refunded in full after the
    shift ends.
-   The provider switch shows the real state; if switching off can't reach the server, it stays on and says so.
-   Service choices are tick-box tiles; demo accounts are two tiles on the sign-in screen, which fits one screen.
-   The phones download is about 23 MB smaller than Production 13's.
-   Expo SDK 58, React Native 0.88 (New Architecture) and React Navigation 7.

## Production 13 and earlier

See the [GitHub releases](https://github.com/Helphive/helphive-app/releases) from `production-07` to `production-13`.
