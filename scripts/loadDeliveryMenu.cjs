/**
 * scripts/loadDeliveryMenu.cjs
 *
 * Loads corporate delivery menu items into the Legacy Menu Items table.
 * Skips any item whose "Item Name" already exists (case-insensitive).
 *
 * Category values map to delivery intake picker sections:
 *   "Hot Breakfast"       → DISPOSABLE HOT
 *   "Breakfast Room Temp" → DISPOSABLE READY
 *   "Salad"               → DISPOSABLE BULK  (already exists in table)
 *   "Classic Salad"       → DISPOSABLE BULK
 *   "Signature Salad"     → DISPOSABLE BULK
 *   "Classic Sandwich"    → DISPOSABLE DISPLAY
 *   "Gourmet Sandwich"    → DISPOSABLE DISPLAY
 *   "Wrap"                → DISPOSABLE DISPLAY
 *   "Panini"              → DISPOSABLE DISPLAY
 *   "Hoagie"              → DISPOSABLE DISPLAY
 *   "Snack"               → DISPOSABLE DISPLAY
 *   "Hot Lunch Delivery"  → DISPOSABLE HOT
 *
 * Run: node scripts/loadDeliveryMenu.cjs
 */

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE    = "appMLgdc3QpV2pwoz";
const TABLE   = "tbl0aN33DGG6R1sPZ"; // Legacy Menu Items

const ITEM_NAME_FIELD  = "fldW5gfSlHRTl01v1";
const CATEGORY_FIELD   = "fldM7lWvjH8S0YNSX";
const DESCRIPTION_FIELD = "fldtN2hxy9TS559Rm"; // "Description" long text (not computed)

// ─── Corporate delivery menu items ─────────────────────────────────────────

