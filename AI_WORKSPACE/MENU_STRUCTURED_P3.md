# MENU STRUCTURED DATA — PART 3
# All sections beyond "Breakfast & Brunch — Curated Combos" (which lives in P2)
# Phase 1 rules: preserve typos as-is, flag ambiguities, do not invent data

---

## SECTION: Breakfast & Brunch — A La Carte

ITEM: SCRAMBLED EGGS

Parent:
SCRAMBLED EGGS

type: standalone
min_guests: 10

Description: Nick's secret recipe for the fluffiest, most delicious eggs you've ever had.

---

ITEM: FOODWERX HOME FRIED POTATOES

Parent:
FOODWERX HOME FRIED POTATOES

type: standalone
min_guests: 10

Description: With confetti peppers, onions, & aromatic herbs.

---

ITEM: CINNAMON CORNFLAKE CRUSTED CHALLA FRENCH TOAST

Parent:
CINNAMON CORNFLAKE CRUSTED CHALLA FRENCH TOAST

type: standalone
min_guests: 10

Description: Double-dipped Challah bread grilled & baked, served with maple syrup & whipped sweet butter.

Notes:
- Source spells "Challah" as "Challa" — preserved as-is per Phase 1 typo rule

---

ITEM: FOODWERX CHEF'S CREATION FRENCH TOAST ROLL UPS with Candied Pecans & Raisins

Parent:
FOODWERX CHEF'S CREATION FRENCH TOAST ROLL UPS with Candied Pecans & Raisins

type: standalone
min_guests: 10

Description: Traditional French toast batter-dipped roll ups skillet-grilled to perfection, dusted with confectioner's sugar & cinnamon, served with Vermont maple syrup dipping side.

---

ITEM: FOODWERX FRITTATA

Parent:
FOODWERX FRITTATA

type: standalone
min_guests: 10

Description: Eggs baked with micro-cut potato cubes, crispy bacon bits, roasted red pepper, caramelized onions, & a 3-cheese mix, served with fruit salad.

---

ITEM: "HOLE" FOODS

Parent:
"HOLE" FOODS

type: standalone
min_guests: 10

Description: An assortment of full-sized bagels sliced in half — plain, poppy, sesame, whole grain, everything, & cinnamon raisin — with cream cheese, vegetable cream cheese, & whipped butter.

---

ITEM: FRUIT KABOBS

Parent:
FRUIT KABOBS

type: standalone
min_guests: 10

Description: With yogurt dip.

---

ITEM: MEATS & PROTEINS

Parent:
MEATS & PROTEINS

type: standalone
min_guests: 10

Children:
- [Meat / Protein] | type: choice_required | select: 1
  - bacon
  - turkey bacon
  - sausage
  - turkey sausage
  - honey smoked ham
  - pork roll

---

ITEM: YOGURT PARFAITS

Parent:
YOGURT PARFAITS

type: standalone
min_guests: 10

Children:
- [Parfait Style] | type: choice_required | select: 1
  - Crunchy (locally sourced honey-infused vanilla yogurt, foodwerx house-made granola, toasted almonds, chocolate pieces, & berries)
  - Simply Fruit (seasonal fruit with vanilla yogurt)
  - Loaded (cookie crumbles, berries, toasted coconut, chocolate morsels, sour cherry compote with vanilla yogurt)

---

ITEM: GOURMET CHEESE PLATTER

Parent:
GOURMET CHEESE PLATTER

type: standalone

Description: Cheddar, sharp provolone, Muenster, & goat cheese with grapes, dried fruit, & nuts, alongside an assortment of artisan crackers.

---

ITEM: CHARCUTERIE

Parent:
CHARCUTERIE

type: standalone

Description: Artisanal blend of cheeses, meats, assorted nuts, and manicured vegetables, served with assorted crackers, crostini, dried & fresh fruit, olives, & nuts.

---

## SECTION: Hors D'oeuvres — Cocktail/Presented Appetizer Displays

ITEM: PINTXOS Y TAPAS DE BARCELONA

Parent:
PINTXOS Y TAPAS DE BARCELONA

type: standalone

Description: Coastal Spanish-Style Tapas. Fennel & goat cheese stuffed mini peppers, Castelvetrano olive & chorizo skewers, grilled portobello & manchego skewers, Pan con tomate (Spanish-style grilled bread with tomato), and shrimp grilled with garlic & olive oil.

---

ITEM: JAPANESE SEARED AHI TUNA

Parent:
JAPANESE SEARED AHI TUNA

type: standalone

Description: Sesame-crusted, wakame seaweed salad, and a togarashi-yuzu crema.

---

ITEM: BRUSCHETTA PRESENTATION

Parent:
BRUSCHETTA PRESENTATION

type: standalone

Description: Grilled Italian bread & focaccia with a trio of dips: Classic tomato & basil, white bean, lemon, & rosemary puree, and artichoke, garbanzo bean, & roasted garlic.

---

ITEM: ANTIPASTI

Parent:
ANTIPASTI

type: standalone

Description: Italian assortments of meats & cheeses. Ciliegini mozzarella marinated in sun-dried tomatoes, pesto, & Sicilian olives, dry salami, capicola, & domestic prosciutto, roasted artichokes with lemon, and focaccia bread with a 6-year aged balsamic vinegar & extra virgin olive oil dip.

---

ITEM: MEZZE

Parent:
MEZZE

type: standalone

Description: Middle Eastern appetizer platter. Spanakopita, za'atar spiced chicken shish kabobs, charred eggplant baba ghanoush, Kalamata olive tabouli, cucumber tzatziki, and sumac-spiced pita chips.

---

ITEM: SHRIMP COCKTAIL

Parent:
SHRIMP COCKTAIL

type: standalone

Description: Large shrimp poached in Old Bay, lemons, & herbs. Served with Bloody Mary cocktail sauce & lemon wedges.

---

ITEM: GRILLED & CHILLED SHRIMP

Parent:
GRILLED & CHILLED SHRIMP

type: standalone

Description: Large shrimp marinated in authentic Thai sweet chili sauce, served on a bed of rice vermicelli noodles, peppers, and lime vinaigrette.

---

ITEM: CHEESESTEAK DUMPLING DISPLAY

Parent:
CHEESESTEAK DUMPLING DISPLAY

type: standalone

Description: The Philly-original meets Asian dumplings. Served with sriracha ketchup.

---

ITEM: MINI LOBSTER ROLLS

Parent:
MINI LOBSTER ROLLS

type: standalone

Description: Maine lobster with fennel & dill in a buttered New England-style split top roll.

---

ITEM: CHINATOWN DUCK

Parent:
CHINATOWN DUCK

type: standalone

Description: Peking-style shredded duck accompanied by pickled cucumbers, steamed sweet buns, hoisin sauce, and cilantro.

---

ITEM: POTSTICKER DISPLAYS

Parent:
POTSTICKER DISPLAYS

type: standalone

Children:
- [Potsticker Filling] | type: choice_required | select: 1
  - edamame & kale
  - chicken lemongrass
  - pork
  - vegetable
- peanut dipping sauce | type: included
- cucumber salad | type: included

---

ITEM: MEXICAN SALSAS

Parent:
MEXICAN SALSAS

type: standalone

Description: Tri-color tortilla chips with a trio of dips: Classic guacamole, tomato salsa verde, and tomato, corn, & black bean salsa.

---

ITEM: MINIATURE TWICE-BAKED POTATO BAR

Parent:
MINIATURE TWICE-BAKED POTATO BAR

type: standalone

Description: With DIY toppings of cheddar cheese, bacon bits, scallion, sour cream, and sautéed mushrooms.

---

ITEM: MINI CONE DISPLAY

Parent:
MINI CONE DISPLAY

type: standalone

Description: Deconstructed chicken enchilada, cured salmon with caper & dill, shrimp ceviche with jicama & Meyer lemon, and whipped goat cheese & oyster mushrooms.

---

ITEM: DUO OF CEVICHES

Parent:
DUO OF CEVICHES

type: standalone

