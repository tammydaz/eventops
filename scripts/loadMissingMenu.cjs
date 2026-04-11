/**
 * scripts/loadMissingMenu.cjs
 *
 * Loads the ~90 corporate menu items that are NOT yet in the Legacy Menu Items table.
 * Skips any item whose "Item Name" already exists (case-insensitive).
 *
 * New category values and their routing:
 *   "Ambient Display"         → full-service: Buffet China / delivery: DISPOSABLE DISPLAY
 *   "Full Service Hot Lunch"  → full-service: Buffet Metal / delivery: DISPOSABLE HOT
 *   "Happy Hour"              → full-service: Buffet Metal / delivery: DISPOSABLE HOT
 *   "Dessert"                 → full-service: Desserts / delivery: DISPOSABLE DISPLAY
 *   "Deli"                    → full-service: Deli / delivery: DISPOSABLE DISPLAY
 *   "Classic Salad"           → full-service: Buffet China / delivery: DISPOSABLE BULK
 *   "Signature Salad"         → full-service: Buffet China / delivery: DISPOSABLE BULK
 *   "Snack"                   → delivery: DISPOSABLE DISPLAY
 *   "Hot Breakfast"           → full-service: Buffet Metal / delivery: DISPOSABLE HOT
 *   "Breakfast Room Temp"     → full-service: Buffet Metal / delivery: DISPOSABLE READY
 *
 * Run: node scripts/loadMissingMenu.cjs
 */

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE    = "appMLgdc3QpV2pwoz";
const TABLE   = "tbl0aN33DGG6R1sPZ"; // Legacy Menu Items

const ITEM_NAME_FIELD   = "fldW5gfSlHRTl01v1";
const CATEGORY_FIELD    = "fldM7lWvjH8S0YNSX";
const DESCRIPTION_FIELD = "fldtN2hxy9TS559Rm";

// ─── Items to add ──────────────────────────────────────────────────────────────

