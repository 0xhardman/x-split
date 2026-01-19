# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

X-Split is a client-side web tool for splitting long images into multiple segments optimized for seamless Twitter/X display. When users post multiple images on Twitter, the platform displays them with gaps between segments. This tool removes content from the gap regions so images appear continuous when viewed on Twitter.

## Commands

- `npm run dev` - Start development server (Next.js)
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm start` - Start production server

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- JSZip for bundling downloads

## Architecture

### Core Image Processing (`lib/splitImage.ts`)

The splitting algorithm accounts for Twitter's display gaps:
- Twitter displays multi-image posts with gaps (16px mobile, 57px desktop)
- The tool crops source images to a target aspect ratio that includes gap space
- Content at gap positions is discarded so the final image appears seamless on Twitter
- Output segments: 556×253px each

Key functions:
- `getTargetDimensions()` - Calculates total dimensions including gap space
- `calculateFitCrop()` - Center-crops source to target aspect ratio
- `splitImage()` - Main processing: crops, scales, splits into segments (removes gap regions)

### Component Structure

- `app/page.tsx` - Main page, manages state (image, segments, mode)
- `components/ImageUploader.tsx` - Drag-and-drop file input
- `components/ControlPanel.tsx` - Mode (mobile/desktop) and segment (2/3/4) selection
- `components/SplitPreview.tsx` - Preview with simulated gaps, download functionality

### Styling

- Dark theme with CSS custom properties in `globals.css`
- Fonts: Syne (display), DM Sans (body)
- Accent color: #00d4ff (cyan)

## Key Concepts

**DisplayMode**: `'mobile' | 'desktop'` - Determines gap size (16px vs 57px)

**Segments**: 2, 3, or 4 - Number of output images

**Gap removal**: The tool removes portions of the source image that would fall in gap regions, so when Twitter adds its visual gaps, the content flows seamlessly.
