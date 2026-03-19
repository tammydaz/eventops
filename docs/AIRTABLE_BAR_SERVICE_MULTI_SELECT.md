# Bar Service: Multi-Select + Mimosa Bar in Airtable

The app treats **Bar Service** as a **Multiple select** field so you can choose more than one option (e.g. **Full Bar Package** and **Mimosa Bar**). It also supports the old **Single select** format (one value is read as an array of one).

## In Airtable

1. **Open your Events table** and find the Bar Service field (often named **"Bar Service Needed"** or similar).
2. **Change the field type** from **Single select** to **Multiple select** (click the field header → Customize field type → Multiple select).
3. **Add "Mimosa Bar"** as a choice if it’s not there:
   - In the same field customization, under **Options**, add a new option: **Mimosa Bar**.
4. **Suggested options** (you can add/rename to match):
   - N/A  
   - Full Bar Package  
   - Mimosa Bar  
   - FoodWerx Bartender Only  
   - FoodWerx Mixers Only  

5. **Save** the field. The app will load these choices and let users select multiple (e.g. Full Bar + Mimosa Bar). No code changes are needed after this; the app already reads and saves arrays for this field.

## In the app

- **Intake:** Bar Service is shown as **checkboxes** (multiple selections). Summary shows the selected options comma-separated.
- **BEO print:** If **Full Bar Package** is selected, the full bar mixers and signature drink flow apply. If **Mimosa Bar** is selected, the MIMOSA BAR section and mixers are added. Both can be selected for the same event.
