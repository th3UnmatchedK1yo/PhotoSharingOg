# PhotoSharing

[![Build Status](https://img.shields.io/badge/build-passing-lightgrey?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge)](#license)
[![Tech Stack](https://img.shields.io/badge/stack-Expo%20%7C%20React%20Native%20%7C%20Supabase-lightgrey?style=for-the-badge)](#tech-stack)

A private, social scrapbook app where users capture "stamps" from camera moments, organize them by day, and design shareable collage projects for friends.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [App Preview](#app-preview)
- [Download APK](#download-apk)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

## Project Overview

PhotoSharing is an Expo + React Native application that combines:

- camera-based "stamp" capture,
- cloud upload + persistence,
- scrapbook-like visual editing,
- private friend sharing.

The app uses Supabase for authentication and data, Cloudinary for image uploads, and `expo-router` route groups for auth/protected navigation flows.

## Key Features

- 📸 **Stamp camera workflow** with custom crop/preview behavior and image processing before save.
- 📝 **Stamp review + metadata** flow (title and note) before uploading to cloud.
- 📚 **Book collections** grouped by day, with detailed day and single-stamp views.
- 🗓️ **Calendar view** that highlights dates containing saved stamps.
- 🎨 **Canvas-based editor** for scrapbook projects (stamps, text layers, assets, backgrounds).
- ☁️ **Cloud persistence** for projects, stamps, and profiles via Supabase.
- 🧑‍🤝‍🧑 **Friends system** with search, requests, accept/decline, and private social graph.
- 🔐 **Private sharing controls** to publish/unpublish specific projects to accepted friends.
- 🖼️ **Image upload pipeline** to Cloudinary for stamps, editor assets, and profile avatars.
- 👤 **Auth + profile setup gate** ensuring protected routes only load after setup completion.

## Tech Stack

### Languages

- TypeScript
- JavaScript

### Frameworks & Runtime

- Expo (SDK 54)
- React 19
- React Native 0.81
- Expo Router

### UI & Styling

- NativeWind
- Tailwind CSS
- React Native SVG
- React Native Gesture Handler
- React Native Reanimated

### Data, Auth, and Cloud

- Supabase (`@supabase/supabase-js`)
- Async Storage (session persistence)
- Cloudinary (direct image upload API integration)

### Expo / Device APIs

- `expo-camera`
- `expo-image-picker`
- `expo-image-manipulator`
- `expo-file-system`
- `expo-font`
- `expo-constants`
- `expo-updates`

### Tooling

- TypeScript compiler
- Prettier + `prettier-plugin-tailwindcss`
- EAS Build (`eas.json`)

## Getting Started

### Prerequisites

- Node.js 18+ (recommended LTS)
- npm
- Expo Go app (or Android/iOS emulator)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create `.env.local` in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

### 3) Run the app

```bash
npm run start
```

Then choose a target from the Expo CLI:

- press `a` for Android
- press `i` for iOS (macOS only)
- press `w` for web

You can also run directly:

```bash
npm run android
npm run ios
npm run web
```

## App Preview

Screens from a real phone session:

### Sign In

![Sign In Screen](C:/Users/Legion/.cursor/projects/c-Users-Legion-Documents-PhotoSharingOg-PhotoSharing/assets/c__Users_Legion_AppData_Roaming_Cursor_User_workspaceStorage_94fa25c4bda900e5ff4d3c6469f7564b_images_z7765390984434_0ae055ecbcaf6e3b36178d1fb61b45b5-37f266ec-bc86-45de-829d-0070e2a59ee7.png)

### Stamp Camera

![Stamp Camera Screen](C:/Users/Legion/.cursor/projects/c-Users-Legion-Documents-PhotoSharingOg-PhotoSharing/assets/c__Users_Legion_AppData_Roaming_Cursor_User_workspaceStorage_94fa25c4bda900e5ff4d3c6469f7564b_images_z7765390984435_0c2edf71fbc66b90595a499e199fc064-91d30f3f-78cb-41a1-b4ce-04eebbfcff8d.png)

### Collections

![Collections Screen](C:/Users/Legion/.cursor/projects/c-Users-Legion-Documents-PhotoSharingOg-PhotoSharing/assets/c__Users_Legion_AppData_Roaming_Cursor_User_workspaceStorage_94fa25c4bda900e5ff4d3c6469f7564b_images_z7765390987850_6d9b313dd277cb385a0c74d49a372880-73851717-0dcf-47a4-9900-c1608694ce54.png)

### Editor

![Editor Screen](C:/Users/Legion/.cursor/projects/c-Users-Legion-Documents-PhotoSharingOg-PhotoSharing/assets/c__Users_Legion_AppData_Roaming_Cursor_User_workspaceStorage_94fa25c4bda900e5ff4d3c6469f7564b_images_z7765390990708_f5fe92765522fd50eb5e1312fa8f72d0-bf691708-d6f5-4b76-adf4-f50f8b2658ee.png)

### Calendar

![Calendar Screen](C:/Users/Legion/.cursor/projects/c-Users-Legion-Documents-PhotoSharingOg-PhotoSharing/assets/c__Users_Legion_AppData_Roaming_Cursor_User_workspaceStorage_94fa25c4bda900e5ff4d3c6469f7564b_images_z7765390996607_6cf911338639feb1dc61cffe2b24d41e-39aca4d9-5181-40bd-8992-d21194ed4976.png)

### Profile Setup

![Profile Setup Screen](C:/Users/Legion/.cursor/projects/c-Users-Legion-Documents-PhotoSharingOg-PhotoSharing/assets/c__Users_Legion_AppData_Roaming_Cursor_User_workspaceStorage_94fa25c4bda900e5ff4d3c6469f7564b_images_z7765390996529_a29081c358811240a743b2f110b25bbf-15b40b06-2ea1-4a2b-a471-ee7c6ab1529b.png)

### Friends

![Friends Screen](C:/Users/Legion/.cursor/projects/c-Users-Legion-Documents-PhotoSharingOg-PhotoSharing/assets/c__Users_Legion_AppData_Roaming_Cursor_User_workspaceStorage_94fa25c4bda900e5ff4d3c6469f7564b_images_z7765390996733_38bfa573c04257f9848f13a7e3a2e1e4-7ffbfc12-0f16-4537-b1ca-4e003424901a.png)

### App Icon (On Device)

![App Icon on Phone](C:/Users/Legion/.cursor/projects/c-Users-Legion-Documents-PhotoSharingOg-PhotoSharing/assets/c__Users_Legion_AppData_Roaming_Cursor_User_workspaceStorage_94fa25c4bda900e5ff4d3c6469f7564b_images_z7765391006355_d97dd30bf71c18e93bafb50a7733232d-1351b55a-9943-4e3c-9ee3-bf14ede8bc1c.png)

## Download APK

Try the latest Android build here:

- [Download PhotoSharing APK](C:/Users/Legion/Downloads/application-9bede56c-0c2d-48e3-b1a5-f7d6f23c620c.apk)

> Note: This is a local file path on the author's machine.  
> For public readers (e.g., GitHub), upload the APK to a release or cloud storage and replace this link with a public URL.

## Environment Variables

The app reads these at runtime:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

## Available Scripts

From `package.json`:

- `npm run start` - start Expo development server
- `npm run android` - launch on Android
- `npm run ios` - launch on iOS
- `npm run web` - launch on web

## Project Structure

```text
PhotoSharing/
|-- assets/
|-- src/
|   |-- app/
|   |   |-- (auth)/
|   |   |   |-- _layout.tsx
|   |   |   |-- sign-in.tsx
|   |   |   `-- sign-up.tsx
|   |   |-- (protected)/
|   |   |   |-- _layout.tsx
|   |   |   |-- stamp/
|   |   |   |-- book/
|   |   |   |-- book-stamp/
|   |   |   |-- calendar/
|   |   |   |-- editor/
|   |   |   |-- friends/
|   |   |   `-- profile/
|   |   |-- _layout.tsx
|   |   `-- index.tsx
|   |-- assets/
|   |-- components/
|   |   |-- editor/
|   |   |-- shared/
|   |   `-- stamp/
|   |-- constants/
|   |-- lib/
|   |-- providers/
|   |-- services/
|   |-- types/
|   `-- utils/
|-- app.json
|-- babel.config.js
|-- eas.json
|-- package.json
|-- tailwind.config.js
`-- tsconfig.json
```

## Roadmap

1. **Add automated quality gates**: introduce lint/typecheck/test scripts and CI badges linked to real pipelines.
2. **Improve offline-first behavior**: queue uploads and draft edits locally when network is unstable, then sync in background.
3. **Enhance collaboration layer**: reactions/comments on shared projects and richer privacy controls per friend/group.

## License

No license file is currently defined in the repository. Add a `LICENSE` file (for example MIT) and update the badge/link above.
