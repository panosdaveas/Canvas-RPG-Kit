# Canvas RPG Kit — Claude Instructions

## Project Overview

Vanilla JS + HTML5 Canvas 2D RPG engine. No framework, no build required for dev — served with Vite (`npm run dev`). ES modules throughout. Tiled Map Editor for level content.

Canvas: 360×360px, pixel-perfect rendering. Grid: 16px cells. Target: 60 FPS fixed timestep.

## Architecture

### Initialization Flow
```
index.html → main.js → Resources.allLoaded() → Main scene → setLevel(Overworld) → GameLoop
```

### Directory Layout
```
src/
  state/           FSM: StateMachine.js, State.js, states/
  controllers/     AI & input: PlayerController, EnemyController, RoutineController, CompanionController
  combat/          attackHelpers, attackTypes, weapons/ (sword, bow, firearm, arrow)
  core/            ChunkManager, TiledChunk, GameObjectFactory
  objects/         Main, Level, Character (Hero/Enemy/Npc/Companion), Projectile,
                   Exit, Chest, Sign, TextBox, SpriteTextString, Inventory, Rod
  helpers/         grid.js, moveTowards.js, levelConfig.js, mapUtils.js
  levels/          Overworld.js, CaveLevel1.js
  ScreenEffects.js Fade-out/in/holdBlack queue used during level transitions
  GlobalState.js   Cross-level persistence (e.g. saved overworld position)
public/            Static assets (sprites, maps, fonts)
dist/maps/         Tiled JSON map output
```

### Key Systems

**GameObject** — base class, parent/child tree, `stepEntry()` → `ready()` once → `step()` per frame → `draw()` recursive. Destroy via `destroy()` / `detachChild()` — `destroy()` walks up the parent chain and calls `removeFromYSortedObjects` on the first ancestor that exposes it, so registered objects clean themselves up. Halt flags:
- `paused` — halts the entire subtree (this + descendants), no opt-out.
- `suspended` — halts only this node's own step. Children halt with it **by default**, unless a child sets `ignoreParentSuspend = true`. Used by encounter pause so Hero's body sprite freezes but its Companion child (which has `ignoreParentSuspend = true`) keeps animating.
- `suspendOnPause` — flag read by `Main._pauseFlagged()`; if truthy, the object gets `suspended = true` on `WORLD_PAUSE`. Character defaults to `true`; Projectile sets it to `true`; everything else defaults to `false`.

**GameLoop** — fixed 16.67ms timestep, accumulator, `requestAnimationFrame`. Uses `while (accumulatedTime >= timeStep)` to catch up when behind. (The inline comment in `GameLoop.js` notes the `if`-vs-`while` tradeoff; current choice is `while`.)

**State Machine** — `StateMachine` + `State` base with `enter/update/exit`. `blocksController` prevents controller updates (e.g. HitState, EntryState). Character has `get/set state` for backward compat. `Character._setupStateMachine()` registers the base states; subclasses override and call `super._setupStateMachine()` to add their own.

**States** (registered in base `Character`): `IdleState`, `MovingState`, `AttackingState`, `InteractingState`, `HitState`.
Hero adds: `ItemPickupState`, `EntryState` (walks Hero in from one tile back after level transitions; `blocksController = true`).
Companion has its own internal `StateMachine` whose states *are* its activation modes: `CompanionIdleState` (resting, no-op), `CompanionEquippingState` (bounce + pick weapon). New companion behaviors register here.

**Controllers** — decision layer only, never animate directly:
- `PlayerController`: keyboard → direction-hold threshold → tile moves. Keys: `0` unequip, `1` sword, `2` bow, `3` firearm, `ShiftRight` attack, `Space` action/interact.
- `EnemyController`: proximity detection → greedy pathfind toward hero → directional alignment → attack.
- `RoutineController`: scripted FACE/IDLE/MOVE_* commands with optional `loop` / `pingPong` (ping-pong inverts each direction on the backward pass).
- `CompanionController`: follow hero with configurable distance — currently **not wired up** and not used by the new Companion design (Companion is parented to Hero, so positional follow is automatic).

**Camera** — dead zone following, map boundary clamping, listens to `HERO_POSITION` events.

**Events** — pub/sub with caller tracking. `unsubscribe(caller)` removes all subs for an object. Key events: `HERO_POSITION`, `YSORT_DIRTY`, `HUD_DIRTY`, `HERO_EXITS`, `CHANGE_LEVEL`, `HERO_REQUESTS_ACTION`, `HERO_PICKS_UP_ITEM`, `HERO_ACTION_FINISHED`, `START_TEXT_BOX`/`END_TEXT_BOX`, `ENEMY_DETECTED`, `WORLD_PAUSE` / `WORLD_RESUME` (Main suspends/resumes flagged objects), `ACTIVATE_COMPANION` / `DEACTIVATE_COMPANION` (with `{ mode }`), `WEAPON_SELECTED`, `WEAPON_UPEQUIPPED` (sic), `AMMO_DECREASE`.

**Rendering** — `Main._sortedObjects` is the flat Y-sort list of level children. Re-sorted only when `_ySortDirty` is true; objects added via `addToYSortedObjects()`. Per-frame draw applies viewport culling (`_isInViewport`, with `CULLING.BUFFER_TILES` margin). HUD layer (`drawLayer === "HUD"`) renders to a cached offscreen canvas and only re-renders on `HUD_DIRTY`. Foreground (`drawLayer === "FOREGROUND"`) is drawn after objects but before HUD. Level draws ground chunks before objects, foreground chunks after.