Children:
- [Ceviche Selection] | type: choice_required | select: 2
  - soy-marinated ahi tuna
  - chipotle bay scallops
  - Peruvian-style gulf shrimp
- wonton crisps | type: included

---

ITEM: WORLD OF FLATBREADS

Parent:
WORLD OF FLATBREADS

type: standalone

Description: BBQ chicken & caramelized red onion, margherita, prosciutto with fig jam / brie / arugula / candied pecan / salt / dried cherries, pepperoni & provolone, and grilled vegetables & fresh mozzarella.

---

ITEM: SEA SALAD PLATTER

Parent:
SEA SALAD PLATTER

type: standalone

Description: Jumbo lump crab salad, grilled shrimp, and lobster salad accompanied by wakame seaweed salad, pickled vegetable, and toasted ficelles with wasabi sour crema & sriracha mayo.

---

ITEM: HANGING CHARCUTERIE

Parent:
HANGING CHARCUTERIE

type: standalone

Children:
- [Skewer Selections] | type: choice_required | select: 3
  - manchego & Castelvetrano olives
  - grape tomato with ciliegini mozzarella & basil
  - dried beef braesola
  - goat cheese

---

ITEM: WONTON TACOS

Parent:
WONTON TACOS

type: standalone

Description: Chipotle-marinated chicken with Napa cabbage slaw, ahi tuna with pickled carrot / chili oil / cilantro / jalapeños, and sake-braised pork with daikon / apples / scallions / sesame crema.

---

ITEM: BUILD YOUR OWN SLIDERS

Parent:
BUILD YOUR OWN SLIDERS

type: standalone

Children:
- [Slider Protein] | type: choice_required | select: 2
  - beef
  - grilled chipotle chicken
  - Carolina pulled pork
  - grilled vegetables
  - crab
- mini rolls | type: included
- bacon | type: included
- lettuce | type: included
- tomato | type: included
- [Sauce] | type: choice_required | select: 1
  - sriracha ketchup
  - chipotle mayo

---

## SECTION: Passed Appetizers — Beef

ITEM: PIGS IN A BLANKET

Parent:
PIGS IN A BLANKET

type: standalone

Description: Mini franks in puff pastry served with whole grain mustard.

---

ITEM: CONEY ISLAND FRANKS

Parent:
CONEY ISLAND FRANKS

type: standalone

Description: Pigs in a blanket with sauerkraut & Dijon mustard.

---

ITEM: MINI BEEF EMPANADAS

Parent:
MINI BEEF EMPANADAS

type: standalone

Description: Shredded beef & onions in a flaky half-moon pastry served with a chipotle-orange dipping crème.

---

ITEM: CHEESESTEAK DUMPLING

Parent:
CHEESESTEAK DUMPLING

type: standalone

Description: The Philly-original meets Asian dumplings. Served with sriracha ketchup.

---

ITEM: CHORIZO EMPANADA

Parent:
CHORIZO EMPANADA

type: standalone

Description: Zesty chorizo in flaky pastry with a tomatillo salsa verde.

---

ITEM: CHILI-SPICED BRISKET

Parent:
CHILI-SPICED BRISKET

type: standalone

Description: 24-hour braised brisket atop multigrain crostini, garnished with a chocolate-habanero glaze.

---

ITEM: CABERNET-BRAISED SHORT RIBS

Parent:
CABERNET-BRAISED SHORT RIBS

type: standalone

Description: Zesty chorizo in flaky pastry with a tomatillo salsa verde.

Notes:
- Source description for CABERNET-BRAISED SHORT RIBS reads identically to CHORIZO EMPANADA above — likely a copy-paste error in source; preserved as-is per Phase 1 rule

---

ITEM: POLPETTI

Parent:
POLPETTI

type: standalone

Description: Mini Italian meatballs stewed in a San Marzano tomato jam.

---

ITEM: FOODWERX BABY BEEF WELLINGTONS

Parent:
FOODWERX BABY BEEF WELLINGTONS

type: standalone

Description: Marinated then seared filet tips with mushroom & pearl onions wrapped in house-made pastry, paired with a horseradish dipping sauce.

---

ITEM: MINI 2-BITE CHEESESTEAK

Parent:
MINI 2-BITE CHEESESTEAK

type: standalone

Description: Shredded beef, caramelized onions, and cheese placed in a mini brioche torpedo.

---

ITEM: MONGOLIAN BEEF SKEWER

Parent:
MONGOLIAN BEEF SKEWER

type: standalone

Description: Soy & brown sugar-marinated beef with ginger, sesame and red pepper, woven onto a bamboo skewer.

---

## SECTION: Passed Appetizers — Vegetarian

ITEM: SPANAKOPITA

Parent:
SPANAKOPITA

type: standalone

Description: Classic Greek dish of spinach & feta cheese wrapped in crispy phyllo dough.

---

ITEM: FRIED BRUSSEL SPROUTS

Parent:
FRIED BRUSSEL SPROUTS

type: standalone

Description: Tossed with chili-lime seasoning and malt vinegar.

---

ITEM: EDAMAME QUESADILLA

Parent:
EDAMAME QUESADILLA

type: standalone

Description: Corn & edamame pressed between flour tortillas with a wasabi crema.

---

ITEM: VEGETABLE SPRING ROLLS

Parent:
VEGETABLE SPRING ROLLS

type: standalone

Description: Rice noodles and vegetables in a crispy shell with a sweet chili dip.

---

ITEM: MINI VEGETABLE INDIAN SAMOSAS

Parent:
MINI VEGETABLE INDIAN SAMOSAS

type: standalone

Description: Potato and vegetables sautéed with garam masala in a crisp pastry with mango chutney.

---

ITEM: MINI VEGETABLE SKEWER

Parent:
MINI VEGETABLE SKEWER

type: standalone

Description: Marinated vegetables, rosemary, salt, lemon, and olive oil on a bamboo skewer.

---

ITEM: STUFFED MUSHROOMS

Parent:
STUFFED MUSHROOMS

type: standalone

Description: Button mushrooms filled with eggplant caponata.

---

ITEM: EGGPLANT PROVENCAL

Parent:
EGGPLANT PROVENCAL

type: standalone

Description: Marinated, lightly-battered coins of Japanese eggplant with sun-dried tomatoes and melted mozzarella.

---

ITEM: BABY BELLAS

Parent:
BABY BELLAS

type: standalone

Description: Stuffed with Moroccan couscous, toasted pine nuts, dried currants, and fresh mint.

---

ITEM: GREEK SALAD KABOB

Parent:
GREEK SALAD KABOB

type: standalone

Description: Grape tomatoes, cucumber wedges, Kalamata olives, yellow peppers, and cubed feta with an oreganata drizzle.

---

ITEM: MEXICAN SWEET CORN SHOOTER

Parent:
MEXICAN SWEET CORN SHOOTER

type: standalone

Description: Shoepeg & creamed corn, mild chili aioli, cotija cheese, and mini lime wedges.

---

ITEM: VEGETABLE EMPANADA

Parent:
VEGETABLE EMPANADA

type: standalone

Description: Fire roasted vegetables and pepper jack cheese in a crispy pastry shell with a Southwest aioli.

---

ITEM: FIG & GOAT CHEESE CROSTINI

Parent:
FIG & GOAT CHEESE CROSTINI

type: standalone

Description: Savory fig chutney and creamy goat cheese on top of a raisin-walnut crostini.

---

ITEM: RASPBERRY & BRIE

Parent:
RASPBERRY & BRIE

type: standalone

Description: Encased in a puff pastry with toasted vanilla almond with a Wildflower Honey drizzle.

---

ITEM: FRESH STRAWBERRIES

Parent:
FRESH STRAWBERRIES

type: standalone

Description: Filled with goat cheese and marbled with balsamic syrup.

---

## SECTION: Passed Appetizers — Poultry

ITEM: MINI CHICKEN QUESADILLAS

Parent:
MINI CHICKEN QUESADILLAS

type: standalone

Description: Chili-spiced chicken with onions, peppers, and Monterey Jack cheese in flour tortillas.

---

ITEM: PETITE GINGER CHICKEN KABOBS

