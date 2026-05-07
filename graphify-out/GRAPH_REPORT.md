# Graph Report - C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within  (2026-04-24)

## Corpus Check
- Large corpus: 49 files · ~1,505,121 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 242 nodes · 898 edges · 8 communities detected
- Extraction: 45% EXTRACTED · 55% INFERRED · 0% AMBIGUOUS · INFERRED: 497 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Ui Character|Ui Character]]
- [[_COMMUNITY_Ui World|Ui World]]
- [[_COMMUNITY_Core|Core]]
- [[_COMMUNITY_Ui Modals|Ui Modals]]
- [[_COMMUNITY_Ui World|Ui World]]
- [[_COMMUNITY_Ui Pages|Ui Pages]]
- [[_COMMUNITY_Ui Settings|Ui Settings]]
- [[_COMMUNITY_Sync|Sync]]

## God Nodes (most connected - your core abstractions)
1. `bindPageEvents()` - 73 edges
2. `t()` - 64 edges
3. `escapeHtml()` - 49 edges
4. `renderApp()` - 41 edges
5. `escapeAttr()` - 27 edges
6. `currentUserId()` - 23 edges
7. `renderCharacterSheet()` - 22 edges
8. `loadCharConfig()` - 20 edges
9. `renderParty()` - 20 edges
10. `isDM()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `bindPageEvents()` --calls--> `setSession()`  [INFERRED]
  C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\events.js → C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\core.js
- `bindPageEvents()` --calls--> `clearSession()`  [INFERRED]
  C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\events.js → C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\core.js
- `bindPageEvents()` --calls--> `setDMMode()`  [INFERRED]
  C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\events.js → C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\core.js
- `renderNavbar()` --calls--> `getSyncStatus()`  [INFERRED]
  C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\ui-pages.js → C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\sync.js
- `renderCharCard()` --calls--> `isUserOnline()`  [INFERRED]
  C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\ui-pages.js → C:\Users\joshu\Documents\Claude\Projects\Sites\D&D Within\sync.js

## Communities

### Community 0 - "Ui Character"
Cohesion: 0.14
Nodes (40): hasSpellcasting(), saveCharState(), formatMod(), getAbilityScore(), getAC(), getAllAbilityScores(), getHP(), getMaxCantrips() (+32 more)

### Community 1 - "Ui World"
Cohesion: 0.1
Nodes (36): lookupSpell(), saveCampaigns(), saveCharConfig(), saveCharConfigField(), saveImage(), getAbilityBreakdown(), bindPageEvents(), detectTouch() (+28 more)

### Community 2 - "Core"
Cohesion: 0.15
Nodes (34): applyUserTheme(), canEditWorld(), clearSession(), currentUser(), currentUserId(), generateInviteCode(), getActiveCampaign(), getAllCharacterIds() (+26 more)

### Community 3 - "Ui Modals"
Cohesion: 0.14
Nodes (33): canEdit(), capitalize(), classDisplayName(), getInfoFieldOptions(), loadImage(), raceDisplayName(), subclassDisplayName(), isSubclassVisible() (+25 more)

### Community 4 - "Ui World"
Cohesion: 0.19
Nodes (25): renderApp(), escapeAttr(), getRoute(), initRouter(), navigate(), getLang(), t(), renderMetamagicHTML() (+17 more)

### Community 5 - "Ui Pages"
Cohesion: 0.21
Nodes (22): postRenderEffects(), escapeHtml(), getCharacterIds(), loadCharConfig(), loadCharState(), guessTier(), renderFamilyNode(), renderFamilyTree() (+14 more)

### Community 6 - "Ui Settings"
Cohesion: 0.21
Nodes (16): showToast(), syncSaveUser(), handleSaveProfile(), bugSelectorClick(), bugSelectorEsc(), closeBugReportModal(), getElementDescriptor(), getElementPath() (+8 more)

### Community 7 - "Sync"
Cohesion: 0.23
Nodes (15): applyLeaves(), extractLeaves(), firebasePathToLocalKey(), getSyncStatus(), initFirebaseSync(), initPresence(), isUserOnline(), seedUsers() (+7 more)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bindPageEvents()` connect `Ui World` to `Ui Character`, `Core`, `Ui Modals`, `Ui World`, `Ui Pages`, `Ui Settings`?**
  _High betweenness centrality (0.266) - this node is a cross-community bridge._
- **Why does `t()` connect `Ui World` to `Ui Character`, `Ui World`, `Core`, `Ui Modals`, `Ui Pages`, `Ui Settings`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `renderApp()` connect `Ui World` to `Ui Character`, `Ui World`, `Core`, `Ui Modals`, `Ui Pages`, `Ui Settings`, `Sync`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Are the 69 inferred relationships involving `bindPageEvents()` (e.g. with `renderApp()` and `removeTooltipPopup()`) actually correct?**
  _`bindPageEvents()` has 69 INFERRED edges - model-reasoned connections that need verification._
- **Are the 62 inferred relationships involving `t()` (e.g. with `renderApp()` and `loadCharConfig()`) actually correct?**
  _`t()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Are the 48 inferred relationships involving `escapeHtml()` (e.g. with `bindPageEvents()` and `renderCharacterSheet()`) actually correct?**
  _`escapeHtml()` has 48 INFERRED edges - model-reasoned connections that need verification._
- **Are the 39 inferred relationships involving `renderApp()` (e.g. with `currentUser()` and `getRoute()`) actually correct?**
  _`renderApp()` has 39 INFERRED edges - model-reasoned connections that need verification._