**Levels**:
- `ChunkedLevel` — open world, `ChunkManager` loads/unloads chunks by camera proximity (default radius 1 = 3×3 chunks). Static Tiled layers (marked `static=true`) are pre-rendered into per-chunk canvases; non-static layers viewport-cull tile-by-tile.
- `SimpleLevel` — single-room interior from one Tiled map. Centers the room on the canvas with an offset and re-positions the hero accordingly.

**Combat**:
- Hitbox types: `HITBOX_FRONT` (1 tile ahead), `HITBOX_ARC` (3-tile cross).
- Weapons exported from `combat/weapons/index.js`: `sword` (melee arc), `bow` + `arrow` (projectile), `firearm` (projectile). No boomerang in the current build.
- `AttackingState.checkMeleeHit()` can hit characters (`takeHit`) **and** intercept incoming projectiles mid-air.
- `HitState` — 1-tile knockback + flash recovery; `blocksController = true`.
- `Character.attackRecoveryTimer` enforces a brief post-attack cooldown that suppresses movement in `PlayerController`.

**Encounter / Companion flow** — `Companion` extends `GameObject` and lives as a child of `Hero` (it's "baked in" — when Hero is re-parented across levels, Companion travels along automatically). It is `suspended = true` and hidden until activated. Mode-driven via internal `StateMachine`; modes are exported from `companionConstants.js` (`COMPANION_MODE_EQUIP`, etc.).

Each subsystem owns one event:
- **Companion**: gates `ENEMY_DETECTED` against `parent.equippedWeapon` and emits `ACTIVATE_COMPANION { mode: COMPANION_MODE_EQUIP }`.
- **`CompanionEquippingState.enter()`**: emits `WORLD_PAUSE` (this mode wants the world frozen).
- **`CompanionEquippingState`** on completion: emits `WEAPON_SELECTED { weapon }`, `WORLD_RESUME`, `DEACTIVATE_COMPANION`.
- **Hero**: listens for `WEAPON_SELECTED` and equips itself. Inventory listens for the same event and refreshes the HUD.
- **Main**: listens *only* for `WORLD_PAUSE` / `WORLD_RESUME` — it's a pure world-state operator. It doesn't know what an "encounter" is.

Other systems can trigger non-encounter modes by emitting `ACTIVATE_COMPANION { mode: ... }` directly — bypass the unarmed-hero gate. A future mode that doesn't want the world frozen simply omits `WORLD_PAUSE` from its `enter()`.

**Level transitions** — `CHANGE_LEVEL` event drives a fade-out (via `screenEffects`) → `setLevel()` → `level.initialize()` → set Hero to `STATE_ENTRY` → release black + fade-in. Hero persists across levels: `setLevel()` detaches him from the old level and re-parents him into the new one. Companion travels with Hero as his child — no special-casing needed.

**Inventory** — HUD-layer `GameObject` (`drawLayer = "HUD"`). Listens for `HERO_PICKS_UP_ITEM` to append item sprites and `WEAPON_SELECTED` to render the equipped-weapon icon. Emits `HUD_DIRTY` whenever it re-renders.

**GameObjectFactory** — registry pattern, spawns objects from Tiled object layer data. Register new types here.

**Resources** — centralized image preloader; `Resources.allLoaded()` is a Promise used at boot.

## Important Gotchas

- `_setupStateMachine()` is called inside `Character` constructor — Hero's override runs before Hero constructor body. Fine because it only registers states.
- `startAttack()` sets `this.state = STATE_ATTACKING` then configures timer/animation — `AttackingState.enter()` must be a no-op.
- `MovingState` can transition to `AttackingState` mid-update via buffered attack. Safe because JS is single-threaded.
- Grid movement is cardinal-only, tile-locked with smooth interpolation via `moveTowards()`.
- Attack can be buffered during movement and fires immediately on tile arrival.
- **`Companion` extends `GameObject`, not `Character`** — it has its own internal `StateMachine` but no controller or combat hooks. If Companion ever needs to take damage or be attack-targeted, it needs to be promoted to a Character subclass.
- Companion is parented to Hero (`hero.addChild(companion)`), so its world position equals Hero's. `CompanionController.js` is dead code; the new design does not use it.
- Static Tiled layers must have a `static=true` custom property to be cached in `TiledChunk` — unmarked layers re-draw tile-by-tile every frame.
- HUD children must have `drawLayer = "HUD"` to render onto the cached HUD canvas; otherwise they will be drawn in the world Y-sort.
- `suspendOnPause` is opt-in: Main only suspends (not `paused`) objects flagged with it on `WORLD_PAUSE`. The distinction matters — Hero is `suspended` so its Companion child still animates. Companion inherits the default `suspendOnPause = false` so it isn't suspended itself, even if it were ever in `_sortedObjects` (it isn't, being Hero's child).
- `Main._sortedObjects` only holds direct children of the level. Companion is Hero's child, so it isn't in the list directly — it renders as part of Hero's draw recursion (with `drawOrder = 2` to sit in front of Hero's body).

## Conventions

- Extend `GameObject` for anything in the scene graph.
- Extend `Character` for anything with health, state machine, and a controller.
- Register new spawnable objects in `GameObjectFactory`.
- Use `Events` for cross-object communication; never hold direct references to unrelated objects.
- State classes should be stateless across instantiations — per-activation state goes in character fields set before `enter()` is called.
- Tile coordinates use `Vector2`; pixel positions derived via `gridCells()` helper.
- New states that should freeze the controller must set `this.blocksController = true` in their constructor.
- New objects that should still animate during a `WORLD_PAUSE` must keep `this.suspendOnPause = false` (the default for non-Characters). If they're a child of an object that does get suspended, they additionally need `this.ignoreParentSuspend = true` to keep ticking through the parent's freeze.

## Dev Commands

```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # Production build to dist/
```

Tiled map files go in `public/maps/` and are referenced from level configs.