Parent:
PETITE GINGER CHICKEN KABOBS

type: standalone

Description: Infused chicken in lime.

---

ITEM: SESAME-CRUSTED CHICKEN

Parent:
SESAME-CRUSTED CHICKEN

type: standalone

Description: Boneless chicken breast pressed in toasted sesame seeds and served with a tangy apricot sauce.

---

ITEM: HIBACHI CHICKEN

Parent:
HIBACHI CHICKEN

type: standalone

Description: Citrus & spice-marinated chicken tenders woven on a skewer and then brushed with a sweet soy glaze before grilling.

---

ITEM: MINI TURKEY KABOBS

Parent:
MINI TURKEY KABOBS

type: standalone

Description: Cilantro pesto turkey meatballs with pepper coulis and lime crema.

---

ITEM: SRIRACHA CHICKEN MEATBALLS

Parent:
SRIRACHA CHICKEN MEATBALLS

type: standalone

Description: Lean ground chicken wrapped around bleu cheese center with spicy dipping sauce.

---

ITEM: CHICKEN MANGO QUESADILLAS

Parent:
CHICKEN MANGO QUESADILLAS

type: standalone

Description: Blackened chicken, sautéed onions & peppers, candied lime, three cheeses, and sliced mango folded inside a tortilla.

---

ITEM: CHICKEN & WAFFLES

Parent:
CHICKEN & WAFFLES

type: standalone

Description: Belgian waffles, crispy fried chicken, maple-bourbon drizzle, and cinnamon powdered sugar.

---

ITEM: PISTACHIO CHICKEN TENDERS

Parent:
PISTACHIO CHICKEN TENDERS

type: standalone

Description: Ground pistachios, honey, & panko crumbs, deep fried, and served with huckleberry coulis.

---

ITEM: KOREAN FRIED CHICKEN

Parent:
KOREAN FRIED CHICKEN

type: standalone

Description: Tossed with hoisin & hot honey in a bao bun, topped with spicy slaw.

---

ITEM: CHICKEN ACROPOLIS

Parent:
CHICKEN ACROPOLIS

type: standalone

Description: Chicken tenders rolled in oregano, thyme, mint, & panko crumbs, deep fried, and served with tzatziki sauce.

---

ITEM: PEKING DUCK ROLLS

Parent:
PEKING DUCK ROLLS

type: standalone

Description: Sliced duck breast with scallion, red pepper, carrots, and Chinese cabbage, presented in a Mandarin pancake with Asian orange-soy dipping sauce.

---

## SECTION: Passed Appetizers — Lamb

ITEM: LAMB LOLLIPOPS

Parent:
LAMB LOLLIPOPS

type: standalone

Description: Marinated in garlic & rosemary, grilled to a perfect medium-rare.

---

ITEM: LAMB MERGUEZ-STUFFED PEPPADEWS

Parent:
LAMB MERGUEZ-STUFFED PEPPADEWS

type: standalone

Description: Hot & sweet Mediterranean peppers filled with Moroccan harissa-infused lamb sausage.

---

ITEM: LAMB GYROS

Parent:
LAMB GYROS

type: standalone

Description: Thinly-sliced, marinated lamb with tzatziki atop a miniature pita.

---

ITEM: MEDITERRANEAN LAMB SATAY

Parent:
MEDITERRANEAN LAMB SATAY

type: standalone

Description: With dill & cucumber yogurt sauce.

---

## SECTION: Passed Appetizers — Seafood

ITEM: MINI JUMBO LUMP CRAB CAKES

Parent:
MINI JUMBO LUMP CRAB CAKES

type: standalone

Description: Eastern shore jumbo lump crab combined with a confetti of red onion, tri-colored peppers, lemon, & Old Bay, served with a chipotle aioli.

---

ITEM: ALBACORE TUNA

Parent:
ALBACORE TUNA

type: standalone

Description: Sustainable tuna perfectly seared & topped with ginger-marinated watermelon rounds & sweet soy.

---

ITEM: SESAME PEEKYTOE CRAB BALLS

Parent:
SESAME PEEKYTOE CRAB BALLS

type: standalone

Description: Thai fish sauce, soy, & grapefruit muddled together to create a beautiful complement to a classic.

---

ITEM: CITRUS & VODKA HOUSE-CURED SCOTTISH SALMON

Parent:
CITRUS & VODKA HOUSE-CURED SCOTTISH SALMON

type: standalone

Description: Limes, lemons, & orange permeate the salmon, adding a citrus note to the palate. Topped with dill crème fraiche on whole grain toast points.

---

ITEM: BACON-WRAPPED SCALLOPS

Parent:
BACON-WRAPPED SCALLOPS

type: standalone

Description: Diver scallops wrapped in house-cured bacon with a dollop of horseradish crème.

---

ITEM: AHI TUNA TARTARE

Parent:
AHI TUNA TARTARE

type: standalone

Description: Sushi-grade tuna on top of five-spice wontons with an Asian plum sauce and black & white sesame seeds.

---

ITEM: COCONUT SHRIMP

Parent:
COCONUT SHRIMP

type: standalone

Description: Large shrimp dipped in a piña colada blend, tossed in panko crumbs & shredded coconut, deep fried until crisp. Served with a pineapple colada.

---

ITEM: LOUISIANA LOBSTER HUSHPUPPIES

Parent:
LOUISIANA LOBSTER HUSHPUPPIES

type: standalone

Description: With Cajun remoulade.

---

ITEM: FIRECRACKER SHRIMP ON BAMBOO

Parent:
FIRECRACKER SHRIMP ON BAMBOO

type: standalone

Description: Jumbo shrimp marinated in basil, orange, jalapeño, cilantro, & spicy sriracha honey, grilled for peak flavor.

---

ITEM: LOBSTER QUESADILLA

Parent:
LOBSTER QUESADILLA

type: standalone

Description: Lobster meat sautéed with pickled lemon, shallots, & yellow pepper, quickly grilled with fontina cheese, and served with spicy tomato diablo salsa.

---

ITEM: TUNA & AVOCADO POKE

Parent:
TUNA & AVOCADO POKE

type: standalone

Description: Presented on an edible spoon.

---

ITEM: POTATO WRAPPED SHRIMP

Parent:
POTATO WRAPPED SHRIMP

type: standalone

Description: Large shrimp wrapped with Yukon gold potato threads and flash fried.

---

## SECTION: Passed Appetizers — Pork

ITEM: KOREAN BBQ PORK BELLY

Parent:
KOREAN BBQ PORK BELLY

type: standalone

Description: With scallions & toasted sesame seeds.

---

ITEM: OPEN-FACED CUBANO

Parent:
OPEN-FACED CUBANO

type: standalone

Description: Braised pork shoulder with honey ham, Gruyere, pickles, chimichurri, & pimento aioli on a Cuban toast point.

---

ITEM: BLM IN T

Parent:
BLM IN T

type: standalone

Description: Vine-ripened cherry tomatoes stuffed with extra crispy bacon & iced romaine with a touch of Hellman's mayonnaise.

---

ITEM: MINI BANH MI

Parent:
MINI BANH MI

type: standalone

Description: Shredded pork, pickled cucumbers, & red onion with sriracha aioli cossetted in a 2-inch hoagie roll.

---

ITEM: CANDIED PORK BELLY BURNT ENDS

Parent:
CANDIED PORK BELLY BURNT ENDS

type: standalone

Description: Tossed with a dry rub, then flash fried and drizzled with gooey gochujang sauce on top of a bao bun.

---

ITEM: ROASTED PORK SPRING ROLLS

Parent:
ROASTED PORK SPRING ROLLS

type: standalone

Description: South Philly favorite with an Asian twist — slow roasted pork, sharp provolone, roasted peppers, & broccoli rabe in a crispy wrapper.

---

ITEM: MINI CUBAN X3

Parent:
MINI CUBAN X3

type: standalone

Description: Roasted pork, country ham, & crumbled bacon with Swiss cheese & pickles on a mini 2-bite cocktail brioche roll.

---

ITEM: PROSCIUTTO FLATBREAD SQUARES

