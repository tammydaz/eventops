# BEO Analysis — foodwerx Historical BEO Audit
**Files analyzed:** 43 files  
**Date:** March 2026  
**Scope:** DELIVERY (15), Full Service (15), PICKUP (5), IN HOUSE (3), Weddings (5), Mitzvahs (2), Multi-BEO events (Rutgers x4)  
**Date range covered:** May 2025 – March 2026

---

## Executive Summary

These 43 BEOs represent a well-run, consistent catering operation with a strong, recognizable menu identity. The same core items appear across nearly every event — Cheesesteak Dumplings, Beignets, Artisan Rolls with Herb Infused Butter, Thai Sesame Noodles, Mini Cookies — and they're named the same way every time. That consistency is a genuine operational strength and is rare. Staff clearly know the menu cold.

The biggest structural weakness is **quantity documentation**. Many items on delivery BEOs have no quantity written — the weight, count, or volume is in the preparer's head but not on paper. This creates risk any time a new person preps an order or when a regular preparer is unavailable. The app has a direct opportunity to fix this.

The second major gap is **allergy and dietary information**. Allergies appear as shouted text in special notes ("ALLERGY - COCONUT, PORK & EGG!!") rather than as a structured field that gets reviewed before production. For a company serving allergen-sensitive clients repeatedly, this is the highest-risk finding in the entire audit.

The serviceware communication system (BUFFET-METAL, BUFFET-CHINA, PASSED APPS-METAL, DESSERT-CHINA, DISPOSABLE) is clear and consistent. Kitchen and service staff can immediately understand what goes where and in what vessel. This is well-designed.

The BEO has grown organically and does its job, but it's a production sheet, not an intake tool. The EventOps app is the right next step — the findings below are a direct roadmap for what it needs to capture.

---

## FINDING CATEGORY 1: Spec Accuracy & Portioning Logic

### F1-1: Many delivery items have no quantity written at all
**Observed in:** Files 1, 6, 7, 14, 16, 17, 18, 19, and others  
**Finding:** Numerous menu items appear with just their name and no quantity. For example, Samaritan Hospice (30 guests) lists "Beignets", "Chocolate Covered Strawberries", "Decadent Dessert Display" with no weight, count, or volume. The quantity is clearly known by the person who built the BEO — it's just not written down.  
**Operational impact:** If the regular preparer is out sick, anyone else prepping this order has to guess or call someone. For recurring clients where the order is similar every week, this is manageable until it isn't.  
**Recommendation:** The app should require at least a quantity and unit for every menu item before the BEO can be submitted. Even a simple "30 pcs" or "4#" is enough. No blank quantity fields.

### F1-2: Three different unit systems are used inconsistently
**Observed in:** All files  
**Finding:** Quantities are expressed in three different systems with no standardization:
- **Weight**: `6#`, `3#`, `4# BELL POT`, `2.5#`, `9# 18in` 
- **Count/pieces**: `30`, `70 pcs`, `90 PCS`, `12 cut in 3`
- **Volume/container**: `QT`, `2 QT`, `HOTEL`, `3 HOTEL`, `1/2 FOIL`, `LRG OCT`, `GALLON`

The same item might be spec'd by weight at one event and by count at another. "Marinated Grilled Vegetables" appears as `4#` in one BEO and as `HOTEL` in another.  
**Operational impact:** Inconsistent units make it harder to cost-check, harder to scale for new guest counts, and harder to verify specs against what actually left the kitchen.  
**Recommendation:** The app should enforce a unit of measure per item category. Salads/displays → pounds or ounces. Passed apps → piece count. Hot items → hotel pan size. The app already tracks menu items — the unit can be set per item in the menu catalog.

