# Clarifications & Deferred Decisions

Items that came up during implementation where a decision was made autonomously.
Review and override any of these as needed.

---

## Bear NPC

**Q: Should Bear quests be separate from the global QUESTS array?**
Decision: Yes — Bear has its own `bearQuests` array in GameScene (from `BEAR_QUESTS`).
Global QUESTS auto-complete silently and award tickets. Bear quests require walking to the bear
and clicking "Claim!" — more BSS-accurate.

**Q: Where is the Bear placed?**
Decision: `WORLD_W/2 + 480, WORLD_H - VILLAGE_H + 110` (right side of village, past the shop).
Can be adjusted in GameScene.js line where `new Bear(...)` is called.

**Q: Bear sprite source?**
Decision: Generated via PixelLab API (quadruped bear, low top-down, 32×32).
Saved to `public/assets/npc/bear/south.png`. Currently only south-facing; can generate
N/E/W directions and animate via PixelLab `animate_character` in future sessions.

---

## Egg System

**Q: Should eggs replace or supplement the "Buy Random Bee" button in ShopScene?**
Decision: Supplement — eggs appear as shop items alongside existing upgrades.
The old `tryBuyAnt()` flow (buy random bee for cash from ShopScene) is now superseded by
the three egg tiers. Consider removing the old "Buy Random Bee" button from ShopScene.

**Q: Should Gold Egg cost cash or tickets?**
Decision: Cash (220). Can be changed to tickets in ShopItems.js `getCost` if preferred.

**Q: Egg rarity pools:**
- Basic  (8 cash):  Worker 80%, Scout 15%, Harvester 5%
- Silver (45 cash): Scout 30%, Harvester 40%, Scholar 25%, Golden 5%
- Gold  (220 cash): Harvester 15%, Scholar 50%, Golden 35%

---

## Ladybug Field Blockers

**Q: Should ladybugs have health / combat?**
Decision: No combat this session. Ladybugs are passive field-blockers. Player proximity
(within 110px) scares them away faster (reduces their timer to 8s remaining).
On leaving they drop an XP orb reward.

**Q: Spawn rate / cap?**
Decision: One spawns every 35s, max 3 active at once. Only appear in Strawberry, Blueberry,
Bamboo Fields (the higher-yield zones). Adjust `LIFETIME_MS`, `SCARED_MS`, `SCARE_DIST`
constants in `Ladybug.js` to tune difficulty.

---

## Future Features (not yet implemented)

- **More Bear NPCs**: Mother Bear, Brown Bear (frequent ticket quests), Spirit Bear (late game)
- **Royal Jelly**: Consumable that re-rolls a bee's type — needs HiveScene integration
- **Star Treat**: Consumable that levels up a bee, improving its stats permanently
- **Gifted bees**: Special variant with bonus stats unlocked by feeding star treats
- **Pollen clouds**: Drifting particles that boost nearby bee yield
- **Mobs with combat**: Spiders/scorpions in higher zones that damage bees
- **Bear quests**: Add more quest tiers (per-zone honey goals, per-bee-type goals)
- **Bear NPC animations**: Use PixelLab `animate_character` to add idle/walk animations