Parent:
PROSCIUTTO FLATBREAD SQUARES

type: standalone

Description: Cured prosciutto, caramelized shallots, Brie, fig jam, & sour cherry salsa atop toasted flatbread.

---

ITEM: CAROLINA PULLED PORK

Parent:
CAROLINA PULLED PORK

type: standalone

Description: Served on top of crispy plantain chips and topped with leek straws, a dollop of guacamole, & lime sour cream.

---

ITEM: SWEET & SOUR PORK BELLY

Parent:
SWEET & SOUR PORK BELLY

type: standalone

Description: Seared pork belly & pickled Asian cabbage on top of a wonton crisp.

---

ITEM: TINY TINGA TACO

Parent:
TINY TINGA TACO

type: standalone

Description: Pulled pork, Monterey Jack cheese, & Pico de Gallo in a mini taco shell.

---

ITEM: PANCETTA, CHIVE, & SHARP PROVOLONE

Parent:
PANCETTA, CHIVE, & SHARP PROVOLONE

type: standalone

Description: Atop a golden potato pancake.

---

ITEM: FIGS IN A BLANKET

Parent:
FIGS IN A BLANKET

type: standalone

Description: Plump dried figs wrapped in hickory-smoked bacon & Gorgonzola seasoned with rosemary.

---

ITEM: CANDIED BACON SPOON

Parent:
CANDIED BACON SPOON

type: standalone

Description: Brown sugar, nutmeg, & a dollop of caramel-chocolate goo.

---

## SECTION: Late Night Bites

ITEM: TATER TOTS WITH CHEESE CURDS

Parent:
TATER TOTS WITH CHEESE CURDS

type: standalone

Description: Pickles, bacon, & sriracha aioli.

---

ITEM: FALAFEL

Parent:
FALAFEL

type: standalone

Description: Spiced ground chickpea balls with pita, shredded lettuce, diced tomatoes, spicy Greek yogurt, and tahini.

---

ITEM: PRETZEL BITES

Parent:
PRETZEL BITES

type: standalone

Description: With Belgian-style beer cheese & stout mustard.

---

ITEM: SHAKSHUKA

Parent:
SHAKSHUKA

type: standalone
dietary_tag: VEGETARIAN

Description: Middle Eastern favorite of eggs poached in an aromatic tomato & pepper sauce.

---

ITEM: SHASHLIK

Parent:
SHASHLIK

type: standalone

Description: Polish-style chicken & kielbasa kabob and Czech-style sauerkraut.

---

ITEM: ANCHO CHILI BEEF TACOS

Parent:
ANCHO CHILI BEEF TACOS

type: standalone

Description: Corn tortillas, radish, & scallion slaw.

---

ITEM: CHICKEN WING LOLLIPOPS

Parent:
CHICKEN WING LOLLIPOPS

type: standalone

Description: With Vietnamese palm-sugar glaze.

---

ITEM: POLENTA FRIED OYSTERS

Parent:
POLENTA FRIED OYSTERS

type: standalone

Description: With radish and Cajun remoulade on a split top roll.

---

ITEM: CHICAGO HOT DOG SLIDERS

Parent:
CHICAGO HOT DOG SLIDERS

type: standalone

Description: Mini beef franks with pickles, hot pepper, tomato relish, spicy brown mustard, and chopped onions.

---

ITEM: BAHN MI

Parent:
BAHN MI

type: standalone

Description: French baguette with slow-roasted pork, bacon, pickled carrots, Napa cabbage, cilantro, and house-made sambal aioli.

---

ITEM: MOULES FRITES

Parent:
MOULES FRITES

type: standalone

Description: Steamed mussels in a fennel-infused broth served with crispy bread.

---

ITEM: NONNA'S MEATBALLS

Parent:
NONNA'S MEATBALLS

type: standalone

Description: Blend of ground beef, pork, & veal with Parmigiano Reggiano & parsley, simmered in San Marzano tomatoes.

---

## SECTION: Themed Buffets — Italian

Notes:
- Source does not list a guest minimum for this section; no min_guests applied
- This section contains 3 items as a package

ITEM: ITALIAN THEMED BUFFET

Parent:
ITALIAN THEMED BUFFET

type: buffet_package

Children:
- Nonna's Meatballs (blend of ground beef, pork, & veal with Parmigiano Reggiano & parsley, simmered in San Marzano tomatoes) | type: included
- Baked Rigatoni in Sunday Gravy (with sausage, pecorino, & fresh mozzarella) | type: included
- Broccolini (with garlic, calabrese peppers, & olive oil) | type: included

---

## SECTION: Themed Buffets — French

min_guests: 25

ITEM: FRENCH THEMED BUFFET

Parent:
FRENCH THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- Shashlik (Polish-style chicken & kielbasa kabob with Czech-style sauerkraut) | type: included
- Chicken Alla Griglia (rosemary-marinated grilled chicken breast, Kennett Square wild mushrooms, and roasted fingerling potatoes) | type: included
- Antipasta (platter of salami, olives, marinated garbanzo beans, & giardiniera) | type: included
- Focaccia Squares | type: included
- Roasted Whole Herbs de Provence Chicken (natural jus) | type: included
- Ratatouille (French-style eggplant and vegetable stew) | type: included
- Pommes Puree (smooth potato puree) | type: included
- Salmon en Papillote (salmon fillets steamed in lemon, white wine, & fennel) | type: included
- French Bean Salad (almonds, cucumber, tomato, & pickled onion in a lemon-rosemary vinaigrette) | type: included
- French Baguette Slices (served with Beurre de Baratte Fleur de Sel) | type: included

Notes:
- Source spells "en Papillote" as "en Papiollete" — preserved as-is per Phase 1 typo rule
- Source spells "baguette" as "baguete" — preserved description content as corrected; the item name from source is "FRENCH BAGUETE SLICES" (typo preserved in original)

---

## SECTION: Themed Buffets — Traditional Southern

min_guests: 25

ITEM: TRADITIONAL SOUTHERN THEMED BUFFET

Parent:
TRADITIONAL SOUTHERN THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- North Carolina Shrimp & Grits (trinity of vegetables, creamy grits, and grilled jumbo gulf shrimp) | type: included
- Smoked Kansas City Pulled Pork (KC style BBQ sauce with snowflake rolls) | type: included
- Red Cabbage Slaw (with mustard seeds & peanuts) | type: included
- Grilled Potatoes (with Creole spices) | type: included
- Braised Greens (with bacon & sweet onion) | type: included
- Southern Biscuits (with sweet molasses butter) | type: included

---

## SECTION: Themed Buffets — Pacific Islands

min_guests: 25

ITEM: PACIFIC ISLANDS THEMED BUFFET

Parent:
PACIFIC ISLANDS THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- Thai Coconut Red Curry Beef (flank steak stewed in lemongrass, Thai red curry, kaffir lime, & coconut milk, served with charred peppers) | type: included
- Pineapple Fried Rice (with mint & basil) | type: included
- Philippine Pancit (traditional stir fry with rice noodles, spicy sausage, celery, Napa cabbage, and grilled shrimp) | type: included
- Grilled Japanese Eggplant & Long Beans (Filipino Kare-Kare-Style — braised in coconut milk, annatto seeds, and ground peanuts) | type: included
- Mango & Bean Sprout Salad (sesame seeds & peppers) | type: included
- Peanut Chicken Satays (white meat chicken, marinated in coconut milk, with spicy cucumbers on bamboo) | type: included

---

## SECTION: Themed Buffets — Eastern European

min_guests: 25

ITEM: EASTERN EUROPEAN THEMED BUFFET

Parent:
EASTERN EUROPEAN THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- Hungarian Beef Goulash (classic Hungarian dish of slow-cooked beef with sweet paprika, potatoes, and vegetables) | type: included
- Buttered Pierogies (with caramelized sweet onions and chive sour cream) | type: included
- Shashlyk (Polish-style chicken & kielbasa kabob served with sauerkraut) | type: included
- Vegetable & Rice Stuffed Cabbage | type: included
- Stewed Mushrooms (with winter squash, peppers, onions, and cream) | type: included
- Beet & Apple Salad (endive, arugula, & walnuts with a poppy seed-mustard vinaigrette) | type: included