### F1-3: Multi-pan notation (e.g., "4+4+4") is not documented anywhere
**Observed in:** Files 22, 38, 39, 40 (weddings and large FS)  
**Finding:** Large full service events use notation like `4+4+3`, `5+4+3+2`, `3+2+1`, `1+1+6` to indicate how items are split across multiple hotel pans or passes. There's no explanation of what this notation means — you have to already know.  
**Operational impact:** A new staff member or kitchen intern reading "4+4+3" next to "Herb Roasted Chicken Breasts" has no idea if that means 3 hotel pans, 3 delivery waves, or something else entirely.  
**Recommendation:** The app should have a "servings/containers" field that's explicit: "3 hotel pans" or "split across 3 passes." The notation format should be documented in a legend or replaced with labeled fields.

### F1-4: Guest count is recorded but rarely tied directly to item quantities
**Observed in:** All files  
**Finding:** Guest count appears near the top of every BEO (TD Bank: 20 guests, Rotary Club: 82 guests, Rox Wedding: 100 guests). But the quantities listed on the BEO below are not visibly calculated from that number — there's no spec ratio shown. You can't look at the BEO and verify "yes, 90 pieces of shrimp is correct for 82 guests."  
**Operational impact:** This makes it impossible to audit spec accuracy or catch under/over-ordering without doing the math yourself. For a company scaling to handle more volume, this will become a problem.  
**Recommendation:** The app's spec engine (which is already partially built) should display the target quantity next to each item based on guest count × ratio. If the preparer enters a different quantity, the app should note the variance. This is the core purpose of the spec engine.

---

## FINDING CATEGORY 2: BEO Structure & Readability

### F2-1: The serviceware system (METAL / CHINA / DISPOSABLE) is the best-designed part of the BEO
**Observed in:** All FS files  
**Finding:** Every food section is labeled with both service type AND vessel: `PASSED APPS - METAL`, `BUFFET - CHINA`, `DESSERT - METAL`, `PRESENTED APPS - CHINA/METAL`, `HOT - DISPOSABLE`. This is unambiguous. Staff can immediately set up the correct vessels for each section.  
**Operational impact:** Clear and effective. This system works.  
**Recommendation:** Keep this exactly as-is in the app. This is a model worth preserving and extending. The `BUFFET METAL/CHINA` and `PRESENTED APPETIZER` placement options already in the station config modal are the correct continuation of this system.

### F2-2: Timing is scattered throughout the BEO with no dedicated timeline section
**Observed in:** Files 16, 17, 22, 23, 27, 28, 29, 38, 39, 40  
**Finding:** Event timing appears in multiple places — sometimes in the client header area, sometimes embedded in section labels, sometimes as standalone rows. From File 17 (Rotary Club MCH): `5:30PM` (arrival), `8PM` (dessert), `10:00PM` (end) are spread across 3 different rows with no timeline structure. Wedding BEOs are worse: `2PM`, `3PM`, `5PM`, `10PM` appear as single-cell rows scattered down the sheet with no label saying what happens at each time.  
**Operational impact:** Staff have to read the entire BEO to reconstruct the timeline. For a new employee or a large complex event, this creates real risk of missing a service window.  
**Recommendation:** The app already has a Timeline section — this finding confirms it was the right call. Key fields needed: staff arrival, food setup complete, cocktail hour start, dinner service start, dessert service, event end. All in one place, in order.

### F2-3: Staff assignment is by initials only
**Observed in:** All files  
**Finding:** Every BEO has staff initials: `JM`, `JV`, `JA`, `NM`, `NM/JM`, `Laurie & Katie`, `Leslie & Staff`, `Rita & Staff`. Some have full names, others just initials. There's no phone number, no role, no count of how many staff are assigned.  
**Operational impact:** For the person who built the BEO, the initials are perfectly clear. For anyone else — someone covering a shift, a kitchen manager, a driver — "JM" means nothing. Some events do better: "2 CHEFS, 4 SERVERS, 2 BARTENDERS, UTILITY" (Rotary Club MCH) is excellent — that gives the full picture.  
**Recommendation:** The app should have explicit staff fields: lead staff name (full), number of servers, number of chefs, number of bartenders. The Rotary Club format is the standard to aim for.

