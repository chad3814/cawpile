# Initialization

## Feature Description

Monthly recap template system repository

## Context

This is for the Cawpile project - a book reading tracker with a custom CAWPILE rating system. The project already has:
- A video-gen service (services/video-gen) that renders Remotion videos for monthly reading recaps
- A monthly recap API endpoint (/api/recap/monthly) that gathers a user's monthly reading data
- A VideoTemplate Prisma model with admin CRUD API (/api/templates) for storing template configurations
- A template system in the video-gen service with type definitions, context providers, a template registry, config validation, and a default dark theme template
- Template configs support customizing colors (16 properties), fonts (3), timing (23 frame-based values), and per-sequence layout/style options for intro, bookReveal, statsReveal, comingSoon, and outro sequences

This spec appears to be about creating a template system/repository for the monthly recap videos - potentially a browsable collection of templates that users and/or admins can manage and select from.

## Date Initiated

2026-02-12
