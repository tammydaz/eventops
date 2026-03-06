# EventOps Architecture Doctrine
FoodWerx Operational System
Author: Tammy
Version: 1.0

---

# Core Philosophy

EventOps is not a simple catering management tool.

It is an operational system designed to manage the full lifecycle of catering events including:

• intake
• menu planning
• kitchen production
• pack-out logistics
• dispatch
• front-of-house service
• documentation
• post-event tracking

The system mirrors real-world operational workflows rather than forcing operations into software constraints.

---

# The Brain: Events Table (Single Source of Truth)

The Events table is the central system directory.

Everything in EventOps revolves around Events.

Events contains:

• event identity
• client & contact
• venue logic
• guest count
• menu selections
• service style
• staff roles
• dispatch timeline
• bar / hydration / coffee
• china / paper / serviceware
• pack-out flags
• kitchen flags
• readiness status lights
• notes
• print state
• audit logs

All other system components reference Events.

Nothing operates outside of an Event.

---

# Architecture Layers

EventOps follows a three-layer architecture:

DATA  
Structured records stored in Airtable.

LOGIC  
Derived calculations and operational rules including:

• spec engine
• pack-out rules
• health-light rules
• readiness gates
• automation triggers

PRESENTATION  
Interfaces and print documents.

Examples:

• client BEO
• kitchen BEO
• menu signs
• staff interfaces
• operational dashboards

Logic never alters the core data.

Presentation never contains hidden logic.

---

# Menu Item Architecture

Menu Items are the canonical food library.

Menu Items store:

• parent/child relationships
• dietary tags
• spec category
• operational notes
• print names
• service categories
• vessel types

Menu Items are templates.

Events apply Menu Items to specific events.

---

# Parent / Child Hierarchy

Menu Items support hierarchical relationships.

Parent Items represent the primary menu item.

Child Items represent:

• sauces
• toppings
• components
• variants
• side elements

Operational rules:

• Parent prints first
• Children print indented below
• Pack-out includes both
• Kitchen prep includes both
• Spec engine may treat children independently

---

# Spec Engine Philosophy

The Spec Engine calculates recommended quantities based on:

• guest count tiers
• menu item category
• vessel type
• FoodWerx heuristics
• historical patterns

Spec engine outputs include:

• food quantity
• pan counts
• chafer counts
• kitchen prep quantities

The Spec Engine never overwrites manual overrides.

Override hierarchy:

Industry baseline  
FoodWerx baseline  
Auto spec calculation  
Nick override (final authority)

---

# Pack-Out Logic

Pack-Out derives from menu selections and spec engine outputs.

Equipment rules include:

• Full pan → 1 chafer
• Two half pans → 1 chafer
• Round pan → round chafer
• Passed apps → plates + picks + garnish
• Build-on-site → alternate vessel logic
• Hydration / bar / coffee → required accessories

Pack-Out enforces item-level uniqueness.

---

# Operational Workflow

The EventOps workflow mirrors real catering operations.

1 Intake  
Client details and menu selections are entered.

2 BEO Compilation  
Structured event information generates the BEO.

3 Kitchen Production  
Kitchen receives prep instructions and specs.

4 Pack-Out Preparation  
Equipment and vessels are prepared.

5 Logistics / Dispatch  
Expeditor organizes loading and delivery.

6 FOH Execution  
Captains manage service and timeline.

7 Print Engine  
Documents generated for client and staff.

---

# Staff Interface Philosophy

Each role sees a dedicated interface.

Kitchen  
Prep checklist and production quantities.

Pack-Out Crew  
Equipment and vessel checklist.

Expeditor  
Dispatch order and truck loading.

Captain  
Timeline and service flow.

Admin  
Client documentation and approvals.

Staff do not interact directly with raw tables.

Interfaces are button-driven.

---

# Status Lights and Operational Gates

Event readiness is controlled through status gates.

Examples include:

• Intake Ready
• Kitchen Ready
• Pack-Out Ready
• Staff Ready
• Event Health Light

Certain requirements block progression:

• missing signature drink
• unresolved notes
• rental confirmation
• incomplete staffing

---

# Print System Philosophy

BEO documents are dynamically generated.

Rules include:

• collapse empty sections
• maintain strict section order
• indent parent/child menu items
• separate public vs kitchen documents

Page structure:

Page 1 — Event details and menu  
Page 2 — timeline, serviceware, notes

Kitchen BEO includes internal quantities.

Public BEO displays clean menu formatting.

---

# Operational Doctrine

EventOps follows several non-negotiable rules.

• Events table is the system brain.
• Schema integrity must be preserved.
• Field names and IDs cannot be guessed.
• Overrides always take priority.
• Staff interfaces never expose raw data.
• Dispatch time is the universal operational anchor.
• Timeline prints for all event types.

---

# Architectural Strengths

EventOps contains several unusually strong design elements:

1 Events table SSOT architecture  
2 Parent/child menu hierarchy  
3 Deterministic spec engine with override safety  
4 Status gates and audit trails  
5 Role-based operational interfaces  
6 Deterministic pack-out generation  
7 Clean print collapse system

---

# Design Philosophy

EventOps encodes real operational experience into software.

The goal is not automation for its own sake.

The goal is operational clarity, reliability, and repeatability.

The system supports human decision-making rather than replacing it.

The architect of this system is Tammy.

The software exists to execute the operational philosophy behind FoodWerx.