### F2-4: Special notes are the catch-all for everything urgent — which dilutes their urgency
**Observed in:** All files  
**Finding:** Special notes contain a mix of: critical allergen warnings, payment reminders ("COLLECT CHECK!"), staff payment instructions ("SERVER WILL BE PAID DIRECTLY IN CASH"), operational reminders ("BRING LIGHTER FOR STERNO"), VIP flags ("MUST BE PERFECT!!"), sales event instructions ("NO LABELS/WRITING/OR ADHESIVE MATERIALS!!"), and venue-specific logistics ("NO DELIVERY BEFORE 6AM"). Everything urgent and everything routine lands in the same box.  
**Operational impact:** When everything is a note, nothing stands out. A critical allergen warning buried after a payment reminder is a risk.  
**Recommendation:** The app should break special notes into typed categories: Allergen Alert (bright red, required acknowledgment), VIP/Presentation Flag, Delivery Instructions, Payment Notes, Kitchen Notes. Urgency should be visual, not just capitalization.

---

## FINDING CATEGORY 3: Station Setup Patterns

### F3-1: Chef-attended stations are noted but never specified in detail
**Observed in:** Files 22, 23, 28, 38, 39 (weddings and large FS)  
**Finding:** Chef-attended stations appear as "CHEF ATTENDED PASTA STATION" or "STREET FOOD STATION" in the BEO, but there's no documentation of: what the chef needs at the station (equipment, utensils, mise en place), how long the station runs, or when it starts/ends. The station gets the same treatment as a buffet item — just a label and some items listed.  
**Operational impact:** A chef staffing a pasta station for the first time at a new venue has to figure out setup on the fly because the BEO doesn't describe it.  
**Recommendation:** This is exactly what the Station Components Config Modal is for. For chef-attended stations, the BEO should output: station name, items, setup notes, staffing requirement, timing window. The app's station presets should include a "Notes to Chef" free-text field.

### F3-2: Station items are listed but equipment requirements are not
**Observed in:** Files 11, 12 (Caviar LA), 22 (Rox Wedding), 27 (Teamsters)  
**Finding:** Notes like "BRING WATER FOR CHAFERS", "WIRE RACK", "WATER PAN", "BRING LIGHTER FOR STERNO" appear repeatedly. These are equipment items required for proper station setup that keep surfacing as reminder notes because they're not systematically tracked.  
**Operational impact:** These things get forgotten. The sterno lighter appearing repeatedly as a note suggests it has been forgotten before.  
**Recommendation:** The app's station config should have a checklist for equipment: chafers (yes/no), sterno count, wire racks, water pans. These should auto-generate to the pack-out list, not live as notes someone might miss.

---

## FINDING CATEGORY 4: Menu Item Naming & Consistency

### F4-1: Core menu items are named with remarkable consistency — this is a real strength
**Observed in:** All files  
**Finding:** The following items appear across many events with identical names every time:
- Cheesesteak Dumplings w/ Sriracha Ketchup
- Thai Sesame Noodles (in Mini Chinese Take-Out Container)
- Beignets
- Mini Cookies
- Fudge Brownies & Assorted Bars
- Mini Cannolis
- Chocolate Covered Strawberries
- Artisan Rolls w/ Herb Infused Butter
- Marinated Grilled Vegetables
- Decadent Dessert Display
- Caprese Skewers
- Bacon Wrapped Scallops
- Jumbo Lump Mini Crab Cakes  

**Operational impact:** Positive. Staff know these items by heart. Kitchen knows exactly how to make them. Menu consistency reduces errors.  
**Recommendation:** These items are already in the Airtable menu catalog. The app should ensure any item in the catalog can only be added with its canonical name — no freeform text for standard items. Spelling variations cause confusion.

### F4-2: Sauces, dips, and accompaniments are consistently paired but sometimes orphaned
**Observed in:** Files 2, 9, 17, 21, 22  
**Finding:** Cheesesteak Dumplings are virtually always listed with "w/ Sriracha Ketchup." Caprese Skewers with "Reduced Balsamic Vinaigrette." Crab Cakes with "Chipotle Aioli." But occasionally an accompaniment appears as a separate line item without clear visual connection to its parent food. In extracted text, "w/ Chipotle Aioli" appears as a standalone row, making it ambiguous what it goes with.  
**Recommendation:** In the app, sauces/accompaniments should be child items of their parent, not standalone entries. The BEO print should show them indented under the item they belong to.

