# Patch 35.4 — Mend / CATA event card inventory

Placeholder ids live in [`TempCardIds`](libs/shared/framework/core/src/lib/temp-card-ids.ts). Rules text below was **transcribed from card PNGs** (image read); verify against the game client when ids land in `hs-reference-data`.

**Legend — standard Firestone work (see AGENTS.md)**

- **gen**: card or token creates unknown cards in hand → `GeneratingCard` / `guessInfo` (and discover filter if Discover wording).
- **pool**: summons or effects from a filtered random pool (no card in hand) → `StaticGeneratingCard` / `dynamicPool`.
- **hl**: deck highlight / selector request.
- **special**: likely custom parser, chain, position-in-hand, or start-of-game — see Notes.

| TempCardIds (enum member) | Placeholder id | dbfId | Name | Type | Card text (transcribed) | Needs game-state / tracker work | Buckets | Special implementation notes |
|---------------------------|----------------|-------|------|------|---------------------------|----------------------------------|-----------|------------------------------|
| DruidMend040AshWorm | TEMP_MEND_040 | 123472 | Ash Worm | Minion 1 mana 6/6 Beast | **Dormant.** When your board is full, awaken. | Yes | special | Dormant + board-full awaken; may need `willBeActive` / state hooks beyond default minion handling. |
| DruidMend041WizenedWildspeaker | TEMP_MEND_041 | 123478 | Wizened Wildspeaker | Minion 5 3/7 | **Taunt.** **Battlecry:** If you didn't play a minion last turn, refresh 3 Mana Crystals. | Likely minimal | hl? | Prior-turn minion tracking for highlights if useful. |
| DruidMend042Lifebloom | TEMP_MEND_042 | 123485 | Lifebloom | Spell 9 Nature | Restore 8 Health to all friendly characters. Summon two random 8-Cost minions. | Yes | pool, hl | Random 8-cost summons → `dynamicPool` (not discover). |
| DruidMend043HeartrootStones | TEMP_MEND_043 | 123481 | Heartroot Stones | Spell 3 Nature | Draw a card and gain 3 Armor. If you didn't play a minion last turn, do it again. | Likely minimal | hl? | Repeat effect = prior-turn tracking. |
| DruidMend044TranquilClearing | TEMP_MEND_044 | 123483 | Tranquil Clearing | Location 2 (2 charges) | Give a minion +2 Health and **Taunt**. It falls asleep until the end of your next turn. | Likely | special | Location cooldown/durability; “sleep” duration unusual — possible custom effect tracking. |
| DruidMend045SeedingDragon | TEMP_MEND_045 | 123482 | Seeding Dragon | Minion 4 4/4 Dragon | **Taunt.** **Deathrattle:** Get a random **Dragon**. It costs (2) less. | Yes | gen | Random Dragon to hand + cost reduction → `guessInfo` / generating card. |
| DruidMend046BashanaRunetotem | TEMP_MEND_046 | 123493 | Bashana Runetotem | Minion 7 4/4 Legendary | **Battlecry:** Get three 2/2 Treants. Carve 12 Mana worth of Nature spells into them. | Yes | gen, special | **Carve** is set-specific: three Treants plus spell distribution / stored effects — likely heavy `guessInfo`, possible `storedInformation`, related-card UI. |
| DruidMend046tTreant | TEMP_MEND_046t | 130722 | Treant | Minion 1 2/2 | **Battlecry:** Cast another card. | Yes | gen, special | Non-standard: implies a **linked card** to cast from Treant — needs dedicated logic; parent is Bashana. |
| HunterMend300TamePet | TEMP_MEND_300 | 123486 | Tame Pet | Spell 1 | Replace your future Animal Companions with random Beasts that cost (1) more. Draw a card. | Likely | special, hl | Deck aura modifying **Animal Companion** resolution; tracker may need flag + pool substitution (Beasts +1 cost). |
| HunterMend301Spiritspeaker | TEMP_MEND_301 | 123488 | Spiritspeaker | Minion 4 2/2 | **Battlecry:** Choose an **Animal Companion** to summon. | Yes | pool, special | **Choose One** into Huffer/Misha/Leokk — choosing-options / static pool of three ids. |
| HunterMend302WastelandVanguard | TEMP_MEND_302 | 123490 | Wasteland Vanguard | Minion 4 3/3 Epic | **Battlecry:** Deal 3 damage split among all enemies. If any die, deal 3 more. | Likely minimal | — | Conditional follow-up damage; mostly engine. |
| HunterMend303MigratingElekk | TEMP_MEND_303 | 123491 | Migrating Elekk | Minion 3 3/4 Beast | **Taunt. Battlecry:** Replace your future **Animal Companions** with random **Beasts** that cost (1) more. | Likely | special, hl | Same replacement aura as Tame Pet class. |
| HunterMend304TalyaEarthstrider | TEMP_MEND_304 | 123492 | Talya Earthstrider | Minion 5 4/6 Legendary | **Battlecry:** Your cards that summon Animal Companions summon 1 more this game. | Likely | special, hl | Persistent counter affecting companion summons. |
| HunterMend305NurturingNature | TEMP_MEND_305 | 123510 | Nurturing Nature | Spell 2 Nature | Give a friendly Beast +2/+2. Give a random Beast in your hand +2/+2. | Likely minimal | hl | Hand buff may matter for highlights. |
| HunterMend307RoamFree | TEMP_MEND_307 | 123513 | Roam Free | Spell 7 Epic | Replace your future Animal Companions with random Beasts that cost (2) more. Choose one to summon. | Yes | pool, special | Replacement aura + **Discover-style** pick + immediate summon (5-cost Beasts vs 3-cost spell baseline). |
| MageMend500BurstingLeyline | TEMP_MEND_500 | 123495 | Bursting Leyline | Spell 4 Arcane | Deal 4 damage to a random enemy minion. Excess damage hits the enemy hero. | Likely minimal | hl | “Excess” pattern for tracker if anything keys off it. |
| MageMend501LeyWalker | TEMP_MEND_501 | 123496 | Ley Walker | Minion 3 4/2 Epic | **Battlecry:** Your Leylines cost (1) less this game. **Deathrattle:** Get a random Leyline. | Yes | gen, special | **Leyline** subgroup cost aura + random Leyline to hand — need tagged pool / `guessInfo`. |
| MageMend502CrystallizedLeyline | TEMP_MEND_502 | 123504 | Crystallized Leyline | Spell 6 Arcane | Summon a random 6-Cost minion. | Yes | pool | Random 6-cost minion from format pool. |
| MageMend503SurgeNeedle | TEMP_MEND_503 | 123507 | Surge Needle | Minion 4 3/3 | **Battlecry:** Your Leylines trigger an additional time this game. | Likely | special, hl | Stacking global modifier on “Leyline” trigger count — possible `custom-effects` / metadata. |
| MageMend504LeylineNexus | TEMP_MEND_504 | 123508 | Leyline Nexus | Spell 2 Arcane | Draw a card. It costs (1) less. | Likely minimal | — | Cost buff on drawn card only. |
| MageMend505TheArcanomicon | TEMP_MEND_505 | 123514 | The Arcanomicon | Spell 7 Arcane Legendary | Get all 3 Leylines. Choose an upgrade for your Leylines. | Yes | gen, special | Adds specific three cards + **Choose** upgrade (ties to Energize/Unblock/Empower tokens) — related cards, possible **chain / discover** handling. |
| MageMend505tEnergize | TEMP_MEND_505t | 123497 | Energize | Spell (0) | Your Leylines trigger an additional time this game. | Likely | special | Upgrade token; same Leyline trigger modifier as Surge Needle stack. |
| MageMend505t2Unblock | TEMP_MEND_505t2 | 123499 | Unblock | Spell (0) | Your Leylines cost (2) less this game. | Likely | special | Global Leyline cost reduction. |
| MageMend505t3Empower | TEMP_MEND_505t3 | 123501 | Empower | Spell (0) | Increase the effects of your Leylines by 2 this game. | Likely | special | Numeric scaler on Leyline effects — novel for Firestone; may need bespoke hooks. |
| MageMend506MysticRunesaber | TEMP_MEND_506 | 123515 | Mystic Runesaber | Minion 2 2/3 Beast | **Elusive.** **Battlecry:** Increase the effects of your Leylines by 1 this game. | Likely | special | Same Leyline scaler family as Empower. |
| NeutralMend100CultivatingSprite | TEMP_MEND_100 | 123849 | Cultivating Sprite | Minion 3 3/3 Epic | **Battlecry:** Get a 3-Cost Bulb that casts three random 1-Cost spells. It upgrades each turn. | Yes | gen | Generates **Blooming Bulb** with turn-based upgrade in hand — `guessInfo` + possibly position/stored power on card entity. |
| NeutralMend100tBloomingBulb | TEMP_MEND_100t | 123854 | Blooming Bulb | Spell 3 Nature | Cast three random 1-Cost spells. *(Upgrades each turn!)* | Yes | gen, pool | Count scales in hand; random **1-cost spells** (full pool, not discover) — `guessInfo` / variance per cast. |
| PaladinMend800BrashBattlemaster | TEMP_MEND_800 | 123620 | Brash Battlemaster | Minion 2 2/1 | **Rush.** **Deathrattle:** Give your Silver Hand Recruits +1 Attack this game. | Likely | hl | Rest-of-game buff to recruit tribe. |
| PaladinMend801ResilientSavior | TEMP_MEND_801 | 123621 | Resilient Savior | Minion 3 3/1 Draenei Epic | **Divine Shield.** After this loses **Divine Shield**, give your Silver Hand Recruits +1 Health this game. | Likely | hl | Shield-loss trigger + persistent recruit buff. |
| PaladinMend802Convalescence | TEMP_MEND_802 | 123622 | Convalescence | Spell 2 Holy | Summon two 1/1 Silver Hand Recruits with **Divine Shield**. | Likely minimal | — | Token summon with keyword. |
| PaladinMend803EmboldeningBlade | TEMP_MEND_803 | 123623 | Emboldening Blade | Weapon 5 3/2 | **Battlecry:** Give your Silver Hand Recruits +1/+1 this game. | Likely | hl | Persistent recruit stat aura. |
| PaladinMend804AratortheRedeemer | TEMP_MEND_804 | 123624 | Arator the Redeemer | Minion 5 5/6 Legendary | **Battlecry:** Double the stats of all friendly **Silver Hand Recruits** and give them **Taunt**. | Likely | hl | Board-only snapshot buff. |
| PaladinMend805Charity | TEMP_MEND_805 | 123625 | Charity | Spell 3 Epic | Get copies of all friendly minions that died this turn. Give them +3/+3. | Yes | gen, special | **Turn scoped** deaths → copies to hand with buff; likely heavy tracking / `guessInfo` for created cards. |
| PaladinMend900Teamwork | TEMP_MEND_900 | 127427 | Teamwork | Spell 4 | Summon and get four 1/1 Silver Hand Recruits. | Likely minimal | — | Four to board + four to hand (eight cards’ worth of recruits) — confirm token ids for deck rules. |
| NeutralCataEvent110DragonSoulShattered | TEMP_CATA_EVENT_110 | 123345 | Dragon Soul, Shattered | Spell? 6 Legendary | **Start of Game:** Break into 6 Essences. Adjoining Essences are cast together. | Yes | special | **Start of Game** deck swap + 6 essences; **hand adjacency** rules when casting — likely **chain parser**, position-in-hand, related cards; highest complexity. |
| NeutralCataEvent110t2RedAspectEssence | TEMP_CATA_EVENT_110t2 | 123339 | Red Aspect Essence | Spell 6 Legendary | Deal 8 damage to an enemy. Cast every adjoining Aspect Essence. | Yes | special | **Adjoining** in hand → cascade cast neighbors; needs position index at resolution. |
| NeutralCataEvent110t3BlueAspectEssence | TEMP_CATA_EVENT_110t3 | 123340 | Blue Aspect Essence | Spell 6 Legendary | Draw 3 spells. Cast every adjoining Aspect Essence. | Yes | special | Draw filtered + adjacency cascade. |
| NeutralCataEvent110t4BronzeAspectEssence | TEMP_CATA_EVENT_110t4 | 123341 | Bronze Aspect Essence | Spell 6 Legendary | Refresh 7 Mana Crystals. Cast every adjoining Aspect Essence. | Yes | special | Mana refresh + adjacency cascade. |
| NeutralCataEvent110t5BlackAspectEssence | TEMP_CATA_EVENT_110t5 | 123342 | Black Aspect Essence | Spell 6 Legendary | Gain 12 Armor. Cast every adjoining Aspect Essence. | Yes | special | Armor + adjacency cascade. |
| NeutralCataEvent110t6GreenAspectEssence | TEMP_CATA_EVENT_110t6 | 123343 | Green Aspect Essence | Spell 6 Legendary | Summon an 8/8 Dragon. Cast every adjoining Aspect Essence. | Yes | pool, special | Likely summons **Searing Skystriker** or generic 8/8 token + cascade. |
| NeutralCataEvent110t6tSearingSkystriker | TEMP_CATA_EVENT_110t6t | 132017 | Searing Skystriker | Minion 8 8/8 Dragon | *(no rules text)* | Minimal | — | Vanilla token — pool/summon only. |
| NeutralCataEvent110t7StormAspectEssence | TEMP_CATA_EVENT_110t7 | 123349 | Storm Aspect Essence | Spell 6 Legendary | Deal 3 damage to all enemy minions. Cast every adjoining Aspect Essence. | Yes | special | AoE + adjacency cascade. |

## Cross-cutting themes

- **Leyline (Mage):** Define a stable list of card ids (Bursting, Crystallized, Ley Walker, Leyline Nexus, …) for cost/trigger/effect modifiers; upgrades (Energize / Unblock / Empower) stack with Surge Needle / Mystic Runesaber.
- **Animal Companion replacement (Hunter):** Tame Pet, Migrating Elekk, Roam Free share a rules family — one implementation pattern with different cost offsets (+1 vs +2) and Roam Free’s summon branch.
- **Silver Hand Recruits (Paladin):** Several “this game” buffs — highlights may key off recruiter synergy.
- **Aspect Essences:** All share second clause; implement **once** as shared helper keyed by `TEMP_CATA_EVENT_110t*`.

## When real `CardIds` exist

Replace `TempCardIds` string values and usages with `@firestone-hs/reference-data` ids; keep this doc as mechanics reference until `cards_short.json` is authoritative.