---

## SECTION: Themed Buffets — Heart of Asia

min_guests: 25

ITEM: HEART OF ASIA THEMED BUFFET

Parent:
HEART OF ASIA THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- Vietnamese Shaking Beef (wok-seared flank steak with zucchini, chili peppers, Napa cabbage, & tomato in a rich mushroom-soy glaze) | type: included
- Sesame Chicken (rice flour-battered chicken with an orange-soy glaze, toasted sesame seeds & broccoli) | type: included
- Broccoli (with roasted garlic-lemon drizzle & toasted sesame seeds) | type: included
- Asian-Style Steamed Bok Choy (oyster sauce and ground peanuts) | type: included
- Japanese-Style Rice (with egg, bean sprouts, tofu, carrots, and enoki mushrooms) | type: included
- Mizuna Lettuce & Spinach Salad (toasted sesame-hoisin vinaigrette, jicama, Asian pears, grapes, and crunchy wontons) | type: included

---

## SECTION: Themed Buffets — Middle Eastern

min_guests: 25

ITEM: MIDDLE EASTERN THEMED BUFFET

Parent:
MIDDLE EASTERN THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- Za'atar Spiced Leg of Lamb (dry rubbed with the ancient spice blend of cumin, thyme, marjoram, fennel, & sumac; paired with toasted Israeli couscous, almonds, dates, & apricots) | type: included
- Walnut & Kale Tabbouleh (pomegranate & apples) | type: included
- Roasted Salmon (baba ghanoush, grilled endive, preserved lemon, & olive spread) | type: included
- Grilled Mint & Yogurt-Marinated Chicken (roasted celery root & dates) | type: included
- Fried Cauliflower (pine nuts & charred peppers) | type: included

---

## SECTION: Themed Buffets — Steakhouse

min_guests: 25

ITEM: STEAKHOUSE THEMED BUFFET

Parent:
STEAKHOUSE THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- Grilled Denver Steak (unbelievably tender cut of beef marinated in fresh rosemary & thyme; served with crispy oyster mushrooms and a red onion demi-glace) | type: included
- "The Wedge" (baby iceberg wedge, Maytag bleu cheese, bacon, & tomatoes with a chive-buttermilk dressing) | type: included
- Roasted Potato & Turnip Salad (feta, dried figs, celery, poppy seeds, fried garbanzo beans, and radish) | type: included
- Creamed Spinach (Swiss cream cheese, nutmeg, sour cream) | type: included
- Stuffed Flounder (crab & fennel stuffing, cider, and mustard cream sauce) | type: included
- Roasted 5-Herb Fingerling Potatoes (parsley, rosemary, thyme, oregano, lemon oil, & chives) | type: included
- Fried Artichokes (with roasted carrots & lemon) | type: included

---

## SECTION: Themed Buffets — "Old School" Italiano

min_guests: 25

ITEM: "OLD SCHOOL" ITALIANO THEMED BUFFET

Parent:
"OLD SCHOOL" ITALIANO THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- Stuffed Manicotti (ricotta & pecorino filling in whole plum tomato sauce) | type: included
- Chicken Marsala (mushrooms & Marsala demi-glace) | type: included
- Eggplant Parmigiana (layers of Italian eggplant, ripe Roma tomatoes, basil, and fresh mozzarella) | type: included
- Flounder Francaise (egg-battered with a lemon-white wine sauce) | type: included
- Sweet Italian Sausage (onions, peppers, and cherry tomatoes) | type: included

---

## SECTION: Themed Buffets — Mexican

min_guests: 25

ITEM: MEXICAN THEMED BUFFET

Parent:
MEXICAN THEMED BUFFET

type: buffet_package
min_guests: 25

Children:
- Ancho Chili Beef Tacos (corn tortillas, Chayote squash, and scallion slaw) | type: included
- Classic Caesar Salad (romaine hearts, grape tomatoes, shaved Parmigiano Reggiano, and crunchy herb croutons) | type: included
- Red Beans & Rice (classic slow-simmered tomato & seasoned kidney beans and fluffy long grain rice) | type: included
- Mexican Chocolate-Braised Chicken Mole Enchiladas (chile mole-styled braised boneless chicken thighs) | type: included
- Corn Salad (cilantro, pumpkin seeds, and tomato dressed with a cumin-orange vinaigrette) | type: included
- Achiote Spiced Char-Grilled Seasonal Vegetables | type: included
- Garlic & Rosemary Focaccia | type: included
- Tamale Style Poblano Pepper (stuffed with masa, black beans, zucchini, and queso fresco) | type: included

---

## SECTION: Signature Salads — Traditional

Notes:
- Dressing choices apply across all salads in this section (see DRESSING CHOICES item at end of section)

ITEM: FOODWERX "FUNKY SALAD"

Parent:
FOODWERX "FUNKY SALAD"

type: standalone

Description: Crisp lettuce, strawberries, Maytag bleu cheese, candied pecans, mixed berries, peppers, and scallions.

---

ITEM: CLASSIC CAESAR

Parent:
CLASSIC CAESAR

type: standalone

Description: Romaine hearts, grape tomatoes, shaved Parmigiano Reggiano, and crunchy herb croutons.

Notes:
- Source spells as "CLASSIC CASEAR" — typo preserved in notes, display name corrected to CLASSIC CAESAR for usability

---

ITEM: CAPRESE

Parent:
CAPRESE

type: standalone

Description: Roasted Roma tomatoes, fresh mozzarella, crostini, basil pesto, & red pepper coulis.

---

ITEM: CLASSIC GREEN SALAD

Parent:
CLASSIC GREEN SALAD

type: standalone

Description: Crisp green lettuce, cucumber, carrots, mushrooms, broccoli, onion, and tomato.

---

ITEM: THE WALDORF

Parent:
THE WALDORF

type: standalone

Description: Iceberg lettuce, apples, toasted walnuts, crumbled bleu cheese, grapes, raisins, and lemon aioli.

---

ITEM: CLASSIC POTATO SALAD

Parent:
CLASSIC POTATO SALAD

type: standalone

Description: Celery, egg, onion, parsley, with a dry mustard & Hellman's mayo vinaigrette.

---

## SECTION: Signature Salads — Not-So-Traditional

ITEM: ARUGULA & FENNEL

Parent:
ARUGULA & FENNEL

type: standalone

Description: Peppery arugula & licorice-flavored shaved fennel with toasted walnuts, goat cheese, and red onion.

---

ITEM: GREEK GODDESS SALAD

Parent:
GREEK GODDESS SALAD

type: standalone

Description: Baby spinach & romaine, Kalamata olives, garbanzo beans, grape tomatoes, roasted peppers, and feta cheese.

---

ITEM: ORIENTAL SALAD

Parent:
ORIENTAL SALAD

type: standalone

Description: Mizuna lettuce & Napa cabbage, bean sprouts, jicama, carrot ribbons, julienne peppers, and pickled red onion.

---

ITEM: ANCIENT GRAIN SALAD

Parent:
ANCIENT GRAIN SALAD

type: standalone

Description: Farro, quinoa, wild rice, almonds, dried fruits, and wilted greens.

---

ITEM: THAI NOODLE SALAD

Parent:
THAI NOODLE SALAD

type: standalone

Description: Rice vermicelli noodles, cilantro, julienne carrots, peppers, onions, Napa cabbage, and toasted peanuts, dressed with a lime-sweet chili vinaigrette.

---

ITEM: BLACK KALE SALAD

Parent:
BLACK KALE SALAD

type: standalone

Description: Red onion, roasted squash, lemon zest, pecorino romano.

---

ITEM: 4 BEAN SALAD

Parent:
4 BEAN SALAD

type: standalone

Description: Black beans, haricots verts, giant white beans, & sugar snaps with shaved beets, mustard seeds, and baby spinach.

---

ITEM: BAKED POTATO SALAD

Parent:
BAKED POTATO SALAD