### F4-3: Allergy variants of standard items are noted inline but inconsistently
**Observed in:** Files 9, 11, 20  
**Finding:** Allergy modifications appear different ways: "(Gluten Free)" after an item name, "NO CHEESE", "NO PEANUTS", "NO BACON!!", "KEEP SEPARATE!! ALLERGY!!" as a standalone note. There's no consistent format.  
**Recommendation:** Each menu item in the app should have an allergy/modification field. "Gluten Free version" should be a tagged variant, not a text note. The BEO print should make allergy variants visually distinct (colored or boxed).

---

## FINDING CATEGORY 5: Service Type Patterns

### F5-1: Delivery events have a tight, predictable structure — nearly a template
**Observed in:** Files 1–15, 31–37  
**Finding:** Delivery BEOs follow a consistent pattern: CLIENT INFO → SPECIAL NOTES → one or two food sections (DELI, KITCHEN, HOT, BREAKFAST) with DISPOSABLE serviceware → SALAD section → optional DESSERT section → PAPER PRODUCTS & BEVERAGES section. The paper products section always lists counts for plates, forks, knives, teaspoons, napkins, tongs, and serving spoons.  
**Operational impact:** This predictability is a strength. Pack-out is systematic.  
**Recommendation:** The app's delivery BEO should mirror this template structure exactly. The Paper Products section in particular should auto-calculate quantities from guest count (the counts in the BEOs roughly follow: plates = guest count + buffer, napkins = 1.5× guest count).

### F5-2: Full service events have far more complexity but the BEO structure is the same
**Observed in:** Files 16–30, 38–40  
**Finding:** Full service events add: passed apps, presented apps, multiple buffet sections (metal AND china), chef stations, dessert station, coffee setup, bar coordination, hydration station, vendor meals, and a full staff list. Yet the BEO format is essentially the same Excel template stretched to accommodate this complexity. Wedding BEOs (Rox Wedding at 100 guests, Howard & Jane at 104 guests) are significantly more complex than the template was designed for.  
**Recommendation:** The app should have distinct templates for DELIVERY and FULL SERVICE. Full service should have dedicated sections for: Passed Apps, Presented Apps, Buffet (Metal), Buffet (China), Stations, Dessert Station, Coffee Setup, Bar Notes, Staff List, Timeline. These sections are already partially in the app — this confirms the direction is right.

### F5-3: Pickup events are minimal and often personal
**Observed in:** Files 31–35  
**Finding:** Pickup orders tend to be small (3–25 guests), personal clients (Deb Wall, Nina Gutierrez, Jasmine Toner), and have minimal BEO content. The most common special note is absent — there's very little to communicate because pickup is "customer collects, customer reheats."  
**Key finding:** Only ONE pickup BEO explicitly says "SEND REHEATING INSTRUCTIONS!!!!" (Nina Gutierrez). Others that involve hot food (Egg Frittata, Potatoes) don't mention reheating at all.  
**Recommendation:** Any pickup order containing hot food should automatically trigger a reheating instructions card. The app should detect hot food items and prompt for reheating guidance.

---

## FINDING CATEGORY 6: Client & Event Type Patterns

### F6-1: Several clients are recurring weekly — they need a template/duplicate function
**Observed in:** Files 1, 7 (Samaritan Hospice appears twice in the same week); Hampton Behavioral Health appears multiple times; Knowles Science Foundation appears 3 times in the sample  
**Finding:** Samaritan Hospice appears in both File 1 (030326) and File 7 (Hampton Behavioral appears 3 times across May). These are effectively standing orders with minor variations. Each time a new BEO is built from scratch.  
**Operational impact:** Building the same order from scratch weekly wastes time and introduces variation where there should be none.  
**Recommendation:** The app should have a "Duplicate Event" function that copies a previous event's menu and settings as a starting point for a new date. This would directly save time for recurring accounts.

