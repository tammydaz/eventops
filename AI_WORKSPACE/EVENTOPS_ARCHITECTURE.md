# EVENTOPS SYSTEM ARCHITECTURE

## Core Principle

The **Events table is the system brain**.

All operational logic flows from Events.

---

## Core System Tables

Events  
Menu Items  
Master Menu Specs  
BEOs  
Pack-Outs  
Staff  
Rentals  
Stations  
Service Ware  
Bar Components  

---

## Data Flow

Client Intake  
↓  
Event Record (Events table)  
↓  
Menu Selection (Menu Items)  
↓  
Spec Engine Calculations  
↓  
Pack-Out Generation  
↓  
Kitchen Prep  
↓  
Staff Assignment  
↓  
Event Execution  

---

## Menu Hierarchy Rules

Menu Items support parent-child relationships.

Parent Item prints normally.

Child Items:

• indent beneath parent  
• cannot reassign hierarchy automatically  
• are controlled through linked records

---

## Print Engine Rules

BEO printing follows strict structure:

Three-column layout.

Global BEO Notes block prints before the Timeline.

Designer notes must not print.

Menu hierarchy must be preserved in printed output.

---

## Spec Engine Rules

Spec calculations derive from:

• guest count  
• portion yield  
• service style  

Manual overrides always take priority over automated calculations.

---

## Pack-Out Rules

Pack-out logic derives from:

• menu selections  
• service vessels  
• event type  

Human placement is authoritative.

Automation may calculate quantities but must not rearrange placement.

---

## Schema Safety Rules

Never invent Airtable fields.

Never guess Airtable field IDs.

Always verify schema before referencing fields.

Events remains the authoritative source of truth.