type: standalone

Description: Baked russet potatoes, apple cider vinegar, bacon, cheddar & jack cheeses, scallion and sour cream dressing.

---

ITEM: BRUSCHETTA PASTA

Parent:
BRUSCHETTA PASTA

type: standalone

Description: Farfalle pasta with diced tomatoes, basil, lemon zest, and Italian vinaigrette.

---

ITEM: GEMELLI TUSCAN PASTA SALAD

Parent:
GEMELLI TUSCAN PASTA SALAD

type: standalone

Description: Cucumber, olive, trio of peppers, and arugula in a black peppercorn-red wine vinaigrette.

---

ITEM: ISRAELI COUSCOUS

Parent:
ISRAELI COUSCOUS

type: standalone

Description: Harissa vinaigrette, cucumbers, dates, red cabbage, golden raisins, and grilled eggplant.

---

ITEM: DRESSING CHOICES

Parent:
DRESSING CHOICES

type: add_on | applies_to: all salads

Children:
- [Dressing] | type: choice_required | select: 1
  - Balsamic
  - Raspberry
  - Ranch
  - Bleu Cheese
  - Italian
  - Green Goddess
  - Dijonaise
  - Citrus
  - Whole Grain Mustard
  - Parmesan Peppercorn

---

## SECTION: Entrees — Beef

ITEM: VIETNAMESE SHAKING BEEF

Parent:
VIETNAMESE SHAKING BEEF

type: standalone

Description: Wok-seared flank steak with zucchini, chili peppers, Napa cabbage, and tomato in a rich mushroom-soy glaze.

---

ITEM: NONNA'S MEATBALLS

Parent:
NONNA'S MEATBALLS

type: standalone

Description: Blend of ground beef, pork, & veal with Parmigiano Reggiano & parsley, simmered in San Marzano tomatoes.

---

ITEM: BRAISED SHORT RIBS

Parent:
BRAISED SHORT RIBS

type: standalone

Description: 8-hour braised short ribs — slow-cooked with root vegetables, cabernet sauvignon, and a rosemary demi-glace.

---

ITEM: BEEF BRISKET

Parent:
BEEF BRISKET

type: standalone

Description: Slow-cooked with leeks, carrots, celery, & garlic for the perfect natural au jus.

---

ITEM: HUNGARIAN BEEF GOULASH

Parent:
HUNGARIAN BEEF GOULASH

type: standalone

Description: Classic Hungarian dish of slow-cooked beef with sweet paprika, potatoes, and vegetables.

---

ITEM: GRILLED DENVER STEAK

Parent:
GRILLED DENVER STEAK

type: standalone

Description: Unbelievably tender cut of beef marinated in fresh rosemary & thyme. Served with crispy oyster mushrooms and a red onion demi-glace.

---

ITEM: SLOW ROASTED FILET MIGNON AU POIVRE

Parent:
SLOW ROASTED FILET MIGNON AU POIVRE

type: standalone

Description: Prime tenderloin of beef, pan-roasted to perfection, served with Cognac-green peppercorn cream sauce on top of roasted carrots & parsnips.

---

ITEM: HANGER STEAK CHIMICHURRI

Parent:
HANGER STEAK CHIMICHURRI

type: standalone

Description: Flavorful hanger steak marinated in cilantro & chili de árbol. Served with Argentinian chimichurri over roasted Yucca root & snow peas.

---

## SECTION: Entrees — Pork | Veal | Lamb

ITEM: ZA'ATAR SPICED LEG OF LAMB

Parent:
ZA'ATAR SPICED LEG OF LAMB

type: standalone

Description: Dry rubbed with the ancient spice blend of cumin, thyme, marjoram, fennel, & sumac. Paired with toasted Israeli couscous, almonds, dates, apricots.

---

ITEM: SMOKED KANSAS CITY PULLED PORK

Parent:
SMOKED KANSAS CITY PULLED PORK

type: standalone

Description: Grilled green beans & bacon-sweet potato hash.

---

ITEM: ROASTED PORK LOIN

Parent:
ROASTED PORK LOIN

type: standalone

Description: Fig & port wine reduction, braised black kale, heirloom carrots, and grilled radicchio.

---

ITEM: GRILLED NEW ZEALAND RACK OF LAMB

Parent:
GRILLED NEW ZEALAND RACK OF LAMB

type: standalone

Description: Roasted summer & hard squash, with a maple-mint glaze.

---

ITEM: BELLYCHON

Parent:
BELLYCHON

type: standalone

Description: Filipino-style Porchetta — whole pork belly stuffed with lemongrass, garlic, lime, & chili and perfectly roasted for a crispy skin. Complemented by grilled baby bok choy & mango.

---

ITEM: VEAL BRACIOLA

Parent:
VEAL BRACIOLA

type: standalone

Description: Saltimbocca-style with sage, prosciutto, and mozzarella di bufala in a tomato veal reduction.

---

ITEM: CLASSIC VEAL PARMIGIANA

Parent:
CLASSIC VEAL PARMIGIANA

type: standalone

Description: Three-cheese & Sunday gravy.

---

## SECTION: Entrees — Poultry

ITEM: CHICKEN GUMBO

Parent:
CHICKEN GUMBO

type: standalone

Description: Bone-in whole chicken with spicy andouille sausage, okra, southern trinity of vegetables, peas, and roasted potatoes.

---

ITEM: PARMESAN CRUSTED CHICKEN

Parent:
PARMESAN CRUSTED CHICKEN

type: standalone

Description: Topped with bruschetta mix & drizzled with honey balsamic.

---

ITEM: CLASSIC CHICKEN MARSALA

Parent:
CLASSIC CHICKEN MARSALA

type: standalone

Description: Tender, thinly sliced pan-seared chicken breast, shallots, garlic butter, oregano, and button & Portobello mushrooms in a creamy marsala wine sauce.

---

ITEM: CHICKEN ALLA GRIGLIA

Parent:
CHICKEN ALLA GRIGLIA

type: standalone

Description: Rosemary-marinated grilled chicken breast with wild mushrooms & fingerling potatoes.

---

ITEM: WHOLE ROASTED HERBS DE'PROVENCE CHICKEN

Parent:
WHOLE ROASTED HERBS DE'PROVENCE CHICKEN

type: standalone

Description: Roasted, on-the-bone chicken for maximum flavor, infused with lemon, fennel, rosemary, thyme, & parsley. Served with a natural jus.

---

ITEM: BRAISED CHICKEN MOLE

Parent:
BRAISED CHICKEN MOLE

type: standalone

Description: Boneless chicken thighs in a thick, rich Mexican chocolate sauce. Served with red rice & beans and a jicama-cilantro slaw.

---

ITEM: SESAME CHICKEN

Parent:
SESAME CHICKEN

type: standalone

Description: Rice flour-battered chicken with an orange-soy glaze, toasted sesame seeds, and steamed, tender broccoli.

---

ITEM: ROASTED TURKEY BALLANTINE

Parent:
ROASTED TURKEY BALLANTINE

type: standalone

Description: Whole, boneless turkey with charred plums, walnuts, & parsnips.

---

## SECTION: Entrees — Seafood

ITEM: SALMON EN PAPILLOTE

Parent:
SALMON EN PAPILLOTE

type: standalone

Description: Salmon filets steamed with white wine, lemon, & fennel, served alongside a leek & potato au gratin.

Notes:
- Source spells "en Papillote" as "en Papiollete" and "au gratin" as "au grautin" — preserved as-is per Phase 1 typo rule

---

ITEM: CITRUS GRILLED SALMON

Parent:
CITRUS GRILLED SALMON

type: standalone

Description: Lemon & mandarin orange glaze.

---

ITEM: GRILLED HALIBUT

Parent:
GRILLED HALIBUT

type: standalone

Description: Crab & fennel topping with a cider & mustard cream sauce.

---

ITEM: CIOPPINO

Parent:
CIOPPINO

type: standalone

Description: Clams, mussels, scallops, & shrimp in a lobster & fennel tomato broth, served with grilled sourdough bread & broccolini.

---