### F6-2: Venue codes in the BEO name carry important operational meaning
**Observed in:** Files 20 (CKA), 17, 24, 28 (MCH), 22, 29 (CCBH/BCAC), 30, 41, 42, 43 (Freedom Mortgage Pavilion)  
**Finding:** The filename convention `[DATE]-[NUM] [CLIENT] [VENUE] [TYPE]` packs a lot of information. MCH = Moorestown Community House (has its own china and glassware — "IN HOUSE CHINA/CUTLERY/GLASSWARE"). CKA = Kol Ami (kosher-style requirements, no pork). BCAC/CCBH = specific venues with their own setup requirements.  
**Operational impact:** Venue-specific requirements (in-house equipment, kosher protocol, outdoor vs. indoor, kitchen access) are embedded in the code but not documented in the BEO itself.  
**Recommendation:** The app should have a Venue field linked to a venue profile that auto-populates relevant notes: "MCH provides china and glassware", "CKA = kosher-style (no pork/shellfish mixing)", "Outdoor venue — bring water buckets for chafers." These notes should appear automatically when the venue is selected.

### F6-3: Multi-BEO events (Rutgers Graduation) show the need for event grouping
**Observed in:** Files 30, 41, 42, 43  
**Finding:** Rutgers Graduation generated 4 separate BEOs across 2 days (May 20 FS1, FS2; May 21 FS1, FS2) for the same client (Jane Caputo, Freedom Mortgage Pavilion, Camden). Each BEO is a standalone document but they're clearly part of one engagement.  
**Recommendation:** The app should support event groups — a parent event with multiple child BEOs. The parent holds the client, venue, and date; each child is a separate service window. This is how large multi-day engagements should be managed.

---

## FINDING CATEGORY 7: Operational Gaps & Risks

### F7-1: ALLERGEN ALERTS — highest risk finding
**Observed in:** Files 9, 11, 20, 40  
**Finding:** Critical allergen information is written in all-caps in special notes:
- File 9: "ALLERGY - COCONUT, PORK & EGG!!"
- File 11: "GLUTEN FREE!!!" (repeated 3 times across different sections)
- File 20: "NO PEANUTS - SEVERE ALLERGY!! NO CROSS CONTAMINATION!!"
- File 40: "NUT ALLERGY - NO NUTS IN ANYTHING!!" (repeated 3 times)  

These are life-safety items being communicated through the same text field as "bring the lighter for the sterno."  
**Operational impact:** A kitchen team member in a rush could skip reading the special notes. A severe peanut allergy noted in text is not the same as a bright red banner that must be acknowledged before production starts.  
**Recommendation:** The app MUST have a dedicated Allergen Alert section that: (1) appears at the top of every print view, (2) is colored red, (3) requires confirmation before the BEO can be marked as sent to BOH. This is non-negotiable.

### F7-2: "BRING LIGHTER FOR STERNO" — equipment is forgotten regularly
**Observed in:** Files 2, 11  
**Finding:** "BRING LIGHTER FOR STERNO" appears as a special note, suggesting it gets forgotten enough to warrant writing it down repeatedly.  
**Recommendation:** Equipment pack-out (lighters, water for chafers, wire racks, extension cords) should be a checklist section generated from the BEO, not freeform notes. If sternos are ordered, the app automatically adds "lighter" to the pack-out list.

### F7-3: Payment and staff payment notes appear in food BEOs
**Observed in:** Files 19, 34  
**Finding:** "SERVER WILL BE PAID DIRECTLY IN CASH FOR SHIFT - COLLECT CHECK FOR THE EVENT" and "COLLECT CHECK! INVOICE ATTACHED!" appear directly in BEOs.  
**Recommendation:** Payment status and instructions should be a separate field in the event record, not embedded in the operational BEO. Kitchen and service staff don't need to know payment details; owners/managers do.

