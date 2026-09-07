---
name: iSAVE Design System
description: Modern, clean, and high-contrast UI design system for iSAVE Media Downloader
colors:
  background: "#FAF9F5"
  surface: "#FFFFFF"
  surface-soft: "#F2F7F3"
  primary: "#0E2E1A"
  primary-hover: "#164327"
  primary-soft: "#E6F4EB"
  secondary: "#1F523A"
  accent: "#84E039"
  accent-soft: "#EAF8DF"
  accent-dark: "#6BC822"
  text: "#0E1F14"
  text-muted: "#3D4F42"
  border: "#D8E0DA"
  border-hover: "#B4C4B8"
  error: "#DC2626"
  error-bg: "#FEF2F2"
  error-border: "#FCA5A5"
  brand-youtube: "#FF0000"
  brand-tiktok: "#0E1F14"
  brand-instagram: "#E1306C"
  brand-facebook: "#1877F2"
typography:
  body:
    fontFamily: "Rethink Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System: iSAVE

## Overview

**Creative North Star: "The Frictionless Media Gateway"**

iSAVE mengadopsi estetika antarmuka bersih, tenang, dan kontras tinggi dengan warna dominan Deep Forest Green (#0E2E1A) dipadu aksen Electric Lime (#84E039). Desain memprioritaskan keterbacaan, fokus pada aksi utama (pengunduhan), dan rasa aman (privacy-first).

## Colors

### Primary
- **Deep Forest Green** (#0E2E1A): Warna utama untuk header, tombol utama, dan elemen penegasan.

### Secondary
- **Earthy Green** (#1F523A): Digunakan untuk status ikon, aksen pendukung, dan ring fokus.

### Accent
- **Electric Lime** (#84E039): Warna aksen tinggi untuk badge highlight dan elemen interaktif sekunder.

### Neutral
- **Warm Canvas** (#FAF9F5): Background utama aplikasi.
- **Pure White** (#FFFFFF): Surface kartu dan kontainer input.
- **Soft Muted** (#3D4F42): Warna teks penjelasan dengan rasio kontras WCAG AA.

## Typography

**Body Font:** Rethink Sans (sans-serif)

## Layout

Desain berpusat pada Single Workspace Card di bagian Hero, dengan navigasi atas sticky dan kisi 3-kolom untuk fitur dan langkah penggunaan.

## Shapes

- Corner radius menggunakan skala konsisten: 8px (sm), 12px (md), 16px (lg), 24px (xl), dan Pill (9999px).