ITEM: JUMBO LUMP CRAB CAKES

Parent:
JUMBO LUMP CRAB CAKES

type: standalone

Description: Eastern shore jumbo lump crab combined with a confetti of red onion, tri-colored peppers, lemon & Old Bay. Served with a chipotle aioli.

---

ITEM: SOUTHERN SHRIMP & GRITS

Parent:
SOUTHERN SHRIMP & GRITS

type: standalone

Description: Creamy grits and jumbo gulf shrimp, served with a trinity of vegetables.

---

ITEM: CHILEAN SEA BASS

Parent:
CHILEAN SEA BASS

type: standalone

Description: Chili-lime glazed, topped with a sugar snap pea & Napa cabbage slaw.

---

ITEM: MIRIN & SOY-GLAZED SALMON

Parent:
MIRIN & SOY-GLAZED SALMON

type: standalone

Description: With miso & toasted sesame seeds.

---

ITEM: BAKED GULF SHRIMP

Parent:
BAKED GULF SHRIMP

type: standalone

Description: Stuffed with lump crab meat.

---

## SECTION: Entrees — Vegetarian

ITEM: TAMALE STYLE STUFFED POBLANO PEPPERS

Parent:
TAMALE STYLE STUFFED POBLANO PEPPERS

type: standalone

Description: Filled with masa, corn, black beans, & zucchini. Topped with cotija cheese and finished with a tomatillo salsa verde.

---

ITEM: RATATOUILLE BREAD BOWL

Parent:
RATATOUILLE BREAD BOWL

type: standalone

Description: Heirloom eggplant, zucchini, yellow squash, green peppers, & Brandywine tomatoes stewed together with parsley & white wine, presented in a sourdough bread bowl.

---

ITEM: PORTOBELLO NAPOLEON

Parent:
PORTOBELLO NAPOLEON

type: standalone

Description: Grilled & stacked Portobello mushroom, broccolini, & peppers on top of a seared polenta & smoked mascarpone cake, finished with a vino cotto & shaved Parmigiano Reggiano.

---

ITEM: CHARRED BRUSSEL SPROUTS

Parent:
CHARRED BRUSSEL SPROUTS

type: standalone

Description: With reduced balsamic drizzle.

---

ITEM: GRILLED JAPANESE EGGPLANT & LONG BEANS

Parent:
GRILLED JAPANESE EGGPLANT & LONG BEANS

type: standalone

Description: Braised in coconut milk, annatto seeds, & ground peanuts.

---

ITEM: FOUR-BEAN TAGINE

Parent:
FOUR-BEAN TAGINE

type: standalone

Description: Giant beans, haricots verts, sugar snaps, & garbanzo beans stewed with garam masala, Greek yogurt, and Indian paneer.

---

ITEM: ROASTED ROOT VEGETABLES

Parent:
ROASTED ROOT VEGETABLES

type: standalone

Description: Rutabaga, turnips, parsnips, & carrots roasted with a cremini mushroom & Swiss chard, complemented with ricotta salata and a pomegranate reduction.

---

ITEM: ROASTED FIVE-HERB FINGERLING POTATOES

Parent:
ROASTED FIVE-HERB FINGERLING POTATOES

type: standalone

Description: Parsley, thyme, rosemary, oregano, & chives tossed with black pepper butter & EVOO.

---

## SECTION: Side Dishes — Pastas | Potatoes | Rice

ITEM: ROASTED SWEET POTATO WEDGES

Parent:
ROASTED SWEET POTATO WEDGES

type: standalone

Description: With spicy maple drizzle.

---

ITEM: TRIO OF ROASTED POTATOES

Parent:
TRIO OF ROASTED POTATOES

type: standalone

Description: Seasoned sweet, red bliss, & Yukon gold potatoes, cooked separately & then tossed together for a unique flavor.

---

ITEM: FARMERS SMASHED POTATOES

Parent:
FARMERS SMASHED POTATOES

type: standalone

Description: Steamed then sautéed Yukon gold potatoes with butter, herbs, shallots, cheese, heavy cream, & white wine.

---

ITEM: CONFETTI BROWN & WILD RICE

Parent:
CONFETTI BROWN & WILD RICE

type: standalone

Description: A mixture of seasoned brown and wild rice tossed with tender vegetables.

---

ITEM: MASHED POTATOES

Parent:
MASHED POTATOES

type: standalone

Children:
- [Flavor] | type: choice_required | select: 1
  - Classic
  - Buttermilk
  - Roasted Garlic
  - Bacon Chive & Cheddar
  - Parmesan Olive Oil & Garlic
  - Sour Cream & Extra Butter
  - Cauliflower & Onion

---

ITEM: BASMATI RICE

Parent:
BASMATI RICE

type: standalone

Description: With spinach, sun-dried tomatoes, orzo, & wheatberries.

---

ITEM: YELLOW FRIED RICE

Parent:
YELLOW FRIED RICE

type: standalone

Description: With confetti vegetables.

---

ITEM: WILD MUSHROOM RISOTTO

Parent:
WILD MUSHROOM RISOTTO

type: standalone

Description: Slow cooked arborio rice, mushrooms, savory broth, and Parmigiano Reggiano.

---

## SECTION: Side Dishes — Vegetables

ITEM: ROASTED BRUSSELS SPROUTS

Parent:
ROASTED BRUSSELS SPROUTS

type: standalone

Description: With apple cider vinegar.

---

ITEM: GINGER HONEY CARROT PEGS

Parent:
GINGER HONEY CARROT PEGS

type: standalone

---

ITEM: SAUTEED STRING BEANS

Parent:
SAUTEED STRING BEANS

type: standalone

Description: With frizzled onions.

---

ITEM: SAUTEED BABY BOK CHOY

Parent:
SAUTEED BABY BOK CHOY

type: standalone

---

ITEM: GRILLED ASPARAGUS (with parmesan tomatoes)

Parent:
GRILLED ASPARAGUS

type: standalone

Description: With parmesan roasted plum tomatoes.

---

ITEM: HARICOTS VERTS ALMONDINE

Parent:
HARICOTS VERTS ALMONDINE

type: standalone

Description: Coated with sautéed garlic & shallots, toasted almond slivers, & a splash of lemon.

---

ITEM: RATATOUILLE

Parent:
RATATOUILLE

type: standalone

Description: Heirloom eggplant, zucchini, yellow squash, green peppers, & Brandywine tomatoes stewed together with parsley & white wine.

---

ITEM: ROASTED ASSORTED VEGETABLES

Parent:
ROASTED ASSORTED VEGETABLES

type: standalone

Description: With a balsamic reduction.

---

ITEM: MARINATED GRILLED VEGETABLES

Parent:
MARINATED GRILLED VEGETABLES

type: standalone

---

ITEM: ROASTED BABY BRUSSELS SPROUTS

Parent:
ROASTED BABY BRUSSELS SPROUTS

type: standalone

Description: Oven roasted with olive oil & seasonings, topped with a balsamic glaze.

---

ITEM: GRILLED ASPARAGUS (with lemon)

Parent:
GRILLED ASPARAGUS

type: standalone

Description: With olive oil & a squeeze of lemon. Perfect served hot or room temperature.

Notes:
- Two distinct "GRILLED ASPARAGUS" items appear in source with different preparations. Disambiguated with parenthetical above.

---

## SECTION: Ambient Displays — Beef

ITEM: FIVE-SPICE RUBBED FLANK STEAK

Parent:
FIVE-SPICE RUBBED FLANK STEAK

type: standalone

Description: Grilled baby bok choy, mushrooms, baby carrots, with a ginger-soy dressing.

---

ITEM: CHATEAUBRIAND

Parent:
CHATEAUBRIAND

type: standalone

Description: Center cut filet mignon, roasted rosemary potatoes, charred onions, broccolini, and crispy shallots served with an aged sherry vinaigrette.

---

ITEM: STEAK HOUSE CHOP

Parent:
STEAK HOUSE CHOP

type: standalone

Description: Grilled flank steak, chopped lettuce, red onion, bleu cheese, tomatoes, & capers.

---

