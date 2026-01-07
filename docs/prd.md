# CSAT Dashboard – Product Requirements Document (PRD v2)

## Document Metadata

- Product: CSAT Dashboard
- Version: PRD v2
- Primary Stakeholders: Client Relations, All Departments, BI, Founders Office
- Reference:
  - v1 Website: https://csat.schbanglabs.com
  - Email: admin@mail.com
  - Password: Schbang@732

## Problem Statement

Client satisfaction data exists across brands, departments, and cycles, but without a unified system it is difficult to track coverage, identify underperforming SBUs early, and analyze trends over time. The CSAT Dashboard solves this by providing a single, reliable source of truth for CSAT performance, response coverage, and operational follow-ups.

## Goals & Objectives

- Provide real-time visibility into CSAT performance across departments and SBUs
- Track CSAT fill rates at brand and POC level
- Enable early identification of critical SBUs and declining trends
- Preserve historical CSAT data for audits and cross-cycle analysis
- Enable clean exports for leadership, operations, and BI teams

## Users & Personas

- Admin: Full access to all data, filters, and exports
- Leadership: View-only access for performance tracking and exports
- Client Relations / Ops: Track coverage, pending brands, and follow-ups
- BI Team: Consume BI Export for reporting and analytics

## In Scope

- CSAT performance tracking
- Coverage and fill-rate tracking
- Drill-downs from department to SBU to brand to response
- Historical cycle-wise data access
- CSV and BI exports

## Out of Scope (v2)

- Editing CSAT responses
- Sending reminders or notifications
- Predictive analytics or alerts
- Automated escalation workflows

## Purpose

This document explains everything the Tech team needs to build the CSAT Dashboard from scratch. It covers data models, calculations, filters, page-wise behavior, drill-down flows, and exports. The goal is functional parity with the current CSAT system.

## Core Concepts

### CSAT System Scope

The dashboard combines:

- Performance analytics (CSAT, NPS)
- Coverage tracking (brands filled, POC filled)
- Operational visibility (who responded, when, comments)

### Hierarchy (Top → Bottom)

Financial Year → Cycle → Department → SBU → Brand → POC → Individual CSAT Response

Cycles are first-class entities and data is preserved historically.

## Global Filters (Apply Everywhere)

- Department: All Departments or a specific department
- Year: e.g. 2025
- Cycle: Cycle 1 (May) through Cycle 6 (December)
- Show Unmapped Only: Shows brands without valid department/SBU mapping

Changing filters recalculates all metrics, tables, and exports.

## Main Dashboard (Overview)

### Top Summary Cards

#### 1. Brands Filled

- Count of unique brands that submitted CSAT in the selected scope
- Shows total brands mapped vs filled
- Remaining = Total mapped brands − Filled brands

#### 2. Overall CSAT

- Average CSAT score across all valid responses in scope
- Scale: 0–5

#### 3. Total POC Filled + Fill Rate

- Unique POCs who submitted CSAT
- Fill Rate = (Filled POCs ÷ Total mapped POCs) × 100

### Department Cards

Each department card shows:

- Total responses
- Average CSAT
- Fill rate
- Clickable navigation into department detail view

## Brands Filled Drill-Down

Triggered by clicking the Brands Filled card.

### Features

- Toggle: Filled / Unfilled
- Grouping: SBU-wise or Department-wise
- Brand search
- CSV export

### Logic

- A brand is considered Filled if it has ≥1 CSAT response in the selected cycle
- Ownership mapping (SBU / POC combinations) is displayed with counts

## Department Detail Page

Triggered by clicking a department card.

### Section 1: Department Summary

- Brands Filled vs Remaining (department-scoped)
- Overall CSAT (department average)
- Total POC Filled + Fill Rate

### Section 2: SBU Performance Table

Each row represents an SBU (or SBU combination).

#### Columns:

- SBU name + number of brands
- CSAT (average)
- NPS (average)
- Number of responses
- Trend indicator

#### Classification Rules

- Good: CSAT ≥ 3.75
- Average: CSAT ≥ 3.0 and < 3.75
- Critical: CSAT < 3.0

Tabs allow filtering SBUs by these states.

### Section 3: Department Records Table

Shows only brands that have filled CSAT.

#### Columns include:

- Brand
- Client POC
- Phone
- SBU / POD
- SPOC
- Email

#### Features:

- Search (brand or phone)
- Column toggling
- Pending departments filter
- CSV export
- Response count visibility

## SBU Detail Page

Triggered by clicking an SBU row.

### Header

- SBU name
- Total responses
- Average CSAT

### Filters

- Search by brand, phone, or comment
- Department selector
- Date range filter

### Table (Lowest Granularity)

Each row represents an individual CSAT response.

#### Columns:

- Department
- Brand
- POC
- Phone
- Submission date & time
- CSAT score
- NPS score
- Open-text comment

CSV export is available at this level.

## Recent Responses (Global)

Triggered from the Recent button on the main page.

### Behavior

- Shows latest CSAT responses across all departments
- Sorted by submission timestamp (most recent first)

### Features

- Search (brand, phone, comment)
- Department filter
- Date range filter
- CSV export

Uses the same response entity as SBU and department views.

## Global Search

### Behavior

- Search bar is global and ignores current cycle filter
- Searches across all historical data

### Output

- Results grouped cycle-wise
- Each row shows:
  - Brand
  - Department
  - SBU
  - POC
  - CreatedAt timestamp
  - Auto-calculated average score

This enables audits and cross-cycle comparisons.

## Data Model (Recommended)

### Core Tables

- Cycles (id, name, year, start_date, end_date)
- Departments (id, name)
- SBUs (id, name, department_id)
- Brands (id, name, department_id, sbu_id)
- POCs (id, name, phone, email)
- CSAT_Responses
  - id
  - brand_id
  - department_id
  - sbu_id
  - poc_id
  - cycle_id
  - csat_score (0–5)
  - nps_score
  - comment
  - created_at

## Key Calculations

- Overall CSAT: Average of csat_score across valid responses
- Department CSAT: Same, filtered by department
- SBU CSAT: Same, filtered by SBU
- Fill Rate (Brand): Filled brands ÷ total mapped brands
- Fill Rate (POC): Filled POCs ÷ total mapped POCs

Only one response per brand per cycle should be considered unless explicitly designed otherwise.

## Exports

### Standard CSV Exports

CSV export must respect:

- Current filters (cycle, year, department)
- Current scope (global, department, SBU)
- Visible columns

### BI Export (Special Case)

- A separate BI Export option exists on the dashboard.
- This export generates a custom, non-standard sheet specifically designed for the BI team.
- The structure, columns, joins, and logic for this export are intentionally different from standard CSV downloads.
- Do not assume or hardcode this logic.
- For the exact requirements, mappings, and calculation rules of the BI Export sheet, the Tech team must reach out to Raj before implementation.

## Non-Functional Expectations

- Filters must be backend-driven, not frontend-only
- All views must remain performant with historical data
- UI state should persist while navigating drill-downs

## Summary

This CSAT dashboard is a multi-layered analytical + operational system, not just a scorecard. Building it correctly requires:

- Strong relational data modeling
- Consistent aggregation logic
- Accurate drill-down behavior
- Full historical data access

This document should be treated as the single source of truth for rebuilding the CSAT dashboard.
