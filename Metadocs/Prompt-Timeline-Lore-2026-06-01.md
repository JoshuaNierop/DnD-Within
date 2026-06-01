# Werkopdracht — Timeline & Lore overhaul (2026-06-01)

> Verbatim prompt van Joshua, vastgelegd zodat de voortgang herstelbaar is als er iets vastloopt.

## Originele prompt

1. **Timeline — editor sluit bij scene-commit.** Als ik de sessie edit of een nieuwe
   sessie aanmaak is er een functie die zorgt dat wanneer ik een nieuwe scene aanmaak
   of een andere scene edit dan de huidige, dat dan de huidige scene wordt opgeslagen.
   Als dit gebeurt, dan sluit de sessie die ik aan het editen ben. Ik had die functie
   ingebouwd zodat je niet een lang verhaal kwijt bent als iets per ongeluk vastloopt
   (ik weet niet of dit nog nodig is). Kijk wat er misgaat en fix het.

2. **Timeline — afbeelding top-alignment.** De afbeelding in de scenes zit top aligned,
   waar de tekst niet top aligned is, hierdoor steekt de afbeelding steeds wat boven de
   tekst uit. De afbeelding zou top aligned moeten zijn met `class="scene-split-text"`,
   of in ieder geval dezelfde hoeveelheid top padding moeten hebben.

3. **Timeline — afbeelding left padding.** De afbeeldingen in scenes mogen iets meer
   left padding (50% meer).

4. **Timeline — sessie-volgorde.** Zet op de timeline de sessies van laag (boven) naar
   hoog (beneden), zodat er van boven naar beneden een chronologisch verhaal staat.
   Alleen de volgorde aanpassen, niets aan de content veranderen.

5. **Lore — tabbladen.** Op de lore-pagina wil ik tabbladen: Items, NPC's, Religions,
   Factions, Cities, Monsters (wat zou hier nog meer handig zijn?). NPC's mag verplaatst
   worden van DM tools naar het NPC's-tabblad op de Lore-pagina.

6. **Lore (NPC-tab).** Bovenaan de NPC-tab een searchbar + filters. NPC's hebben cards
   met vaste grootte (2x3 portret met basic info); klik = expand (full page óf
   isotope-style tussen de cards). Cards tonen alleen naam + afbeelding (image-optie
   toevoegen). Expanded card toont: name, year of birth (age), race, class, relation,
   family, faction, religion, preferences, dislikes, pets, notes. Ideeën pitchen mag.

## Werkproces
Prompt opschrijven → planning maken → punt voor punt uitwerken → tussendoor Metadocs
bijwerken zodat bij vastlopen duidelijk is waar ik gebleven ben.