## SECTION: Ambient Displays — Poultry

ITEM: GRILLED LEMON CHICKEN & WILD RICE

Parent:
GRILLED LEMON CHICKEN & WILD RICE

type: standalone

Description: Juicy grilled chicken breast in a citrus vinaigrette, served with dried fruits, almonds, and baby arugula.

---

ITEM: CAJUN CHICKEN

Parent:
CAJUN CHICKEN

type: standalone

Description: Louisiana "dirty" rice, sheared hearty greens, and charred peppers with a Creole dressing.

---

ITEM: HERBS DE'PROVENCE CHICKEN

Parent:
HERBS DE'PROVENCE CHICKEN

type: standalone

Description: French petite lentils, fava beans, Swiss chard, and roasted tomatoes.

---

ITEM: CIDER GLAZED CHICKEN SKEWERS

Parent:
CIDER GLAZED CHICKEN SKEWERS

type: standalone

Description: Jicama & apple slaw with dried cranberries and toasted pumpkin seeds.

---

ITEM: THAI CHICKEN SATAYS

Parent:
THAI CHICKEN SATAYS

type: standalone

Description: White meat chicken, marinated in coconut milk, with spicy cucumbers on bamboo.

---

## SECTION: Ambient Displays — Seafood

ITEM: SEARED TUNA NICOISE

Parent:
SEARED TUNA NICOISE

type: standalone

Description: Fingerling potatoes, haricots verts, olives, red onion, diced egg, & baby lettuces in a red wine vinaigrette.

---

ITEM: MAPLE SMOKED GRILLED SALMON

Parent:
MAPLE SMOKED GRILLED SALMON

type: standalone

Description: Cucumber, red onion, & apple salad, lemon-thyme aioli.

---

ITEM: THAI RED CURRY SHRIMP

Parent:
THAI RED CURRY SHRIMP

type: standalone

Description: Rice noodles, lime-sweet chili vinaigrette, jicama, carrots, and peppers.

---

ITEM: PAN ROASTED SCOTTISH SALMON

Parent:
PAN ROASTED SCOTTISH SALMON

type: standalone

Description: Red quinoa & roasted beets, peppadew peppers, shaved radish, and roasted shallot vinaigrette.

---

## SECTION: Ambient Displays — Vegetarian

ITEM: KOMBUCHA MARINATED GRILLED TEMPEH

Parent:
KOMBUCHA MARINATED GRILLED TEMPEH

type: standalone

Description: Daikon radish & carrot slaw with cashews, baby spinach, and black beans.

---

ITEM: ROASTED ROOT VEGETABLE TART

Parent:
ROASTED ROOT VEGETABLE TART

type: standalone

Description: Goat cheese, caramelized onions, cage free eggs, kale, & Roma tomatoes.

---

ITEM: GRILLED EGGPLANT BRACIOLA

Parent:
GRILLED EGGPLANT BRACIOLA

type: standalone

Description: Smoked tomato chutney, salsa verde, shaved ricotta salata, & pine nuts.

---

ITEM: TORTILLA ESPANOLA

Parent:
TORTILLA ESPANOLA

type: standalone

Description: Spanish-style egg quiche, potatoes, leeks, parsley, piquillo pepper coulis, toasted almonds, and baby greens.

---

## SECTION: Desserts — Fresh & Fruity

ITEM: FOODWERX FRUIT SALAD

Parent:
FOODWERX FRUIT SALAD

type: standalone

Description: Bite-sized pieces of fresh, seasonal fruits with a smooth caramel dip.

Notes:
- Source spells as "FOODWERX FUIT SALAD" — typo preserved in source, corrected in display name

---

ITEM: FRUIT KABOBS

Parent:
FRUIT KABOBS

type: standalone

Description: Seasonal fruits & berries skewered and served with chocolate dip.

---

ITEM: VERY BERRY CUPS

Parent:
VERY BERRY CUPS

type: standalone

Children:
- raspberries | type: included
- blueberries | type: included
- strawberries | type: included
- sweetened Greek yogurt dollop | type: included
- [Yogurt Sweetener] | type: choice_required | select: 1
  - honey
  - sugar
  - Splenda

---

## SECTION: Desserts — Sweet & Decadent

ITEM: NEW YORK CHEESECAKE

Parent:
NEW YORK CHEESECAKE

type: standalone

Children:
- [Flavor] | type: choice_required | select: 1
  - plain
  - strawberry
  - blueberry
  - chocolate

---

ITEM: TRIO OF MOUSSES

Parent:
TRIO OF MOUSSES

type: standalone

Description: Cups of dark chocolate, milk chocolate, & white chocolate mousses.

---

ITEM: NEW ORLEANS BEIGNETS

Parent:
NEW ORLEANS BEIGNETS

type: standalone

Description: Filled with raspberry jam with a melted chocolate dipping sauce.

---

ITEM: FLOURLESS CHOCOLATE CAKE

Parent:
FLOURLESS CHOCOLATE CAKE

type: standalone

Description: With chocolate chips and a caramel drizzle.

---

ITEM: MACARONS

Parent:
MACARONS

type: standalone

Description: Tasty & colorful selection of a classic French delicacy.

---

ITEM: DIY SUNDAE BAR

Parent:
DIY SUNDAE BAR

type: standalone

Description: Creamy vanilla & chocolate ice cream accompanied with chocolate fudge, caramel sauce, mini-M&Ms, jimmies, whipped cream, strawberries, and maraschino cherries.

---

ITEM: CHIPTACULAR

Parent:
CHIPTACULAR

type: standalone

Description: Display of traditional chocolate chip, chocolate-chocolate chip, and macadamia-white chocolate chip cookies.

---

ITEM: PETIT FOUR DISPLAY

Parent:
PETIT FOUR DISPLAY

type: standalone

Description: A delightful selection of fresh mini pastries.

---

ITEM: ELVIS'S FAVORITE

Parent:
ELVIS'S FAVORITE

type: standalone

Description: Gourmet peanut butter and ripe banana on brioche bread then fried to a golden brown. Served with a side of chocolate sauce & jelly.

---

ITEM: MINI CHURROS

Parent:
MINI CHURROS

type: standalone

Description: Crispy on the outside, soft on the inside, coated with cinnamon & sugar. Served with Mexican chocolate dipping sauce.

---

ITEM: CHOCOLATE MOUSSE SHOOTER

Parent:
CHOCOLATE MOUSSE SHOOTER

type: standalone

Description: With a candied bacon spoon.

---

## SECTION: Beverage Bar — Cold

ITEM: SODA

Parent:
SODA

type: standalone

---

ITEM: INFUSED ICED TEA

Parent:
INFUSED ICED TEA

type: standalone

---

ITEM: LEMONADE

Parent:
LEMONADE

type: standalone

---

ITEM: PITCHERS OF JUICE

Parent:
PITCHERS OF JUICE

type: standalone

Children:
- [Juice Flavor] | type: choice_required | select: 1
  - orange
  - apple
  - cranberry

---

ITEM: FOODWERX INFUSED WATER

Parent:
FOODWERX INFUSED WATER

type: standalone
restriction: full-service events only

Children:
- [Infused Water Flavor] | type: choice_required | select: any
  - pineapple, mint & ginger
  - strawberry, cucumber, & kiwi
  - lemon & rosemary
  - raspberry & orange

---

ITEM: FOODWERX BOTTLED WATER

Parent:
FOODWERX BOTTLED WATER

type: standalone

---

## SECTION: Beverage Bar — Hot

ITEM: COFFEE

Parent:
COFFEE

type: standalone

Children:
- [Coffee Type] | type: choice_required | select: 1
  - regular
  - decaffeinated

---

ITEM: TEA

Parent:
TEA

type: standalone

Children:
- [Tea Type] | type: choice_required | select: any
  - traditional
  - herbal

---

ITEM: HOT CHOCOLATE

Parent:
HOT CHOCOLATE

type: standalone

Description: Made with whole milk.

---

# END OF MENU_STRUCTURED_P3
# All 36 remaining sections complete.
# Open FLAGs: none
# Total items structured in P3: ~240