### F7-4: Sales tastings need a completely different BEO format
**Observed in:** File 31  
**Finding:** "FOR SALES/MARKETING. NO LABELS/WRITING/OR ADHESIVE MATERIALS!!" — a sales tasting event has the same BEO format as a delivery, but with critical presentation requirements that don't fit any standard field.  
**Recommendation:** The app should have a "Tasting/Sales Event" flag that triggers: no labels, premium presentation notes, no foodwerx branding on packaging. This is a distinct event type with its own operational requirements.

---

## FINDING CATEGORY 8: Opportunities for the App

### F8-1: Allergen Alert as a first-class top-of-BEO field
No more buried text. Bright red. Required before BOH submission. (See F7-1)

### F8-2: Dedicated Delivery Time Window field
Every delivery BEO has a time like "7:30-7:45AM DELIVERY." This should be a structured field — arrival time + window — that drives scheduling, not a text note.

### F8-3: Hot Delivery flag
"SEND HOT!!" and "DELIVER HOT!!" appear repeatedly. This should be a checkbox that affects how the kitchen stages the order, not a note.

### F8-4: Equipment pack-out checklist auto-generated from BEO
Based on items ordered: if sternos → lighter on list. If chafers → water + water pan. If outdoor venue → extension cord prompt. This eliminates the "BRING LIGHTER" problem permanently.

### F8-5: Venue profiles
Venue = MCH → auto-note: client provides china and glassware. Venue = CKA → kosher-style flag. Outdoor venues → chafer water reminder. This saves setup mistakes at familiar venues.

### F8-6: Duplicate Event / Standing Order
Samaritan Hospice, Hampton Behavioral, Knowles Science — recurring weekly clients who order nearly the same thing. One-click duplicate from last order saves time and reduces variation.

### F8-7: Reheating Instructions auto-prompt for pickup with hot items
If event type = PICKUP and any hot food item is in the order, the app prompts for and attaches reheating instructions.

### F8-8: Multi-BEO event grouping
For clients like Rutgers Graduation with multiple BEOs, a parent event record with child BEO records tied to it. Rolled-up view of what's going to a single client across multiple services.

### F8-9: Staff count as structured fields
Lead (name), chefs (count), servers (count), bartenders (count), utility (count). Not initials in a text field.

### F8-10: Vendor/staff meals as a separate count
"THERE WILL BE 3 VENDORS EATING FROM BUFFET" affects spec quantities but doesn't appear in guest count. The app should have a separate "vendor/vendor meals" count that adds to the spec calculation.

### F8-11: VIP/Presentation tier flag
"HIGH GARNISH*", "ORDER MUST BE PERFECT!!", "EXTRA, EXTRA FLAIR & GARNISH!!" — these need to be a field (Standard / Premium / VIP) that communicates presentation expectations to kitchen.

---

## Raw Event Summary

