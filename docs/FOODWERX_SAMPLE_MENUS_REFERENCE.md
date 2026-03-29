# FoodWerx Sample Menus Reference

## Overview
This document provides a centralized reference to FoodWerx public sample menus. These are marketing-facing menus and should be treated as SOURCE INPUT for the Menu Lab extraction process — NOT as structured system data.

## Canonical Page
https://foodwerx.com/sample-menus

## Menu Types

- Easter Menu
- Passover Menu
- Wedding Menu
- Social Events Menu
- Brunch Menu
- Appetizers & Stations
- Back In The Day Catering Classics
- Corporate Catering Menu
- Gluten Free Menu

## Usage Rules

- These menus are INPUT ONLY (human-readable)
- Do NOT treat these as structured data
- Do NOT assume consistency across menus
- Expect variation in wording, structure, and rules

## Workflow Integration

1. Extract raw menu text (Phase 1)
2. Store in AI_WORKSPACE/MENU_RAW_SOURCE.md
3. Convert to structured format (Phase 2)
4. Load into Airtable Menu Lab

## Maintenance

- Refresh links if website updates
- Do NOT download PDFs into repo (keep repo lightweight)
- Always reference this file for latest public menu structure

## Notes

This file exists to align:
- Claude (menu parsing)
- Cursor (implementation)
- ChatGPT (system design)

Single source for public-facing menu structure.
