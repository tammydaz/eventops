/**
 * scripts/loadMissingCorporateMenu.cjs
 *
 * Loads all corporate menu items NOT yet in the Legacy Menu Items table.
 * Skips any item whose "Item Name" already exists (case-insensitive).
 *
 * Run: node scripts/loadMissingCorporateMenu.cjs
 */

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE    = "appMLgdc3QpV2pwoz";
const TABLE   = "tbl0aN33DGG6R1sPZ"; // Legacy Menu Items

const ITEM_NAME_FIELD   = "fldW5gfSlHRTl01v1";
const CATEGORY_FIELD    = "fldM7lWvjH8S0YNSX";
const DESCRIPTION_FIELD = "fldtN2hxy9TS559Rm";

// ─── Items to add ──────────────────────────────────────────────────────────────

const ITEMS = [

  // ── AMBIENT DISPLAYS — missing from Airtable ───────────────────────────────
  {
    name: "Very Vegetarian Victory Landslide",
    category: "Ambient Display",
    desc: "Marinated grilled vegetables atop roasted red skin & sweet potatoes topped with blistered grape tomatoes, grilled shallot rings, crispy onion straws & fried hot peppers finished with cracked black pepper, sea salt flakes & calimyrna fig vinaigrette drizzle. Includes choice of classic salad with artisan rolls & butter. $15 pp",
  },
  {
    name: "Buffalo Grilled Cauliflower Steaks Display",
    category: "Ambient Display",
    desc: "Atop crisp romaine lettuce with garbanzo beans, bleu cheese crumbles, tomato, celery, turkish golden raisins & shredded carrots topped with the creamiest ranch dressing ever. Includes choice of classic salad with artisan rolls & butter. $15 pp",
  },
  {
    name: "Grilled Vegetable Tower Display",
    category: "Ambient Display",
    desc: "Grilled eggplant, zucchini, summer squash, grilled peppers, carrot coins, red onion & roma tomato speared with a rosemary sprig then drizzled with herb infused olive oil & lemon zest. Includes choice of classic salad with artisan rolls & butter. $15 pp",
  },
  {
    name: "Grilled Lemon Chicken Breast & Wild Rice Dyad",
    category: "Ambient Display",
    desc: "Flavor enhanced with toasted almonds, dried cranberries, orange zest & baby arugula finished with refreshing citrus vinaigrette. A foodwerx FOREVER FAVE!! Includes choice of classic salad with artisan rolls & butter. $16 pp",
  },
  {
    name: "werx Signature Flank Steak Display",
    category: "Ambient Display",
    desc: "Grilled & displayed with crisp romaine hearts, roasted zucchini & red skinned potato cubes, butter roasted mushroom caps, olives, feta & roasted roma tomatoes with our signature fig & balsamic syrup drizzle. Includes choice of classic salad with artisan rolls & butter. $17 pp",
  },
  {
    name: "Sweet & Sour Glazed Shrimp Display",
    category: "Ambient Display",
    desc: "Take center stage in a confetti black rice ring followed by mango, cilantro, pepper trio & orange segments drizzled with lime vinaigrette & paired with spicy cucumber salad. Includes choice of classic salad with artisan rolls & butter. $18 pp",
  },
  {
    name: "Salmon Provencal Display",
    category: "Ambient Display",
    desc: "Seasoned seared salmon atop arugula, white beans, cherry tomatoes, sautéed rosemary shallots & capers tossed with roasted pepper vinaigrette. Includes choice of classic salad with artisan rolls & butter. $18 pp",
  },
  {
    name: "Sriracha Honey Glazed Salmon Tiles Display",
    category: "Ambient Display",
    desc: "Presented with sautéed shallots & avocado relish atop tossed dried cherries, green onion, micro-cut yellow pepper & citrus zest studded wheatberry salad. Includes choice of classic salad with artisan rolls & butter. $18 pp",
  },
  {
    name: "Sesame Encrusted Ahi Tuna Display",
    category: "Ambient Display",
    desc: "Pan seared & cut sushi style encircling an island of red pepper & cucumber slaw presented with sushi rice salad & finished with black soy balsamic drizzle served with micro greens & pickled ginger. Includes choice of classic salad with artisan rolls & butter. $18 pp",
  },
  {
    name: "Baja Shrimp Salad Display",
    category: "Ambient Display",
    desc: "Tequila & lime marinated shrimp with avocado, tomatoes, black beans, & corn atop mixed greens. Crispy tortilla strips & creamy sweet red pepper ranch dressing finish this vibrant display. Includes choice of classic salad with artisan rolls & butter. $18 pp",
  },
  {
    name: "South of the Border Mixed Grill",
    category: "Ambient Display",
    desc: "Chimichurri brushed flank steak plus chipotle glazed chicken with spanish rice encircling grilled peppers & onions, chili glazed sweet potato coins topped with housemade pico de gallo served with sweet & spicy bacon jalapeño ranch dressing. 15 guest minimum. $22 pp",
  },
  {
    name: "Teriyaki Sampler Mixed Grill",
    category: "Ambient Display",
    desc: "Grilled teriyaki glazed salmon & chicken duo paired with ginger-soy marinated rice noodle salad & mixed baby greens, carrots, cabbage, green onions, crispy wontons & julienned bamboo shoots with asian sesame dressing. 15 guest minimum. $22 pp",
  },
  {
    name: "Healthwerx Twosome Mixed Grill",
    category: "Ambient Display",
    desc: "Line-caught blackened salmon & mandarin ginger glazed chicken presented with a kale & quinoa combo topped with toasted almonds, dried cranberries, toasted shallots & orange zest with a center of black bean salsa. 15 guest minimum. $22 pp",
  },
  {
    name: "Southeast Asian Mixed Grill",
    category: "Ambient Display",
    desc: "Grilled lemongrass-ginger shrimp & hoisin brushed chicken presented with sweet & spicy black rice salad & julienne vegetables topped with toasted black sesame seeds, mango, cilantro & shredded coconut surrounding avocado jicama salad with ginger-sambal vinaigrette drizzle. 15 guest minimum. $22 pp",
  },

  // ── HAPPY HOUR — missing ───────────────────────────────────────────────────
  {
    name: "Happy Hour Buffet",
    category: "Happy Hour",
    desc: "Baby back ribs, werx wings, shrimp kabobs, 3-cheese & vegetable quesadillas, cheese steak dumplings & cajun potato wedges served with all the fixins'. 20 guest minimum. $24 pp (48 hours notice)",
  },
  {
    name: "Dim Sum Delights",
    category: "Happy Hour",
    desc: "Pacific rim oriental pork potstickers, thai sesame noodles in mini chinese take-out containers with chop stix, sesame chicken on bamboo, vegetable summer rolls paired with sweet & sour asian dipping side & housemade crispy wontons. $20 pp",
  },
  {
    name: "Hip Americana Happy Hour",
    category: "Happy Hour",
    desc: "Sliders with american cheese & pickles, quilted franks with dusseldorf mustard, mini philadelphia soft pretzels, baked potato skins or grilled cheese triangles PLUS the forever favorite foodwerx traditional shrimp cocktail with foodwerx funky bloody mary dipping sideshow. $25 pp",
  },

  // ── FULL SERVICE HOT LUNCH — missing ──────────────────────────────────────
  {
    name: "Fire & Ice Chicken",
    category: "Full Service Hot Lunch",
    desc: "Marinated then grilled boneless breast of chicken topped with arugula & tomato basil bruschetta served atop pasta with mini rolls & infused butter with foodwerx classic salad selection. $17 pp",
  },
  {
    name: "Pan Asian Chicken & Vegetable Stir Fry",
    category: "Full Service Hot Lunch",
    desc: "Red & yellow pepper matchsticks, mushrooms, onions & water chestnuts wok seared & presented with lo mein noodles & classic salad choice. $17 pp",
  },
  {
    name: "Chicken Marsala",
    category: "Full Service Hot Lunch",
    desc: "Chicken breast dusted in heavenly seasoned flour, pan seared with mushrooms, micro shallots, marsala wine & vermouth demi-glace seasoned with oregano, celery salt, cracked black pepper & lemon zest then finished with lemony sweet butter. Served with roasted herbed potatoes, grilled vegetables & classic salad selection. $17 pp",
  },
  {
    name: "Heart Healthy Spa Chicken",
    category: "Full Service Hot Lunch",
    desc: "Grilled adobo rubbed chicken breast, served with a side of melon & pineapple salsa atop roasted fennel & sweet potatoes & classic salad selection. $17 pp",
  },
  {
    name: "Shrimp Fra Diavolo & Pasta",
    category: "Full Service Hot Lunch",
    desc: "Wild caught shrimp sautéed with pancetta, shallots, garlic & just a pinch of red pepper flakes finished with white wine, crushed tomatoes, chopped spinach, sea salt & agave butter paired with garlic crostini for dipping & classic salad choice. $20 pp",
  },
  {
    name: "Jumbo Lump Crab Cakes",
    category: "Full Service Hot Lunch",
    desc: "Jumbo lump crab, micro-cut shallots, peppers & citrus zest gently tossed with panko & old bay seasoning. Paired with garlicky mashed potatoes, grilled vegetable platter & classic salad choice. The original foodwerx FAVE!! $25 pp",
  },
  {
    name: "Bowtie Pasta Alfredo with Blackened Chicken",
    category: "Full Service Hot Lunch",
    desc: "Roasted yellow peppers, charred grape tomatoes, peas & chardonnay scented lite cream sauce. Classic green salad & crusty bread for dipping. $15 pp",
  },
  {
    name: "Buffalo Chicken Mac n Cheese",
    category: "Full Service Hot Lunch",
    desc: "Elbow macaroni & grilled chicken tossed with buffalo sauce & honey, pepper jack & cheddar cheese baked & topped with candied bacon & scallions. Served with classic salad choice & bleu cheese dressing. $15 pp",
  },
  {
    name: "Rigatoni Firenze",
    category: "Full Service Hot Lunch",
    desc: "Sautéed chicken & sweet italian sausage wheels with cherry tomatoes, mushrooms, roasted peppers & sweet onion simmered in a stewed tomato & herb broth topped with basil & grated romano cheese. Assorted breads & herb infused butter with choice of classic salad. $15 pp",
  },
  {
    name: "Tortellini Bake",
    category: "Full Service Hot Lunch",
    desc: "Cheese filled tortellini with crispy pancetta, sweet peas, grape tomatoes, lemon zest, italian parsley & roasted garlic served with semolina baguette & infused whipped butter with classic green salad. $15 pp",
  },
  {
    name: "Grilled Vegetable Tower Hot",
    category: "Full Service Hot Lunch",
    desc: "Grilled eggplant, zucchini, yellow squash, tomato, red onion, red & yellow peppers layered with fresh mozzarella & basil leaves impaled with fresh sprig of aromatic rosemary then drizzled with balsamic reduction served with pebble pasta & classic salad. $14 pp",
  },
  {
    name: "Eggplant Stack",
    category: "Full Service Hot Lunch",
    desc: "Crispy panko encased eggplant rounds layered with our own fire roasted tomatoes, fresh buffalo mozzarella & yellow pepper tapenade finished with emerald basil pesto with artisan rolls & butter & served with classic salad. $14 pp",
  },
  {
    name: "Fire Grilled Shrimp Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Large shrimp woven with seasonal vegetables & brushed with garlic butter & lemon. Served with vegetable studded basmati rice, pita bread & 1 classic salad. $18 pp",
  },
  {
    name: "Mongolian Beef Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Mongolian seasoned beef chunks skewered with red & yellow peppers, sweet onion, & button mushrooms char-grilled & lathered with asian ginger dressing then topped with toasted sesame seeds. Served with vegetable studded basmati rice, pita bread & 1 classic salad. $17 pp",
  },
  {
    name: "Greek Chicken Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Lemon & evoo marinated chicken breast in line with red & green peppers, sweet onion, tomatoes & zucchini dusted with rosemary and lemon zest salt then fire grilled & served with tzatziki sauce. Served with vegetable studded basmati rice, pita bread & 1 classic salad. $17 pp",
  },
  {
    name: "Italian Sausage Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Red onion, tomatoes, red pepper & green pepper alternated with italian sweet sausage brushed with basil pesto & grilled to a perfect color. Served with vegetable studded basmati rice, pita bread & 1 classic salad. $16 pp",
  },
  {
    name: "Very Vegetable Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Zucchini, mushrooms, peppers, onions, yellow squash, red potato & tomatoes & seasonal vegetables seasoned & char-grilled. Served with vegetable studded basmati rice, pita bread & 1 classic salad. $13 pp",
  },
  {
    name: "Sicilian Roasted Cauliflower",
    category: "Full Service Hot Lunch",
    desc: "Sautéed kale, golden raisins, toasted almonds & roasted garlic resting atop quinoa primavera & served with your classic salad selection. $14 pp",
  },

  // ── HOT LUNCH DELIVERY — full-service-style hot lunches available for delivery ──
  {
    name: "NICHOLAS Hot Roast Beef & Gravy",
    category: "Hot Lunch Delivery",
    desc: "With all the xtras — sautéed mushrooms & onions, sharp provolone & horseradish crème with traditional kaiser rolls & your choice of classic salad. $15 pp / $17 pp with crispy boardwalk potato wedges",
  },
  {
    name: "Sliders by You",
    category: "Hot Lunch Delivery",
    desc: "Petite angus beef burgers with bacon, mushrooms, sautéed onions, tomatoes & green leaf lettuce with american & cheddar cheeses with traditional slider burger buns PLUS crispy boardwalk potato wedges & your choice of classic salad. $15 pp",
  },
  {
    name: "Philly Cheesesteak",
    category: "Hot Lunch Delivery",
    desc: "Beef or chicken or both with traditional toppers including sautéed onions, peppers, mushrooms, cheese wiz & american cheese with crusty baguettes. Served with crispy boardwalk potato wedges with sea salt & malt vinegar. Classic salad choice completes this package! $15 pp beef or chicken / $18 pp beef & chicken",
  },
  {
    name: "South Philly Style Roast Pork",
    category: "Hot Lunch Delivery",
    desc: "Slow roasted pork sliced thin & served with rosemary ciabatta rolls & toppings of sharp provolone, roasted red peppers, fried hot peppers & a side of basil pesto. Classic salad to finish. $15 pp / $18 pp with pasta with garlic parmesan alfredo",
  },

  // ── PANINI — individual options ────────────────────────────────────────────
  {
    name: "Italiano Panini",
    category: "Panini",
    desc: "Genoa, prosciutto, capicola & sharp provolone with green leaf lettuce, roma tomato & roasted red peppers finished with basil pesto & red wine vinaigrette",
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

  // ── BREAKFAST ROOM TEMP — missing ─────────────────────────────────────────
  {
    name: "Nicholas Continental",
    category: "Breakfast Room Temp",
    desc: "Assorted bagels, beignets, muffins, danish, crumb cake & pound cake with cream cheese, vegetable cream cheese & whipped irish gold butter paired with seasonal fruit salad. $8 pp / $10 pp with orange juice pitchers",
  },
  {
    name: "European Continental",
    category: "Breakfast Room Temp",
    desc: "Hard-boiled eggs, sliced soppressata, honey baked ham, sliced imported swiss & cheddar, wedge of brie & tomato presented alongside raisin nut bread & petite croissants with fig jam & whipped irish gold butter infused with locally sourced honey, garnished with grapes & varietal berries. $10 pp",
  },
  {
    name: "Gluten Free Express Breakfast",
    category: "Breakfast Room Temp",
    desc: "Gluten-free bagels & gluten-free bread with irish butter & cream cheese. Supplement add-on. $7 pp",
  },
  {
    name: "New York Deli Style Lox & Bagels",
    category: "Breakfast Room Temp",
    desc: "Hand-sliced smoked salmon with classic deli accoutrements — red onions, roma tomatoes, capers, chopped egg, sliced cucumber & cream cheese with select bagels and seasonal fruit salad. $15 pp",
  },
  {
    name: "English Muffin & Wrap Sandwiches",
    category: "Breakfast Room Temp",
    desc: "Select 3 types of sandwiches: scrambled eggs, bacon & american cheese; egg whites, sautéed spinach, roma tomatoes & feta; crispy chicken, sliced tomato & cheddar; pork roll, roasted peppers & provolone; or scrambled eggs, grilled vegetables & mozzarella. $9 pp / $11 pp with chefs' skillet potatoes or tater tots / $15 with seasonal fruit",
  },

  // ── HOT BREAKFAST — missing individual items ───────────────────────────────
  {
    name: "Scrambled Eggs",
    category: "Hot Breakfast",
    desc: "Classic scrambled eggs. $6 pp / $7 pp with cheese",
  },
  {
    name: "foodwerx Home Fried Potatoes",
    category: "Hot Breakfast",
    desc: "Home fried potatoes with confetti peppers, onions & aromatic herbs. $4 pp",
  },
  {
    name: "Breakfast Burrito",
    category: "Hot Breakfast",
    desc: "Cajun-scented scrambled eggs, sautéed onions, red & green peppers, authentic pico de gallo, chopped chorizo & pepper jack cheese encased in flour tortillas then baked & topped with queso fresco & tex mex drizzle. Chipotle home fries served with foodwerx salsa & sour cream. $12 pp",
  },
  {
    name: "The foodwerx Frittata",
    category: "Hot Breakfast",
    desc: "Eggs baked with micro-cut potato cubes, crispy bacon bits, roasted red pepper, caramelized onions & 3-cheese mix served with fruit salad. Bagels with whipped butter & cream cheese spreads. $12 pp",
  },
  {
    name: "Create Your Own Omelet Bar",
    category: "Hot Breakfast",
    desc: "Made-to-order omelets with choice of bacon, sausage & pork roll, broccoli, mixed peppers, mushrooms, onions, diced tomatoes & spinach, cheddar cheese & mozzarella cheese. Served with foodwerx home fried potatoes, bagels with whipped butter, cream cheese spreads & fruit salad. 20 guest minimum. $20 pp",
  },
  {
    name: "Cinnamon Cornflake Crusted Challah French Toast",
    category: "Hot Breakfast",
    desc: "Double-dipped challah bread grilled & baked and served with maple syrup & whipped sweet butter. $8 pp",
  },
  {
    name: "Sausage Links",
    category: "Hot Breakfast",
    desc: "Pork sausage links. $4 pp",
  },
  {
    name: "Turkey Sausage",
    category: "Hot Breakfast",
    desc: "Turkey sausage. $4 pp",
  },
  {
    name: "Pork Roll",
    category: "Hot Breakfast",
    desc: "Classic jersey pork roll. $4 pp",
  },
  {
    name: "Turkey Bacon",
    category: "Hot Breakfast",
    desc: "Turkey bacon. $4 pp",
  },
  {
    name: "Oatmeal Oasis",
    category: "Breakfast Room Temp",
    desc: "Old-fashioned oatmeal presented with brown sugar, dried cranberries, raisins, candied pecans, varietal berries, chocolate chips & toasted coconut toppings. $9 pp",
  },
  {
    name: "Overnight Oats",
    category: "Breakfast Room Temp",
    desc: "Sweet oats soaked overnight then presented with grated apples, sweetly savory cinnamon, turkish golden raisins & yogurt topped with bananas & fresh berries. $8 pp. Also available savory with sausage, bacon, green onion & cheddar cheese (served hot). $9 pp",
  },

  // ── CLASSIC SALAD — missing ────────────────────────────────────────────────
  {
    name: "foodwerx Funky Salad",
    category: "Classic Salad",
    desc: "Assorted greens, maytag bleu cheese, candied pecans, strawberries & blueberries, & confetti peppers with housemade low-fat raspberry vinaigrette. $4 pp",
  },
  {
    name: "Marinated Grilled Vegetable Platter",
    category: "Classic Salad",
    desc: "Fork-cut marinated grilled vegetable platter. $4 pp additional",
  },

  // ── SIGNATURE SALAD — missing ──────────────────────────────────────────────
  {
    name: "Waldorf Salad",
    category: "Signature Salad",
    desc: "Iceberg lettuce, celery, apples, toasted walnuts, crumbled bleu cheese, grapes with foodwerx housemade poppyseed yogurt dressing. $5 pp",
  },
  {
    name: "Ancient Grain Salad",
    category: "Signature Salad",
    desc: "Quinoa, cucumber, parsley, mint, tomato, fried chick peas & shallots with cumin vinaigrette. $5 pp",
  },
  {
    name: "Thai Noodle Salad",
    category: "Signature Salad",
    desc: "Rice vermicelli noodles, cilantro, julienne carrots, peppers, onions, scallions, lime & sweet chili vinaigrette. $5 pp",
  },
  {
    name: "Taco Pasta Salad (Signature)",
    category: "Signature Salad",
    desc: "Scallion, cilantro, olives, queso fresco, grilled corn, avocado, chili dusted sautéed peppers, pico de gallo & southwestern ranch dressing. $5 pp",
  },

  // ── SNACK / BREAK — missing BSB items ─────────────────────────────────────
  {
    name: "Tastykake Break",
    category: "Snack",
    desc: "4 selections of this Philadelphia classic. $5 pp",
  },
  {
    name: "Crunchy Salty & Sweet Break",
    category: "Snack",
    desc: "foodwerx trail mix, mini salty pretzel rods, mini chocolate chip cookies & fresh fruit. $8 pp",
  },
  {
    name: "Philadelphia Soft Pretzels Break",
    category: "Snack",
    desc: "Served with mustard dipping side selection (yellow, spicy & honey mustard). $4 pp",
  },
  {
    name: "Philly Combo Break",
    category: "Snack",
    desc: "Tastykakes, goldenberg's peanut chews, potato chips & mini soft pretzels. $7 pp",
  },
  {
    name: "Sliced Fresh Fruit Display Break",
    category: "Snack",
    desc: "Chilled fresh fruit artfully presented with yogurt dipping side. $5 pp",
  },
  {
    name: "Seasonal Fruit Salad Break",
    category: "Snack",
    desc: "Chunked fruit displayed cobb style. $4 pp",
  },
  {
    name: "Crudité Shots",
    category: "Snack",
    desc: "Carrots, celery, red & yellow peppers & grape tomato with hummus or ranch dip served shot glass style. $7 pp",
  },
  {
    name: "Italian Bruschetta Display",
    category: "Snack",
    desc: "foodwerx housemade bruschetta paired with crusty grilled bread. $6 pp",
  },
  {
    name: "werx Potato Chips Display",
    category: "Snack",
    desc: "Fresh made daily then dusted with foodwerx secret seasoning & served with caramelized French onion dip. $5 pp",
  },
  {
    name: "Snack Station",
    category: "Snack",
    desc: "Bowls of werx chips, popcorn, pretzels, roasted nut medley & mini chocolate chip cookies complete with mini take away bags. $7 pp",
  },
  {
    name: "Dipping Duo",
    category: "Snack",
    desc: "Spinach, artichoke & asiago dip served beside buffalo chicken dip with celery, carrots, toasted pita & tortillas. $7 pp",
  },
  {
    name: "Make Your Own Trail Mix",
    category: "Snack",
    desc: "Start with foodwerx housemade granola then add m&ms, raisins, dried blueberries, toasted almond slivers, chocolate chips or sunflower seeds. Mini take away bags & scoops included. $8 pp",
  },
  {
    name: "Healthy Break",
    category: "Snack",
    desc: "Housemade granola, seasonal fruit toss, manicured vegetables with dipping side & yogurt bowl. $7 pp",
  },
  {
    name: "Penny Candy Treats Break",
    category: "Snack",
    desc: "Pick 3 from Twizzlers, Swedish fish, Hershey kisses, peanut chews, Mary Janes & Jolly Ranchers. $5 pp",
  },

  // ── INDIVIDUAL BOXED ENTRÉE SALADS ─────────────────────────────────────────
  {
    name: "Deli Salad Trio Box",
    category: "Deli",
    desc: "Chicken salad, shrimp salad & tuna salad atop a field of greens with hard-boiled egg, sliced roma tomatoes, chef's pasta salad & pickles. Served with ranch dressing. $15 pp",
  },
  {
    name: "Caesar Out Side of the Box Salad",
    category: "Deli",
    desc: "Choice of grilled chicken, flank steak, grilled shrimp or grilled vegetables atop romaine, cherry tomato halves, yellow peppers, herb croutons & topped with chards of pecorino romano. Grilled veggies $13 / Chicken $15 / Flank steak $16 / Grilled shrimp $17",
  },
  {
    name: "Parisian Chicken Boite Box",
    category: "Deli",
    desc: "Herbs de Provence seasoned chicken breast atop mixed greens with granny smith apples, red grapes, golden raisins, toasted almond slivers, mini crostini croutons & gorgonzola. Served with a side of parmesan peppercorn dressing. $15 pp",
  },
  {
    name: "Char Grilled Flank Steak Box Salad",
    category: "Deli",
    desc: "Baby spinach, arugula & romaine topped with dried blueberries, pumpkin seeds, cubed roasted sweet potatoes, crispy onion straws, sundried tomatoes & hard-boiled egg. Served with a side of balsamic vinaigrette. $16 pp",
  },
  {
    name: "Mesquite Grilled Salmon Box Salad",
    category: "Deli",
    desc: "Romaine & arugula form the platform with smoked paprika roasted white kernel corn & potatoes, charred grape tomatoes, grilled red onion, avocado & candied pecans. Served with a side of lime cilantro dressing. $18 pp",
  },
  {
    name: "Charcuterie Box Salad",
    category: "Deli",
    desc: "Italian salami, rolled honey ham, prosciutto, rosemary-scented grilled chicken, sharp provolone & buffalo mozzarella with roasted peppers, nicoise olives, marinated roma tomatoes, parmesan dusted grilled zucchini ribbons atop grilled romaine hearts with chards of pecorino romano, fried basil & croutons. Served with white balsamic with lemon & basil vinaigrette. $18 pp",
  },
  {
    name: "Asian Crunch Salad Box",
    category: "Deli",
    desc: "Asian 5 spice marinated grilled chicken & sesame hoisin marinated flank steak with shredded mixed greens, cabbage, red cabbage, scallion, edamame, wasabi peas, toasted peanuts, toasted sesame seeds with wonton thread croutons served with a side of avocado ranch. $20 pp",
  },

];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function fetchAll() {
  let all = [], offset = "";
  do {
    const url =
      `https://api.airtable.com/v0/${BASE}/${TABLE}` +
      `?fields[]=Item+Name&pageSize=100` +
      (offset ? `&offset=${offset}` : "");
    const r = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const d = await r.json();
    if (d.error) throw new Error(JSON.stringify(d.error));
    all.push(...d.records);
    offset = d.offset || "";
  } while (offset);
  return all;
}

async function createRecord(item) {
  const body = {
    fields: {
      [ITEM_NAME_FIELD]: item.name,
      [CATEGORY_FIELD]: item.category,
      [DESCRIPTION_FIELD]: item.desc,
    },
  };
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (d.error) throw new Error(`Failed to create "${item.name}": ${JSON.stringify(d.error)}`);
  return d;
}

async function main() {
  if (!API_KEY) {
    console.error("ERROR: AIRTABLE_API_KEY not set");
    process.exit(1);
  }

  console.log("Fetching existing items from Airtable...");
  const existing = await fetchAll();
  const existingNames = new Set(
    existing.map((r) => (r.fields["Item Name"] || "").trim().toLowerCase())
  );
  console.log(`Found ${existing.length} existing items.`);

  const toAdd = ITEMS.filter((item) => !existingNames.has(item.name.trim().toLowerCase()));
  console.log(`\n${toAdd.length} items to add (${ITEMS.length - toAdd.length} already exist).\n`);

  if (toAdd.length === 0) {
    console.log("Nothing to add. All done!");
    return;
  }

  let added = 0, failed = 0;
  for (const item of toAdd) {
    try {
      await createRecord(item);
      console.log(`  ✓ Added: ${item.name} [${item.category}]`);
      added++;
      // Rate limit: 5 requests/sec
      await new Promise((r) => setTimeout(r, 220));
    } catch (err) {
      console.error(`  ✗ Failed: ${item.name} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Added: ${added}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
