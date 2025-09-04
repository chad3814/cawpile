# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application built with TypeScript, TailwindCSS 4, and React 19. It uses the App Router architecture and is configured with Turbopack for fast development and builds.

## Common Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production with Turbopack  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### No Test Framework Configured
This project does not have any testing framework configured yet.

## Architecture & Structure

### File Structure
- `src/app/` - App Router directory containing pages and layouts
  - `layout.tsx` - Root layout with font configuration (Geist fonts)
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with TailwindCSS and CSS custom properties
- `public/` - Static assets (SVG icons)

### Configuration Files
- `next.config.ts` - Next.js configuration (minimal setup)
- `tsconfig.json` - TypeScript configuration with path mapping (`@/*` -> `./src/*`)
- `eslint.config.mjs` - ESLint configuration extending Next.js presets
- `postcss.config.mjs` - PostCSS configuration for TailwindCSS

### Key Technologies
- **Next.js 15** with App Router and Turbopack
- **React 19** for component rendering
- **TypeScript** with strict mode enabled
- **TailwindCSS 4** for styling with PostCSS plugin
- **Geist fonts** (sans and mono) loaded via `next/font/google`

### Styling System
- Uses TailwindCSS with custom CSS properties defined in `globals.css`
- Dark mode support via `prefers-color-scheme`
- Custom color variables: `--background`, `--foreground`
- Font variables: `--font-geist-sans`, `--font-geist-mono`

## Development Notes

- The project uses absolute imports with `@/` prefix for `src/` directory
- TailwindCSS is configured with inline theme definitions
- ESLint ignores build directories and generated files
- No custom Next.js configuration beyond defaults