const ITEMS = [

  // ── AMBIENT DISPLAYS — room temp served, full-service Buffet China / delivery DISPOSABLE DISPLAY ──

  // Vegetarian
  {
    name: "Very Vegetarian Victory Landslide",
    category: "Ambient Display",
    desc: "Marinated grilled vegetables atop roasted red skin & sweet potatoes topped with blistered grape tomatoes, grilled shallot rings, crispy onion straws & fried hot peppers finished with cracked black pepper, sea salt flakes & calimyrna fig vinaigrette drizzle. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Buffalo Grilled Cauliflower Steaks",
    category: "Ambient Display",
    desc: "Atop crisp romaine lettuce together with garbanzo beans, bleu cheese crumbles, tomato, celery, turkish golden raisins & shredded carrots topped with the creamiest ranch dressing ever. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Grilled Portabella Mushroom Caps Display",
    category: "Ambient Display",
    desc: "Stuffed with israeli couscous, spinach, roasted vegetables & asiago cheese, finished with balsamic basil pesto drizzle. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "BBQ Rubbed Grilled Tofu Display",
    category: "Ambient Display",
    desc: "With white shoe peg confetti corn, sweet cherry tomatoes, red onion & spinach atop a mixture of kale, arugula & mesclun served with snappy chipotle ranch dressing. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Grilled Vegetable Tower Display",
    category: "Ambient Display",
    desc: "Grilled eggplant, zucchini, summer squash, grilled peppers, carrot coins, red onion & roma tomato speared with a rosemary sprig then drizzled with herb infused olive oil & lemon zest. Includes choice of classic salad with artisan rolls & butter.",
  },

  // Chicken
  {
    name: "Crispy Fried Boneless Picnic Chicken Display",
    category: "Ambient Display",
    desc: "Within a baked potato salad circle accentuating a colorful grilled corn salad center. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Mesquite Grilled Chicken Display",
    category: "Ambient Display",
    desc: "Crumbled bacon, roasted corn, charred grape tomatoes, jalapeño jack cheese & crunchy tortilla strips atop crisp romaine & peppery arugula with bbq honey ranch dressing. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Grilled Lemon Chicken Breast & Wild Rice Dyad",
    category: "Ambient Display",
    desc: "Flavor enhanced with toasted almonds, dried cranberries, orange zest & baby arugula finished with refreshing citrus vinaigrette. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Far East Chicken Display",
    category: "Ambient Display",
    desc: "Chicken breast marinated in teriyaki sauce, then grilled & chilled before placement atop spicy pepper & peanut vermicelli pasta & salad greens topped with sesame seeds, sliced orange segments, water chestnut with sesame dressing drizzle. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Grilled Boneless Chicken with Basil EVOO",
    category: "Ambient Display",
    desc: "Grilled boneless breast of chicken brushed with basil infused EVOO, paired with bruschetta tortellini salad. Includes choice of classic salad with artisan rolls & butter.",
  },

  // Beef
  {
    name: "Vietnamese Steak Display",
    category: "Ambient Display",
    desc: "Vermicelli noodle salad circle envelops the steamed broccoli center with scallions, fried jalapeño rings & toasted coconut finished with a drizzle of foodwerx ginger soy sesame dressing. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "werx Signature Flank Steak Display",
    category: "Ambient Display",
    desc: "Grilled & displayed with crisp romaine hearts, roasted zucchini & red skinned potato cubes, butter roasted mushroom caps, olives, feta & roasted roma tomatoes with our signature fig & balsamic syrup drizzle. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Southwest Grilled Flank Steak Display",
    category: "Ambient Display",
    desc: "Plattered with roasted chili potatoes, grilled white corn salad, sautéed peppers & charred red onion rings with grilled pineapple salsa & avocado cilantro crema. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Roasted Filet Mignon Display",
    category: "Ambient Display",
    desc: "Encased in a rosemary & cracked black pepper crust — roasted potatoes, sautéed trilogy of mushrooms, crispy onion straws, & petite rolls for sandwich making with whipped herb infused butter, horseradish crème & salad selection. 15 guest minimum.",
  },

  // Seafood
  {
    name: "Sweet & Sour Glazed Shrimp Display",
    category: "Ambient Display",
    desc: "Take center stage in a confetti black rice ring followed by mango, cilantro, pepper trio & orange segments drizzled with lime vinaigrette & paired with spicy cucumber salad. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Salmon Provencal Display",
    category: "Ambient Display",
    desc: "Seasoned seared salmon atop arugula, white beans, cherry tomatoes, sautéed rosemary shallots & capers tossed with roasted pepper vinaigrette. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Seared Tuna Nicoise Display",
    category: "Ambient Display",
    desc: "Featuring fingerling potatoes, haricots verts, olives, red onion, diced egg & mixed greens tossed with simple red wine vinaigrette then topped with crispy wonton threads. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Sriracha Honey Glazed Salmon Tiles",
    category: "Ambient Display",
    desc: "Presented with sautéed shallots & avocado relish atop tossed dried cherries, green onion, micro-cut yellow pepper & citrus zest studded wheatberry salad. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Sesame Encrusted Ahi Tuna Display",
    category: "Ambient Display",
    desc: "Pan seared & cut sushi style encircling an island of red pepper & cucumber slaw presented with sushi rice salad & finished with black soy balsamic drizzle served with micro greens & pickled ginger. Includes choice of classic salad with artisan rolls & butter.",
  },
  {
    name: "Baja Shrimp Salad Display",
    category: "Ambient Display",
    desc: "Tequila & lime marinated shrimp with avocado, tomatoes, black beans & corn atop mixed greens. Crispy tortilla strips & creamy sweet red pepper ranch dressing finish this vibrant display. Includes choice of classic salad with artisan rolls & butter.",
  },

  // Mixed Grills (15 guest minimum)
  {
    name: "South of the Border Mixed Grill",
    category: "Ambient Display",
    desc: "Chimichurri brushed flank steak plus chipotle glazed chicken with spanish rice encircling grilled peppers & onions, chili glazed sweet potato coins topped with housemade pico de gallo served with sweet & spicy bacon jalapeño ranch dressing. 15 guest minimum.",
  },
  {
    name: "Teriyaki Sampler Mixed Grill",
    category: "Ambient Display",
    desc: "Grilled teriyaki glazed salmon & chicken duo paired with ginger-soy marinated rice noodle salad & mixed baby greens, carrots, cabbage, green onions, crispy wontons & julienned bamboo shoots with asian sesame dressing. 15 guest minimum.",
  },
  {
    name: "Healthwerx Twosome Mixed Grill",
    category: "Ambient Display",
    desc: "Line-caught blackened salmon & mandarin ginger glazed chicken presented with a kale & quinoa combo topped with toasted almonds, dried cranberries, toasted shallots & orange zest with a center of black bean salsa. 15 guest minimum.",
  },
  {
    name: "Southeast Asian Mixed Grill",
    category: "Ambient Display",
    desc: "Grilled lemongrass-ginger shrimp & hoisin brushed chicken presented with sweet & spicy black rice salad & julienne vegetables, tossed & topped with toasted black sesame seeds, mango, minced cilantro & shredded coconut surrounding avocado jicama salad sprinkled with pumpkin seeds finished with ginger-sambal vinaigrette. 15 guest minimum.",
  },
  {
    name: "Anytime Mixed Grill",
    category: "Ambient Display",
    desc: "Orange teriyaki glazed grilled tuna & mesquite grilled chicken breast with a garland of grilled asparagus, roasted roma tomato halves & fire roasted peppers bordering a center of grilled white corn salad splashed with melon citrus vinaigrette. 15 guest minimum.",
  },
  {
    name: "Kaboom!! Mixed Grill",
    category: "Ambient Display",
    desc: "Tender marinated beef & chicken kabobs complimented by a crown of seasonal grilled vegetables with a center of basmati rice tossed with chopped tomatoes, kalamata olives, red pepper, feta cheese & scallions tossed with green goddess vinaigrette finished with micro chopped cashew & chili infused honey drizzle. 15 guest minimum.",
  },

  // ── FULL SERVICE HOT LUNCHES — Buffet Metal (full service) / DISPOSABLE HOT (delivery) ──

  // Perfect Package — Chicken
  {
    name: "Fire & Ice Chicken",
    category: "Full Service Hot Lunch",
    desc: "Marinated then grilled boneless breast of chicken topped with arugula & tomato basil bruschetta served atop pasta with mini rolls & infused butter with foodwerx classic salad selection.",
  },
  {
    name: "Pan Asian Chicken & Vegetable Stir Fry",
    category: "Full Service Hot Lunch",
    desc: "Red & yellow pepper matchsticks, mushrooms, onions & water chestnuts wok seared & presented with lo mein noodles & classic salad choice.",
  },
  {
    name: "Chicken Marsala",
    category: "Full Service Hot Lunch",
    desc: "Chicken breast dusted in heavenly seasoned flour, pan seared with mushrooms, micro shallots, marsala wine & vermouth demi-glace seasoned with oregano, celery salt, cracked black pepper & lemon zest then finished with lemony sweet butter. Served with roasted herbed potatoes, grilled vegetables & classic salad selection.",
  },
  {
    name: "Heart Healthy Spa Chicken",
    category: "Full Service Hot Lunch",
    desc: "Grilled adobo rubbed chicken breast, served with a side of melon & pineapple salsa atop roasted fennel & sweet potatoes & classic salad selection.",
  },
  {
    name: "MANGIA MANGIA!! Chicken Parmesan",
    category: "Full Service Hot Lunch",
    desc: "Petite chicken parmesan (foodwerx style) & cheese ravioli in sunday gravy with classic caesar salad & artisan bread with herb infused olive oil for dipping.",
  },
  {
    name: "Grilled BBQ Chicken",
    category: "Full Service Hot Lunch",
    desc: "Boneless bbq grilled chicken breast with buttermilk mashed potatoes, biscuits, whipped honey butter & creamy cole slaw.",
  },

  // Perfect Package — Seafood
  {
    name: "Teriyaki Salmon",
    category: "Full Service Hot Lunch",
    desc: "Teriyaki glazed salmon atop julienned vegetables & confetti rice — artisan rolls with herb infused whipped butter & classic salad choice.",
  },
  {
    name: "Shrimp Fra Diavolo & Pasta",
    category: "Full Service Hot Lunch",
    desc: "Wild caught shrimp sautéed with pancetta, shallots, garlic & just a pinch of red pepper flakes finished with white wine, crushed tomatoes, chopped spinach, sea salt & agave butter paired with garlic crostini for dipping & classic salad choice.",
  },
  {
    name: "Jumbo Lump Crab Cakes",
    category: "Full Service Hot Lunch",
    desc: "Jumbo lump crab, micro-cut shallots, peppers & citrus zest gently tossed with panko & old bay seasoning. Paired with garlicky mashed potatoes, grilled vegetable platter & classic salad choice.",
  },

  // Perfect Package — Beef
  {
    name: "Argentinian Flank Steak",
    category: "Full Service Hot Lunch",
    desc: "Roasted sweet potatoes & red skin potatoes, southwest corn salad, grilled onions, peppers & chimichurri drizzle — cornbread, whipped honey butter & classic salad selection.",
  },
  {
    name: "Blue Plate Special",
    category: "Full Service Hot Lunch",
    desc: "Classic meatloaf with buttermilk mashed potatoes, old fashioned peas & carrots with mini rolls, whipped butter & classic salad.",
  },
  {
    name: "Bistro Flank Steak",
    category: "Full Service Hot Lunch",
    desc: "Dr. Pepper marinated then grilled flank steak with portabella mushrooms, onions, peppers & charred tomatoes drizzled with white balsamic & herbs reduction, served with toasted shoe peg white corn, mini rolls & infused butter with your classic salad choice.",
  },

  // Perfect Package — Pasta
  {
    name: "Bowtie Pasta Alfredo with Blackened Chicken",
    category: "Full Service Hot Lunch",
    desc: "Roasted yellow peppers, charred grape tomatoes, peas & chardonnay scented lite cream sauce. Classic green salad & crusty bread for dipping.",
  },
  {
    name: "Buffalo Chicken Mac n Cheese",
    category: "Full Service Hot Lunch",
    desc: "Elbow macaroni & grilled chicken tossed with buffalo sauce & honey, pepper jack & cheddar cheese baked & topped with candied bacon & scallions. Served with classic salad choice & bleu cheese dressing.",
  },
  {
    name: "Rigatoni Firenze",
    category: "Full Service Hot Lunch",
    desc: "Sautéed chicken & sweet italian sausage wheels with cherry tomatoes, mushrooms, roasted peppers & sweet onion simmered in a stewed tomato & herb broth topped with basil & grated romano cheese. Assorted breads & herb infused butter with choice of classic salad.",
  },
  {
    name: "Tortellini Bake",
    category: "Full Service Hot Lunch",
    desc: "Cheese filled tortellini with crispy pancetta, sweet peas, grape tomatoes, lemon zest, italian parsley & roasted garlic served with semolina baguette & infused whipped butter with classic green salad.",
  },

  // Perfect Package — Vegetarian
  {
    name: "Sicilian Roasted Cauliflower",
    category: "Full Service Hot Lunch",
    desc: "Sautéed kale, golden raisins, toasted almonds & roasted garlic resting atop quinoa primavera & served with your classic salad selection.",
  },
  {
    name: "Eggplant Stack",
    category: "Full Service Hot Lunch",
    desc: "Crispy panko encased eggplant rounds layered with our own fire roasted tomatoes, fresh buffalo mozzarella & yellow pepper tapenade finished with emerald basil pesto with artisan rolls & butter & served with classic salad.",
  },

  // Kabobs (Buffet Metal)
  {
    name: "Fire Grilled Shrimp Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Large shrimp woven with seasonal vegetables & brushed with garlic butter & lemon. Served with vegetable studded basmati rice, pita bread & 1 classic salad. Upgrade to signature salad (+$3 pp).",
  },
  {
    name: "Mongolian Beef Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Mongolian seasoned beef chunks skewered with red & yellow peppers, sweet onion & button mushrooms char-grilled & lathered with asian ginger dressing then topped with toasted sesame seeds. Served with basmati rice, pita bread & 1 classic salad.",
  },
  {
    name: "Greek Chicken Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Lemon & evoo marinated chicken breast in line with red & green peppers, sweet onion, tomatoes & zucchini dusted with rosemary and lemon zest salt then fire grilled & served with tzatziki sauce, basmati rice, pita bread & 1 classic salad.",
  },
  {
    name: "Italian Sausage Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Red onion, tomatoes, red pepper & green pepper alternated with italian sweet sausage brushed with basil pesto & grilled to a perfect color. Served with basmati rice, pita bread & 1 classic salad.",
  },
  {
    name: "Very Vegetable Kabobs",
    category: "Full Service Hot Lunch",
    desc: "Zucchini, mushrooms, peppers, onions, yellow squash, red potato & tomatoes & seasonal vegetables seasoned & chargrilled. Served with basmati rice, pita bread & 1 classic salad.",
  },

  // ── HAPPY HOUR BUFFETS — Buffet Metal (full service) / DISPOSABLE HOT (delivery) ──
  {
    name: "Happy Hour Buffet",
    category: "Happy Hour",
    desc: "Featuring baby back ribs, werx wings, shrimp kabobs, 3 cheese & vegetable quesadillas, cheese steak dumplings & cajun potato wedges served with all the fixins'. 20 guest minimum, 48 hours notice required.",
  },
  {
    name: "Slammin' Sliders",
    category: "Happy Hour",
    desc: "Pick 2 proteins: angus beef sliders, carolina pulled pork, crispy chicken, chipotle pulled chicken or grilled vegetable stax. Served with petite slider buns & help-yourself toppings of shredded cheese mix, frizzled onions & fried pickle toppers. With tater tots & individual salad shooters. 20 guest minimum.",
  },
  {
    name: "Dim Sum Delights",
    category: "Happy Hour",
    desc: "Pacific rim oriental pork potstickers, thai sesame noodles presented in mini chinese take-out containers with chop stix, sesame chicken on bamboo, vegetable summer rolls paired with sweet & sour asian dipping side & housemade crispy wontons. 20 guest minimum.",
  },
  {
    name: "Hip Americana",
    category: "Happy Hour",
    desc: "Sliders with american cheese & pickles, quilted franks with dusseldorf mustard, mini philadelphia soft pretzels, baked potato skins or grilled cheese triangles PLUS the forever favorite foodwerx traditional shrimp cocktail with foodwerx funky bloody mary dipping sideshow. 20 guest minimum.",
  },

  // ── ADDITIONAL LUNCH PRESENTATIONS — Deli / DISPOSABLE DISPLAY (delivery) ──
  {
    name: "Heart Healthy Lettuce Wraps",
    category: "Deli",
    desc: "Pick 1 protein: thinly sliced teriyaki marinated flank steak, spicy chili marinated shaved chicken, or lemon garlic & soy poached shrimp. With crunchy sesame noodles, pico de gallo, chopped roasted peppers, shredded carrots, frizzled onion straws & raw sesame seeds, choice of 1 classic salad, green leaf & iceberg leaves, 3 condiment sauces.",
  },
  {
    name: "werx Salad Stand",
    category: "Deli",
    desc: "Choice of 3 signature salads (white grape chicken salad, honey stung chicken salad, gochujang chicken salad, albacore tuna salad, deviled egg salad or southwest shrimp salad), marinated grilled vegetable presentation, choice of 1 classic salad, sliced sourdough & rye bread with assorted petite artisan rolls.",
  },
  {
    name: "BBY Sandwich Builder Platter",
    category: "Deli",
    desc: "Build-your-own sandwich with roasted turkey, honey ham, medium rare roast beef, genoa salami, tuna salad & white grape chicken salad. Cheeses: american, provolone, swiss. Veggies: green leaf lettuce, roma tomatoes, red onion, pickles. Spreads: mayo, spicy mustard & foodwerx secret sauce. Breads: sourdough, rye & multigrain. Choice of 2 classic salads or 1 signature salad.",
  },
  {
    name: "Executive Sandwich & Salad Builder",
    category: "Deli",
    desc: "Build-your-own sandwich and salad with Dr. Pepper marinated flank steak, marinated chicken breast, old bay poached shrimp & marinated grilled vegetables. Garden salad with 7 assorted vegetables, sandwich toppers, spreads, petite artisan rolls & 6-inch flour tortillas. Choice of 1 signature salad. 20 guest minimum.",
  },
  {
    name: "VIP Lunch Presentation",
    category: "Deli",
    desc: "Filet of beef with horseradish crème, frizzled onion straws & arugula on mini sourdough rolls paired with oven roasted turkey with cranberry chutney & green leaf lettuce on petite croissants. Marinated grilled vegetable platter, sliced fruit presentation. Choice of 2 classic salads or 1 specialty salad. 20 guest minimum.",
  },
  {
    name: "Soup Sandwich & Salad Stand",
    category: "Deli",
    desc: "Chefs' choice soup of the day, small signature sandwich & garden salad. 15 guest minimum.",
  },
  {
    name: "The Hand Held Working Lunch",
    category: "Deli",
    desc: "A combination of our gourmet sandwiches & signature wraps served on assorted artisan mini rolls & wraps. With choice of classic salad or signature salad. The original working lunch.",
  },
  {
    name: "Best of Both Platter",
    category: "Deli",
    desc: "Pick 5 selections from both gourmet signature sandwiches (S1–S27) & signature wraps (W1–W9). With choice of classic salad or signature salad.",
  },
  {
    name: "BBY Signature Salad Bar",
    category: "Deli",
    desc: "Build-your-own signature salad — pick 3 greens, 3 proteins, 3 crunch items, 2 cheeses, 1 fruit, 3 dressings. All-inclusive essentials (cucumbers, grape tomatoes, mushrooms, peppers, carrots, red onion, chick peas, grilled vegetables, hard-boiled eggs). Inclusive of artisan rolls & flavored whipped butter. Optional: foodwerx housemade soup add-on (+$6 pp). 20 guest minimum.",
  },

  // ── ADDITIONAL SALADS ─────────────────────────────────────────────────────

  {
    name: "Wheatberry Salad",
    category: "Signature Salad",
    desc: "Ebly poached in orange juice then gently tossed with sun dried apricots & cranberries, candied orange zest, cilantro & chopped arugula.",
  },
  {
    name: "veggiewerx Salad",
    category: "Signature Salad",
    desc: "An assortment of seasonal garden fresh raw veggies manicured & marinated then tossed with herb infused rice wine vinaigrette & seasoned with sea salt & cracked black pepper.",
  },
  {
    name: "Classic Jersey Summer Salad",
    category: "Signature Salad",
    desc: "Farm fresh Jersey tomato, seedless cucumber, trio of peppers & pickled red onion topped with cracked black pepper, sea salt & red wine vinaigrette. Seasonal selection.",
  },
  {
    name: "Roasted Green Beans Salad",
    category: "Signature Salad",
    desc: "Charred cherry tomatoes, grated parmesan cheese, shallots, garlic & basil drizzled with Mediterranean olive oil & white balsamic vinaigrette.",
  },
  {
    name: "Roasted Beet Salad",
    category: "Signature Salad",
    desc: "Arugula, toasted shallots, crumbled bleu cheese, cracked black pepper & candied pecans with sweet fig balsamic vinaigrette. Seasonal selection.",
  },
  {
    name: "Charred Eggplant & Chick Pea Salad",
    category: "Signature Salad",
    desc: "Seared green beans, blistered cherry tomato halves, grilled scallions, balsamic poached raisins with Himalayan sea salt, a squeeze of lemon & evoo vinaigrette.",
  },
  {
    name: "Brussels Sprout & Apple Slaw",
    category: "Signature Salad",
    desc: "Raw & shredded to a crunchy perfection! Tossed in creamy mustard dressing topped with toasted pecans. Seasonal selection.",
  },
  {
    name: "Simply Roasted Yukon Potato Salad",
    category: "Signature Salad",
    desc: "Butter brushed roasted yukon potatoes with caramelized shallots, thick bacon bits, fried hot peppers pieces & fresh thyme tossed with a toasted garlic dijon black pepper vinaigrette. 48 hours notice required.",
  },

  // ── MORE DESSERTS — Desserts section (full service) / DISPOSABLE DISPLAY (delivery) ──
  {
    name: "Mini Cream Cheese Pound Cake Triangles",
    category: "Dessert",
    desc: "foodwerx original pound cake with madagascar vanilla cream cheese, nutella & fresh berries dusted with confectioner's sugar & blueberries.",
  },
  {
    name: "Sinfully Delicious Chocolate Dipped Strictly Sweet",
    category: "Dessert",
    desc: "Sweet driscoll strawberries, granny smith apples, selected seasonal fruit, oreos, coconut macaroons & brownies hand dipped in chocolate.",
  },
  {
    name: "Sinfully Delicious Chocolate Dipped Sweet & Salty",
    category: "Dessert",
    desc: "Plump driscoll strawberries, granny smith apples, rice crispy treats, mini cannolis with thick-cut potato chips, salted pretzels & salty toffee drizzled nuts dipped in chocolate.",
  },
  {
    name: "Mini Pastries & Petit Fours",
    category: "Dessert",
    desc: "Traditional petit fours, mini eclairs, cream puffs, cannolis & mini fruit tartlets. Add fresh fruit kabobs (+$4 pp).",
  },
  {
    name: "Dessert Shot",
    category: "Dessert",
    desc: "Perfect size desserts presented in mini shot vessels — double chocolate, strawberry cream cheese pound cake, lemon & pineapple spoon bread.",
  },
  {
    name: "Full Size Cupcakes",
    category: "Dessert",
    desc: "Assorted full size cupcakes — choice of flavors.",
  },
  {
    name: "Gluten Free Dessert",
    category: "Dessert",
    desc: "Gluten free dessert selection — available upon request.",
  },

  // ── SNACKS & BREAKS ── DISPOSABLE DISPLAY (delivery) / full-service deli ──
  {
    name: "Tastykake Break",
    category: "Snack",
    desc: "4 selections of this philadelphia classic snack assortment.",
  },
  {
    name: "Cookies N Candy Break",
    category: "Snack",
    desc: "foodwerx housemade mini chocolate chip cookies bordered by penny candy treats: swedish fish, twizzlers, mary janes & hershey kisses.",
  },
  {
    name: "Penny Candy Treats",
    category: "Snack",
    desc: "Pick 3: twizzlers, swedish fish, hershey kisses, peanut chews, mary janes & jolly ranchers.",
  },
  {
    name: "Crunchy Salty & Sweet Break",
    category: "Snack",
    desc: "foodwerx trail mix, mini salty pretzel rods, mini chocolate chip cookies & fresh fruit.",
  },
  {
    name: "Philly Combo Break",
    category: "Snack",
    desc: "Tastykakes, goldenberg's peanut chews, potato chips & mini soft pretzels.",
  },
  {
    name: "Crudité Shots",
    category: "Snack",
    desc: "Carrots, celery, red & yellow peppers & grape tomato with hummus or ranch dip served shot glass style.",
  },
  {
    name: "Italian Bruschetta Display",
    category: "Snack",
    desc: "foodwerx housemade bruschetta paired with crusty grilled bread.",
  },
  {
    name: "werx Potato Chips",
    category: "Snack",
    desc: "Fresh made daily then dusted with foodwerx secret seasoning & served with caramelized French onion dip.",
  },
  {
    name: "Trio Color Tortillas",
    category: "Snack",
    desc: "3×3 trio color tortillas with pico de gallo, guacamole & chipotle black bean dip.",
  },
  {
    name: "Make Your Own Trail Mix",
    category: "Snack",
    desc: "Start with foodwerx housemade granola then add m&ms, raisins, dried blueberries, toasted almond slivers, chocolate chips or sunflower seeds. Mini take-away bags & scoops included.",
  },
  {
    name: "Healthy Break",
    category: "Snack",
    desc: "Housemade granola, seasonal fruit toss, manicured vegetables with dipping side & yogurt bowl.",
  },
  {
    name: "Tranquility Break",
    category: "Snack",
    desc: "Garden salad, sliced fruits & berries with domestic cheese display with herb crostini & dipping side.",
  },
  {
    name: "KIND Bars",
    category: "Snack",
    desc: "Gluten-free, non-GMO & kosher healthy snack bars. Assorted flavors.",
  },

  // CSB — Complete Snack Breaks (individual boxes)
  {
    name: "Hard Core Junk Food CSB",
    category: "Snack",
    desc: "Individual box: potato chips & popcorn with penny candies, mini cookies, pizza squares & canned soda. Minimum 15 guests.",
  },
  {
    name: "Refresh! CSB",
    category: "Snack",
    desc: "Individual box: crisp vegetable crudité with ranch dipping side plus seasonal fruit salad & candied lemon topped yogurt cup alongside hummus & toasted pita with foodwerx bottled water. Minimum 15 guests.",
  },
  {
    name: "Energize!! CSB",
    category: "Snack",
    desc: "Individual box: greek yogurt with housemade granola, assorted berries cup, foodwerx bark & cubed cheese complete with red bull energy drink. Minimum 15 guests.",
  },
  {
    name: "Asian Influence CSB",
    category: "Snack",
    desc: "Individual box: pacific rim oriental vegetable potstickers & sesame chicken atop thai noodles & wasabi artichoke dip with crispy crunchy wontons complete with iced tea. Minimum 15 guests.",
  },
  {
    name: "Protein Lovers CSB",
    category: "Snack",
    desc: "Individual box: hard-boiled eggs, cheese & grapes with sliced olive bread crostini & grilled chicken breast roll ups with whole apples & peanut butter quinoa cup treat including foodwerx bottled water. Minimum 15 guests.",
  },
  {
    name: "Nacho Bar CSB",
    category: "Snack",
    desc: "Individual box: housemade tortilla chips with nacho cheese sauce, salsa, sour cream, tomatoes, black olives & jalapeños with black bean fresca & chili grilled sliced chicken. Includes bottled water. Add guacamole (+$3 pp). Minimum 15 guests.",
  },

  // ── ADDITIONAL BREAKFAST ITEMS ──────────────────────────────────────────────
  {
    name: "BBY Open-Face Tartines",
    category: "Breakfast Room Temp",
    desc: "Served with everything bagel halves & 7-grain bread — Pick 1 ($8 pp) or Pick 2 ($10 pp). Options: smashed avocado/pico de gallo/hard-boiled egg/cilantro; smashed avocado/smoked salmon/capers/red onion/cucumber; smashed avocado/tomatoes/scallions/cotija/lime/maldon salt; smashed avocado/hard-boiled egg/crispy bacon/tomatoes/cheddar; brie/fig jam/honey/sea salt with cranberry walnut bread.",
  },
  {
    name: "Fruit Kabobs with Yogurt Dip",
    category: "Breakfast Room Temp",
    desc: "Seasonal fruit kabobs served with yogurt dipping side.",
  },
  {
    name: "Whole Fruit",
    category: "Breakfast Room Temp",
    desc: "Seasonal offerings of apples, oranges & bananas.",
  },
  {
    name: "Individual Overnight Oats",
    category: "Breakfast Room Temp",
    desc: "Sweet oats soaked overnight presented with grated apples, sweetly savory cinnamon, turkish golden raisins & yogurt topped with bananas & fresh berries ($8 pp). Or savory oats with sausage, bacon, green onion & cheddar cheese ($9 pp, served hot).",
  },
  {
    name: "French Toast Roll Ups",
    category: "Hot Breakfast",
    desc: "foodwerx Chef Creation French Toast Roll Ups with Candied Pecans & Raisins — traditional french toast batter-dipped roll ups skillet grilled to perfection, dusted with confectioners' sugar & cinnamon, served with vermont maple syrup dipping side.",
  },
  {
    name: "Turkey Bacon",
    category: "Hot Breakfast",
    desc: "Turkey bacon strips — a lighter alternative.",
  },
  {
    name: "Pork Roll",
    category: "Hot Breakfast",
    desc: "Sliced pork roll — a classic New Jersey breakfast meat.",
  },
  {
    name: "Honey Smoked Ham",
    category: "Hot Breakfast",
    desc: "Sliced honey smoked ham.",
  },

];

// ─── Airtable helpers ───────────────────────────────────────────────────────

async function fetchAll() {
  const existing = new Map();
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

async function run() {
  if (!API_KEY) {
    console.error("AIRTABLE_API_KEY not set. Run: $env:AIRTABLE_API_KEY='your_key'");
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

  console.log(`\nCreating ${toCreate.length} new items out of ${ITEMS.length} total...\n`);

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
    if (i + 10 < toCreate.length) await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone. Created ${created} new menu items.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