| # | File | Type | Guests | Notable |
|---|------|------|--------|---------|
| 1 | Samaritan Hospice | DELIVERY | 30 | Recurring client, buffet disposable, hot delivery |
| 2 | Amicus (AM) | DELIVERY | 35 | CEO/Board breakfast, china, bring menu cards |
| 3 | Amicus (Lunch) | DELIVERY | 35 | Deli/sandwich, china, heart healthy wraps |
| 4 | TD Bank (AM) | DELIVERY | 20 | Breakfast bagels, standard paper |
| 5 | TD Bank (Lunch) | DELIVERY | ~20 | Deli disposable, boxed lunch style |
| 6 | Stephano Slack | DELIVERY | 10 | Hot, sternos, send hot |
| 7 | Hampton Behavioral | DELIVERY | 25 | Early morning (4:45AM), breakfast, hot |
| 8 | LDV Law | DELIVERY | 10 | Lunch deli, small order |
| 9 | Knowles Science 1 | DELIVERY | 17 | Allergy: coconut/pork/egg, deli |
| 10 | Knowles Science 2 | DELIVERY | 20 | BBQ/ribs kitchen, dessert display |
| 11 | Caviar LA 1 | DELIVERY | 90 | 6AM no early, FDR Park, GF, water for chafers |
| 12 | Caviar LA 2 | DELIVERY | 45 | Same client, lunch follow-up, steak marsala |
| 13 | McKesson | DELIVERY | 20 | Panini + cheesesteaks, deli + hot |
| 14 | Traditions | DELIVERY | 31 | "MUST BE PERFECT!!", deli, social committee |
| 15 | Knowles Science 3 | DELIVERY | 17 | Philly cheesesteaks, complex deli |
| 16 | Meghan Newsome | FS | 28 | "HIGH GARNISH!!", presented apps, china |
| 17 | Rotary Club MCH | FS | 82 | Passed apps, charcuterie, full buffet, 2 chefs 4 servers |
| 18 | Melissa Coulombe | FS | 16 | Passed apps china/metal, complex upscale |
| 19 | Maria McCabe | FS | 80 | Presented apps, load up roll out |
| 20 | Brian Weingart CKA | FS | 40 | Mitzvah luncheon, no peanuts severe allergy |
| 21 | Janine Senese | FS | 27 | Full service dinner, presented + buffet |
| 22 | Rox Wedding CCBH | FS | 100 | Full wedding, street food station, complex |
| 23 | Rox Engagement | IN HOUSE | 40 | Chef pasta station, charcuterie, engagement party |
| 24 | Doyinsola Ogunsami | FS | 70 | MCH venue, West African inspired, full service |
| 25 | Antonia Petrongolo | FS | 25 | Brunch, breakfast buffet |
| 26 | Nancy Delvechio | FS | 33 | Brunch/lunch hybrid |
| 27 | Teamsters 676 | FS | 100 | Lunch, meeting format, food ready by 10AM |
| 28 | Monica Choi MCH | FS | 40 | Street food station, charcuterie, IN HOUSE china |
| 29 | Rox Wedding BCAC | FS | 49 | Wedding BBQ outdoor |
| 30 | Rutgers Grad FS1 | FS | 20 | Backstage catering, Freedom Mortgage Pavilion |
| 31 | Sales & Marketing | PICKUP | 6 | NO LABELS - sales tasting |
| 32 | Deb Wall | PICKUP | — | Minimal, chips + green goddess |
| 33 | Tasting PICK UP | PICKUP | 3 | Kosher-style tasting, WOW garnish |
| 34 | Jasmine Toner | PICKUP | 20 | Thai noodles, collect check |
| 35 | Nina Gutierrez | PICKUP | 15 | Breakfast pickup, SEND REHEATING INSTRUCTIONS |
| 36 | Reilly McDevitt | IN HOUSE | 25 | Law firm, specialty platter, deli |
| 37 | Lassonde Pappas | IN HOUSE | 6 | Small corporate, deli only |
| 38 | Javier & Lourdes | WEDDING FS | 57 | Passed apps, All-American station, full wedding |
| 39 | Howard & Jane MCH | WEDDING FS | 104 | Complex wedding, pasta flight, multiple stations, 10 kids meal |
| 40 | Ashley & Paul | WEDDING FS | ~75 | NUT ALLERGY SEVERE, Build Your Own Ice Cream Bar |
| 41 | Rutgers Grad FS2 | FS | 3 | Small backstage, strict no strawberry allergy |
| 42 | Rutgers Grad FS1 | FS | 35 | Breakfast china, bagels, pastry |
| 43 | Rutgers Grad FS2 | FS | 35 | Snacks china, charcuterie, tastykakes |

---

## Priority Order for App Development Based on This Analysis

1. **Allergen Alert section** — life safety, highest priority
2. **Quantity required on all items** — closes the biggest operational gap
3. **Venue profiles** — saves setup mistakes at recurring venues  
4. **Duplicate event / standing order** — direct time savings for recurring clients
5. **Structured staff fields** — replaces initials with real information
6. **Equipment pack-out auto-checklist** — eliminates the "bring lighter" problem
7. **Timeline section** — already built, confirmed as the right call
8. **Hot delivery flag** — simple field, high frequency need
9. **Reheating instructions auto-prompt** — simple, covers all pickup hot food
10. **Multi-BEO event grouping** — needed for Rutgers-scale engagements