const ITEMS = [
  // ── DISPOSABLE HOT: Hot Breakfast packages ─────────────────────────────
  {
    name: "It's Your Choice Breakfast",
    category: "Hot Breakfast",
    desc: "Choice of scrambled eggs or 3-cheese scrambled eggs, home fries or hash browns, pick 2 of hickory bacon / sausage links / country ham / turkey sausage, french toast casserole or belgium waffles, seasonal fruit salad or yogurt sundae, OJ or coffee service — 15 guest minimum",
  },
  {
    name: "BB Basic Breakfast",
    category: "Hot Breakfast",
    desc: "Scrambled eggs, chefs' skillet potatoes with pepper trio & onions, bagel assortment with cream cheese spreads & whipped butter — 15 guest minimum",
  },
  {
    name: "Breakfast Burrito",
    category: "Hot Breakfast",
    desc: "Cajun-scented scrambled eggs, sautéed onions, red & green peppers, pico de gallo, chorizo & pepper jack in flour tortillas, chipotle home fries, salsa & sour cream",
  },
  {
    name: "The Hot Nicholas Continental II",
    category: "Hot Breakfast",
    desc: "Scrambled eggs, bacon, sausage links, chefs' confetti potatoes, bagel basket with whipped irish gold butter & cream cheese spreads, seasonal fruit salad & orange juice",
  },
  {
    name: "The foodwerx Frittata",
    category: "Hot Breakfast",
    desc: "Eggs baked with potato cubes, crispy bacon, roasted red pepper, caramelized onions & 3-cheese mix, served with fruit salad, bagels with whipped butter & cream cheese",
  },
  {
    name: "Create Your Own Omelet Bar",
    category: "Hot Breakfast",
    desc: "Made-to-order omelets with choice of bacon, sausage, pork roll, broccoli, mixed peppers, mushrooms, onions, tomatoes, spinach, cheddar & mozzarella. Served with home fries, bagels, cream cheese & fruit salad — 20 guest minimum",
  },
  {
    name: "Scrambled Eggs",
    category: "Hot Breakfast",
    desc: "Scrambled eggs — $6 pp; with cheese — $7 pp",
  },
  {
    name: "3-Cheese Scrambled Eggs",
    category: "Hot Breakfast",
    desc: "Three-cheese scrambled eggs",
  },
  {
    name: "foodwerx Home Fried Potatoes",
    category: "Hot Breakfast",
    desc: "Home fried potatoes with confetti peppers, onions & aromatic herbs",
  },
  {
    name: "Shredded Potato Hash Browns & Cheddar Casserole",
    category: "Hot Breakfast",
    desc: "Shredded potato hash browns & cheddar cheese casserole",
  },
  {
    name: "Hickory Bacon",
    category: "Hot Breakfast",
    desc: "Hickory smoked bacon",
  },
  {
    name: "Sausage Links",
    category: "Hot Breakfast",
    desc: "Pork sausage links",
  },
  {
    name: "Country Ham",
    category: "Hot Breakfast",
    desc: "Sliced country ham",
  },
  {
    name: "Turkey Sausage",
    category: "Hot Breakfast",
    desc: "Turkey sausage links",
  },
  {
    name: "French Toast Casserole",
    category: "Hot Breakfast",
    desc: "Cinnamon cornflake crusted challah french toast served with maple syrup & whipped sweet butter",
  },
  {
    name: "Belgium Waffles",
    category: "Hot Breakfast",
    desc: "Belgium waffles served with maple syrup",
  },

  // ── DISPOSABLE READY: Breakfast Room Temp packages ─────────────────────
  {
    name: "Hole Foods Bagel Assortment",
    category: "Breakfast Room Temp",
    desc: "Full-sized bagels: plain, poppy, sesame, whole grain, everything & cinnamon raisin with cream cheese, vegetable cream cheese & whipped butter",
  },
  {
    name: "Nicholas Continental",
    category: "Breakfast Room Temp",
    desc: "Assorted bagels, beignets, muffins, danish, crumb cake & pound cake with cream cheese, vegetable cream cheese & whipped irish gold butter paired with seasonal fruit salad",
  },
  {
    name: "European Continental",
    category: "Breakfast Room Temp",
    desc: "Hard-boiled eggs, soppressata, honey baked ham, imported swiss, cheddar, wedge of brie & tomato alongside raisin nut bread & petite croissants with fig jam & whipped irish gold butter, garnished with grapes & varietal berries",
  },
  {
    name: "Health Matters Breakfast",
    category: "Breakfast Room Temp",
    desc: "Whipped greek yogurt with locally-sourced honey, flax seeds, nuts & foodwerx whole grain granola, mini muffins & fresh fruit salad",
  },
  {
    name: "New York Deli Style Lox & Bagels",
    category: "Breakfast Room Temp",
    desc: "Hand-sliced smoked salmon with red onions, roma tomatoes, capers, chopped egg, sliced cucumber & cream cheese with select bagels and seasonal fruit salad",
  },
  {
    name: "C3 Breakfast (Crumb Cake, Chocolate Dipped Fruit, Yogurt)",
    category: "Breakfast Room Temp",
    desc: "Cream cheese crumb cake, chocolate dipped strawberries, white chocolate dipped granny smith apples & individual cups of yogurt",
  },
  {
    name: "English Muffin & Wrap Sandwiches",
    category: "Breakfast Room Temp",
    desc: "Select 3: scrambled eggs/bacon/american cheese, egg whites/spinach/tomatoes/feta, crispy chicken/tomato/cheddar, pork roll/roasted peppers/provolone, scrambled eggs/grilled vegetables/mozzarella",
  },
  {
    name: "One Hand Pick Up Breakfast",
    category: "Breakfast Room Temp",
    desc: "Mini roll, small bagel or petite croissant — select 3: scrambled eggs/turkey sausage/brie/fig jam, egg whites/kale/caramelized onions/parmesan, scrambled eggs/honey ham/tomatoes/cheddar, grilled vegetables/basil/provolone, scrambled eggs/bacon/mushrooms/swiss",
  },
  {
    name: "Individual Breakfast Sundae",
    category: "Breakfast Room Temp",
    desc: "Non-fat vanilla yogurt topped with seasonal berries and foodwerx housemade granola",
  },
  {
    name: "Quiche Assortment",
    category: "Breakfast Room Temp",
    desc: "Choice of: spinach/tomato/feta/cracked black pepper, artichoke/green onion/mushroom/gruyère, or bacon/caramelized onions/cheddar — room temperature",
  },
  {
    name: "Seasonal Fruit Salad",
    category: "Breakfast Room Temp",
    desc: "Chunked seasonal fruit salad",
  },
  {
    name: "Yogurt Parfaits",
    category: "Breakfast Room Temp",
    desc: "Choice of: crunch parfait with honey-infused vanilla yogurt, housemade granola, toasted almonds & berries; simply fruit; or loaded with cookie crumbles, berries, toasted coconut & chocolate morsels",
  },
  {
    name: "Oatmeal Oasis",
    category: "Breakfast Room Temp",
    desc: "Old-fashioned oatmeal presented with brown sugar, dried cranberries, raisins, candied pecans, varietal berries, chocolate chips & toasted coconut toppings",
  },
  {
    name: "Breakfast Box",
    category: "Breakfast Room Temp",
    desc: "Individual breakfast box — choice of: bagel with cream cheese/mini crumb cake/yogurt/fruit cup; or ham/soppressata/provolone/swiss with hard-boiled egg/mini bagel/fruit cup; or beignets/danish/muffin/crumb cake/granola bar with cream cheese/butter/fruit cup",
  },

  // ── DISPOSABLE DISPLAY: Classic Sandwiches ─────────────────────────────
  {
    name: "Classic Sandwich Platter",
    category: "Classic Sandwich",
    desc: "Pick 5: honey ham & american, oven roasted turkey & swiss, roast beef & white cheddar, grilled chicken & pepper jack, tuna salad, white grape chicken salad, genoa salami/capicola/provolone — on sourdough, rye & multigrain, all with roma tomatoes, green leaf lettuce, mayo & spicy mustard",
  },

  // ── DISPOSABLE DISPLAY: Gourmet Sandwiches ────────────────────────────
  {
    name: "Gourmet Signature Sandwich Platter",
    category: "Gourmet Sandwich",
    desc: "Pick 5 gourmet selections on 7-grain, brioche, french seeded & semolina rolls — includes turkey, chicken, beef, ham/pork, seafood & vegetarian signature creations",
  },
  {
    name: "S1 Acapulco Turkey BLT",
    category: "Gourmet Sandwich",
    desc: "House roasted turkey breast with bacon, avocado, roma tomatoes, green leaf lettuce, roasted peppers & creamy ranch dressing",
  },
  {
    name: "S2 Smoked Turkey with Green Apples & Brie",
    category: "Gourmet Sandwich",
    desc: "Smoked turkey with thinly sliced green apples, toasted walnuts, brie, green leaf lettuce & cranberry orange relish",
  },
  {
    name: "S3 Spa Turkey",
    category: "Gourmet Sandwich",
    desc: "House roasted turkey, thinly sliced english cucumbers, green leaf lettuce, spinach, pico de gallo & parmesan peppercorn spread",
  },
  {
    name: "S4 Smoked Turkey & Crispy Bacon",
    category: "Gourmet Sandwich",
    desc: "Smoked turkey & crispy bacon with cheddar, fried hot peppers, shredded iceberg, roasted roma tomatoes & bbq mayo",
  },
  {
    name: "S5 Parmesan Crusted Chicken Cutlet",
    category: "Gourmet Sandwich",
    desc: "With roma tomatoes, arugula, basil pesto, balsamic honey vinaigrette & sharp provolone",
  },
  {
    name: "S6 The Greek Chicken",
    category: "Gourmet Sandwich",
    desc: "Grilled chicken, chopped kalamata olives, tomatoes, roasted peppers, shredded lettuce, feta & tzatziki drizzle",
  },
  {
    name: "S7 Honey Stung Chicken",
    category: "Gourmet Sandwich",
    desc: "Diced char-grilled chicken with scallions, parsley, honey, mixed with mayo, sour cream & mustard with green leaf lettuce & roma tomato",
  },
  {
    name: "S8 Herb Grilled Chicken Breast",
    category: "Gourmet Sandwich",
    desc: "Buffalo mozzarella, roasted peppers, green leaf lettuce, roma tomatoes with basil pesto & balsamic syrup drizzle",
  },
  {
    name: "S9 Savory & Sweet Flank Steak",
    category: "Gourmet Sandwich",
    desc: "With brie, caramelized onions, arugula & fig jam",
  },
  {
    name: "S10 Eye Round of Beef",
    category: "Gourmet Sandwich",
    desc: "With caramelized onion jam, fried hot peppers, roasted peppers, pepper jack, green leaf lettuce, crumbled bacon & bbq mayo",
  },
  {
    name: "S11 Grilled Flank Steak Sandwich",
    category: "Gourmet Sandwich",
    desc: "Sharp cheddar, grilled onions, oven roasted tomatoes, crisp bacon, shredded iceberg & jalapeño jam",
  },
  {
    name: "S12 Beef, Blue & Balsamic",
    category: "Gourmet Sandwich",
    desc: "Medium rare roast beef, gorgonzola, green leaf lettuce, caramelized onions, fried hot peppers & aged balsamic",
  },
  {
    name: "S13 Honey Ham & Brie",
    category: "Gourmet Sandwich",
    desc: "With greens, tomato, crispy onion straws & honey mustard",
  },
  {
    name: "S14 Ham & Cheese Squared",
    category: "Gourmet Sandwich",
    desc: "Honey ham, capicola & crispy bacon with american, provolone & sharp cheddar topped with greens & tomato smeared with dijonnaise",
  },
  {
    name: "S15 foodwerx Italian Hoagie",
    category: "Gourmet Sandwich",
    desc: "Genoa salami, prosciutto, capicola, buffalo mozzarella, roasted peppers, tomato & greens",
  },
  {
    name: "S16 Prosciutto de Parma",
    category: "Gourmet Sandwich",
    desc: "Buffalo mozzarella with roasted peppers, roma tomato, arugula, cracked black pepper & basil leaves with olive oil balsamic drizzle",
  },
  {
    name: "S17 Southwest Shrimp Salad Sandwich",
    category: "Gourmet Sandwich",
    desc: "With red peppers, cilantro, parsley, celery, red onion tossed with cajun & lime infused sour cream & mayo",
  },
  {
    name: "S18 Tuna Salad BLT",
    category: "Gourmet Sandwich",
    desc: "Albacore tuna with celery, carrots & micro red onion with crisp bacon, roma tomato, green leaf & swiss cheese",
  },
  {
    name: "S25 Marinated Grilled Vegetable Sandwich",
    category: "Gourmet Sandwich",
    desc: "With buffalo mozzarella, greens, basil pesto, cracked black pepper & balsamic vinaigrette",
  },
  {
    name: "S26 Napa Valley",
    category: "Gourmet Sandwich",
    desc: "Kale, carrots, thinly sliced cucumbers, avocado, roasted peppers, spinach, basil leaves, chards of romano cheese & hummus",
  },
  {
    name: "S27 Sharp Caprese",
    category: "Gourmet Sandwich",
    desc: "Buffalo mozzarella & sharp provolone with sundried tomatoes, arugula, shaved red onion, roasted peppers & basil pesto mayo smear with italian dressing drizzle",
  },

  // ── DISPOSABLE DISPLAY: Wraps ──────────────────────────────────────────
  {
    name: "Signature Wrap Platter",
    category: "Wrap",
    desc: "Pick 5 signature wraps — choice from W1–W9 selection",
  },
  {
    name: "W1 Crunch Chicken Wrap",
    category: "Wrap",
    desc: "Breaded chicken cutlet, carrots, kale, dried cherries, crunchy chow mein noodles & sunflower seeds",
  },
  {
    name: "W2 Turkey Tuna or Chicken BLT Wrap",
    category: "Wrap",
    desc: "Greens, tomato & crispy bacon",
  },
  {
    name: "W3 Flat Iron Seared Eye Round Wrap",
    category: "Wrap",
    desc: "Char grilled onions, oven roasted tomatoes, char grilled peppers drizzled with creamy parmesan peppercorn dressing",
  },
  {
    name: "W4 Chicken Caesar Wrap",
    category: "Wrap",
    desc: "Marinated then grilled boneless breast of chicken tossed with romaine, plum tomatoes, shredded parmesan & caesar dressing",
  },
  {
    name: "W5 Grilled Vegetable Wrap",
    category: "Wrap",
    desc: "Assorted grilled vegetables, fresh mozzarella & balsamic vinegar drizzle",
  },
  {
    name: "W6 Zesty Mediterranean Wrap",
    category: "Wrap",
    desc: "Feta, avocado, arugula, cucumbers, kalamata olives, roasted peppers, carrots, red onion & hummus",
  },
  {
    name: "W7 Cuban Chicken & Honey Ham Wrap",
    category: "Wrap",
    desc: "Crispy chicken & honey ham with green leaf lettuce, tomato, pickles, cheddar, fried hot peppers, frizzled onion straws & chipotle mayo",
  },
  {
    name: "W8 Porta-mato-luscious Wrap",
    category: "Wrap",
    desc: "Grilled portabella mushroom, roasted tomato, baby spinach & buffalo mozzarella with balsamic dijon reduction",
  },
  {
    name: "W9 Buffalo Chicken Wrap",
    category: "Wrap",
    desc: "Crispy chicken, medium hot sauce, shredded iceberg, sliced roma tomatoes & chunky blue cheese dressing",
  },

  // ── DISPOSABLE DISPLAY: Panini ─────────────────────────────────────────
  {
    name: "Panini Press Platter",
    category: "Panini",
    desc: "Pick from: Italiano, Biggie Beef, Turkey, Cheezie Veg, or Honey Roasted Ham & Brie pressed panini",
  },
  {
    name: "Italiano Panini",
    category: "Panini",
    desc: "Genoa, prosciutto, capicola & sharp provolone with green leaf lettuce, roma tomato & roasted red peppers, basil pesto & red wine vinaigrette",
  },
  {
    name: "Biggie Beef Panini",
    category: "Panini",
    desc: "Flat iron seared eye round, cheddar cheese, bacon & fried hot peppers with tomato, shredded iceberg & chipotle mayo",
  },
  {
    name: "Turkey Panini",
    category: "Panini",
    desc: "Oven roasted turkey, swiss cheese, caramelized onions, pickles with green leaf lettuce, roma tomato & russian dressing",
  },
  {
    name: "Cheezie Veg Panini",
    category: "Panini",
    desc: "Grilled vegetables & baby spinach with buffalo mozzarella & chards of parmesan drizzled with olive oil & reduced balsamic syrup",
  },
  {
    name: "Honey Roasted Ham & Brie Panini",
    category: "Panini",
    desc: "With frizzled onion straws, crumbled bacon, arugula, fig jam & chopped candied pecans",
  },

  // ── DISPOSABLE DISPLAY: Hoagies ────────────────────────────────────────
  {
    name: "Philadelphia Hoagie Platter",
    category: "Hoagie",
    desc: "Assortment of philly classic hoagie selections on brick oven sesame semolina — Italian, Roast Beef, Simple Ham & Cheese, Oven Roasted Turkey, Spicy Tuna Salad, Crispy Chicken Cutlet & Vegetarian",
  },

  // ── DISPOSABLE DISPLAY: Hot Lunch Delivery ─────────────────────────────
  {
    name: "Crispy Fried Chicken Cutlet Sandwich Station",
    category: "Hot Lunch Delivery",
    desc: "Served with brioche rolls with help-yourself toppings of chipotle mayo, honey mustard, pickles, iceberg, tomatoes, fried hot peppers & american cheese — with choice of classic salad",
  },
  {
    name: "foodwerx Housemade Meatballs & Sunday Gravy",
    category: "Hot Lunch Delivery",
    desc: "Hand rolled beef/pork/veal meatballs with locatelli cheese, minced garlic & italian seasonings served with 6-inch torpedo rolls, sliced provolone & classic caesar salad",
  },
  {
    name: "NICHOLAS Hot Roast Beef & Gravy",
    category: "Hot Lunch Delivery",
    desc: "With sautéed mushrooms & onions, sharp provolone & horseradish crème with traditional kaiser rolls & choice of classic salad",
  },
  {
    name: "Sliders by You",
    category: "Hot Lunch Delivery",
    desc: "Petite angus beef burgers with bacon, mushrooms, sautéed onions, tomatoes & green leaf lettuce with american & cheddar cheeses, slider buns, crispy boardwalk potato wedges & choice of classic salad",
  },
  {
    name: "Philly Cheesesteak Station",
    category: "Hot Lunch Delivery",
    desc: "Beef or chicken with sautéed onions, peppers, mushrooms, cheese wiz & american with crusty baguettes. Crispy boardwalk potato wedges with sea salt & malt vinegar, choice of classic salad",
  },
  {
    name: "BBQ Pulled Pork Sandwiches BYO",
    category: "Hot Lunch Delivery",
    desc: "Build-your-own pulled pork with crispy fried hot peppers, cheddar, frizzled onions & honey hot sauce on snowflake rolls, creamy cole slaw & tater tots, choice of classic salad",
  },
  {
    name: "Sausage Onions & Peppers foodwerx Style",
    category: "Hot Lunch Delivery",
    desc: "Red & green peppers, red & white onions with 4-inch pieces of sweet italian sausage marinated with balsamic, garlic & evoo, flash grilled then baked with torpedo rolls, parmesan cheese & choice of classic salad",
  },
  {
    name: "South Philly Style Roast Pork",
    category: "Hot Lunch Delivery",
    desc: "Slow roasted pork on rosemary ciabatta rolls with sharp provolone, roasted red peppers, fried hot peppers & basil pesto. Choice of classic salad",
  },
  {
    name: "Taco Time",
    category: "Hot Lunch Delivery",
    desc: "Chili seasoned ground beef or chipotle chicken with BYO toppings: sautéed peppers & onions, tomatoes, shredded lettuce, cheddar, sour cream, housemade guacamole & scallions. Corn tortillas, soft shell tortillas, spanish rice & classic salad",
  },
  {
    name: "Fajita Festival",
    category: "Hot Lunch Delivery",
    desc: "Cilantro infused chili-lime marinated chicken or carne asada flank steak with flour tortillas, sautéed peppers & onions, shredded lettuce, tomatoes, sour cream, guacamole & shredded cheddar, mexican corn & black bean salad, tortilla chips with salsa & classic salad",
  },
  {
    name: "Chicken Marsala",
    category: "Hot Lunch Delivery",
    desc: "Chicken breast in marsala wine & vermouth demi-glace with mushrooms & shallots, served with roasted herbed potatoes, grilled vegetables & classic salad",
  },
  {
    name: "Bowtie Pasta Alfredo with Blackened Chicken",
    category: "Hot Lunch Delivery",
    desc: "Roasted yellow peppers, charred grape tomatoes, peas & chardonnay scented lite cream sauce. Classic green salad & crusty bread",
  },
  {
    name: "Buffalo Chicken Mac n Cheese",
    category: "Hot Lunch Delivery",
    desc: "Elbow macaroni & grilled chicken tossed with buffalo sauce & honey, pepper jack & cheddar baked & topped with candied bacon & scallions. Classic salad & bleu cheese dressing",
  },
  {
    name: "Rigatoni Firenze",
    category: "Hot Lunch Delivery",
    desc: "Sautéed chicken & sweet italian sausage wheels with cherry tomatoes, mushrooms, roasted peppers & sweet onion in stewed tomato & herb broth topped with basil & romano. Assorted breads & choice of classic salad",
  },

  // ── DISPOSABLE BULK: Classic Salads ────────────────────────────────────
  {
    name: "Field of Greens Salad",
    category: "Classic Salad",
    desc: "Mixed greens, cucumber, grape tomato, peppers, carrots & sliced mushrooms with choice of dressing — ranch, catalina, balsamic or honey mustard",
  },
  {
    name: "Tri-Colored Rotini Pasta Salad",
    category: "Classic Salad",
    desc: "With cherry tomato, chopped spinach, red & yellow peppers, broccoli & herbs tossed in an italian vinaigrette topped with grated parmesan",
  },
  {
    name: "Hail Caesar Salad",
    category: "Classic Salad",
    desc: "Crispy romaine hearts, grape tomato, shaved parmesan reggiano, crunchy herbed croutons with caesar parmesan dressing",
  },
  {
    name: "foodwerx Funky Salad",
    category: "Classic Salad",
    desc: "Assorted greens, maytag bleu cheese, candied pecans, strawberries & blueberries, confetti peppers with housemade low-fat raspberry vinaigrette",
  },
  {
    name: "Really Busy Greek Greens",
    category: "Classic Salad",
    desc: "Romaine & spinach, feta, cucumber wedges, chick peas, grape tomatoes, roasted peppers, kalamata olives, artichoke hearts & lemon oreganetta vinaigrette",
  },
  {
    name: "Taco Pasta Salad (Classic)",
    category: "Classic Salad",
    desc: "Scallion, cilantro, olives, queso fresco, grilled corn, avocado, yellow peppers & pico de gallo with southwestern ranch dressing topped with cotija cheese",
  },
  {
    name: "Old World Macaroni Salad",
    category: "Classic Salad",
    desc: "Green pepper, red onion, grated carrot, micro-cut celery with homestyle Hellman's mayonnaise",
  },
  {
    name: "Bruschetta Penne Pasta Salad",
    category: "Classic Salad",
    desc: "Penne with diced tomato, basil, lemon zest, red & yellow peppers tossed with italian pesto vinaigrette topped with chards of romano cheese",
  },
  {
    name: "1998 Classic Potato Salad",
    category: "Classic Salad",
    desc: "Celery, egg, onion, parsley, vinegar, dry mustard & Hellman's mayonnaise dressing — Grandmom Weber's Recipe",
  },
  {
    name: "Loaded Baked Potato Salad",
    category: "Classic Salad",
    desc: "Salted olive oil rubbed baked Idaho potatoes, crispy bacon, cheddar and jack cheese, scallion and sour cream & mayonnaise dressing",
  },
  {
    name: "Herbed Potato Salad (No Mayo)",
    category: "Classic Salad",
    desc: "Steamed red skinned potatoes, parsley, scallions, red peppers, tossed in a dijon, lemon & herb infused olive oil with cracked black pepper & sea salt flakes",
  },
  {
    name: "Corn Tomato & Basil Salad",
    category: "Classic Salad",
    desc: "With white beans, red onion, feta cheese, basil & lemon vinaigrette",
  },
  {
    name: "Voodoo Slaw",
    category: "Classic Salad",
    desc: "Red cabbage with dried cherries, roasted peanuts, shredded carrots, julienned red & yellow peppers, sour green apples & scallions tossed with sriracha agave sour cream vinaigrette",
  },
  {
    name: "Cold & Creamy Traditional Cole Slaw",
    category: "Classic Salad",
    desc: "An original foodwerx favorite with a few added werx twists",
  },

  // ── DISPOSABLE BULK: Signature Salads ─────────────────────────────────
  {
    name: "Elevated Spring Mix Salad",
    category: "Signature Salad",
    desc: "Tossed field greens including mesclun, arugula & baby spinach with feta cheese crumbles, sliced strawberries, dried blueberries, scallions, yellow pepper & sunflower seeds",
  },
  {
    name: "Crunchy Kale Salad",
    category: "Signature Salad",
    desc: "Crispy kale with red cabbage, arugula, pepper trio, edamame, granny smith apples, spiced pistachios, roasted pumpkin seeds, crispy candied bacon, feta, sundried cranberries & crunchy onion straws",
  },
  {
    name: "Waldorf Salad",
    category: "Signature Salad",
    desc: "Iceberg lettuce, celery, apples, toasted walnuts, crumbled bleu cheese, grapes with foodwerx housemade poppyseed yogurt dressing",
  },
  {
    name: "The Wedge Salad",
    category: "Signature Salad",
    desc: "Cold & crispy iceberg, vine ripened tomatoes, crispy bacon, hard-boiled eggs & gorgonzola topped with crispy onion straws",
  },
  {
    name: "Kale Salad with Quinoa",
    category: "Signature Salad",
    desc: "Roasted sweet potatoes, quinoa, dried cranberries, chia seeds & toasted pistachios with citrus honey vinaigrette",
  },
  {
    name: "BLT + A + E Salad",
    category: "Signature Salad",
    desc: "Torn romaine leaves, crisp smoked bacon, ripe tomatoes, avocado, yellow pepper & hard-boiled egg with creamy caesar parmesan dressing",
  },
  {
    name: "Good Earth Salad",
    category: "Signature Salad",
    desc: "Mixed greens, cauliflower, broccoli, shaved carrots, red cabbage, cucumbers, grape tomatoes, yellow & red peppers, edamame, chick peas & mixed nuts topped with crunchy noodles",
  },
  {
    name: "Baby Spinach Signature Salad",
    category: "Signature Salad",
    desc: "Chopped egg, yellow peppers, mushrooms, red onion, grape tomatoes, almond slivers, dried cherries & sliced sweet strawberries with bacon agave vinaigrette",
  },
  {
    name: "Mediterranean Potato Salad",
    category: "Signature Salad",
    desc: "Roasted red skin potatoes with cherry tomatoes, parsley, scallions, yellow pepper, feta cheese, brined olives & herbed vinaigrette",
  },
  {
    name: "Sweet Potato Salad Toss",
    category: "Signature Salad",
    desc: "Chopped dried figs, dried cherries, pecans, scallions, red peppers & parsley tossed in an orange maple vinaigrette",
  },
  {
    name: "German Potato Salad",
    category: "Signature Salad",
    desc: "Steamed red skin potato coins with crispy bacon, sautéed onion & parsley leaf drizzled with sweet white wine vinegar & bacon vinaigrette",
  },
  {
    name: "Pasta Caprese Signature",
    category: "Signature Salad",
    desc: "Grape tomato halves, toasted pine nuts, buffalo mozzarella, roasted yellow pepper ribbons, lemon zest & basil with lemon, caper & olive oil vinaigrette topped with chards of pecorino romano",
  },
  {
    name: "Tortellini Emerald Pasta Toss",
    category: "Signature Salad",
    desc: "Sundried tomatoes, toasted pine nuts, spinach, roasted peppers & red onion tossed with white balsamic & basil pesto vinaigrette finished with pecorino romano",
  },
  {
    name: "Thai Noodle Salad",
    category: "Signature Salad",
    desc: "Rice vermicelli noodles, cilantro, julienne carrots, peppers, onions, scallions, lime & sweet chili vinaigrette",
  },
  {
    name: "Kale & Quinoa Salad",
    category: "Signature Salad",
    desc: "Roasted corn, red beans, grape tomatoes, cilantro & crisp tortilla strips with chipotle vinaigrette",
  },
  {
    name: "Ancient Grain Salad",
    category: "Signature Salad",
    desc: "Quinoa, cucumber, parsley, mint, tomato, fried chick peas & shallots with cumin vinaigrette",
  },
  {
    name: "Wild Wild Rice Salad",
    category: "Signature Salad",
    desc: "Scallions, red pepper, raisins & sun dried cranberries tossed with lemon thyme vinaigrette",
  },
  {
    name: "Moroccan Chick Pea Salad",
    category: "Signature Salad",
    desc: "With carrots, shallots, raisins tossed with lemon tahini dressing",
  },

  // ── DISPOSABLE DISPLAY: Snacks / Breaks ───────────────────────────────
  {
    name: "Cookies Cookies Cookies",
    category: "Snack",
    desc: "Housemade chocolate chip, white macadamia, oatmeal raisin & foodwerx featured flavor cookies garnished with driscoll sweet berries",
  },
  {
    name: "Decadent Dessert Display",
    category: "Snack",
    desc: "Freshly baked cookies, brownies, blondies & assorted dessert bars artfully arranged & garnished with chocolate covered strawberries, mini cannolis & beignets",
  },
  {
    name: "Decadent Dessert Display PLUS",
    category: "Snack",
    desc: "Housemade cookies, brownies, blondies & featured dessert bar, mini cheese cakes & NEW foodwerx Bark garnished with chocolate dipped strawberries, granny smith apples & coconut macaroons",
  },
  {
    name: "Sliced Fresh Fruit Display",
    category: "Snack",
    desc: "Chilled fresh fruit artfully presented with yogurt dipping side",
  },
  {
    name: "Vegetable Crudité Display",
    category: "Snack",
    desc: "Crunchy fresh veggies with mediterranean hummus dip & sundried tomato ranch",
  },
  {
    name: "Trio Platter (Cheese, Fruit, Veggie)",
    category: "Snack",
    desc: "Domestic cheese display & spicy mustard, seasonal fruit & honey infused yogurt with manicured vegetables & buttermilk green goddess ranch",
  },
  {
    name: "Dipping Duo",
    category: "Snack",
    desc: "Spinach, artichoke & asiago dip served beside buffalo chicken dip with celery, carrots, toasted pita & tortillas",
  },
  {
    name: "Snack Station",
    category: "Snack",
    desc: "Bowls of werx chips, popcorn, pretzels, roasted nut medley & mini chocolate chip cookies complete with mini take-away bags",
  },
  {
    name: "Philadelphia Soft Pretzels",
    category: "Snack",
    desc: "Served with mustard dipping side selection — yellow, spicy & honey mustard",
  },
  {
    name: "Cookies n Brownies",
    category: "Snack",
    desc: "Assorted cookies & brownie squares",
  },
];

// ─── Airtable helpers ───────────────────────────────────────────────────────

async function fetchAll() {
  const existing = new Map(); // lowercase name → record id
  let offset = null;
  do {
    let url = `https://api.airtable.com/v0/${BASE}/${TABLE}?returnFieldsByFieldId=true&fields[]=${ITEM_NAME_FIELD}&pageSize=100`;
    if (offset) url += `&offset=${offset}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const d = await r.json();
    if (d.error) throw new Error(JSON.stringify(d.error));
    for (const rec of d.records || []) {
      const n = rec.fields[ITEM_NAME_FIELD];
      if (n) existing.set(n.toLowerCase().trim(), rec.id);
    }
    offset = d.offset;
  } while (offset);
  return existing;
}

async function createBatch(records) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records, typecast: true }),
  });
  const d = await r.json();
  if (d.error) throw new Error(JSON.stringify(d.error));
  return d.records || [];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  if (!API_KEY) {
    console.error("AIRTABLE_API_KEY not set");
    process.exit(1);
  }

  console.log("Fetching existing Menu Items...");
  const existing = await fetchAll();
  console.log(`Found ${existing.size} existing records.\n`);

  const toCreate = ITEMS.filter((item) => {
    if (existing.has(item.name.toLowerCase().trim())) {
      console.log(`  SKIP (exists): ${item.name}`);
      return false;
    }
    return true;
  });

  console.log(`\nCreating ${toCreate.length} new items...\n`);

  let created = 0;
  for (let i = 0; i < toCreate.length; i += 10) {
    const chunk = toCreate.slice(i, i + 10);
    const records = chunk.map((item) => ({
      fields: {
        [ITEM_NAME_FIELD]: item.name,
        [CATEGORY_FIELD]: item.category,
        [DESCRIPTION_FIELD]: item.desc,
      },
    }));
    const result = await createBatch(records);
    created += result.length;
    for (const rec of result) {
      const name = rec.fields?.[ITEM_NAME_FIELD] ?? rec.id;
      console.log(`  ✓ Created: ${name}`);
    }
    if (i + 10 < toCreate.length) await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nDone. Created ${created} new menu items.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
