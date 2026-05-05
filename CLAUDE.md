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

**GameObject** — base class, parent/child tree, `stepEntry()` → `ready()` once → `step()` per frame → `draw()` recursive. Destroy via `destroy()` / `detachChild()`. Optional `paused` flag suppresses step; `pauseOnEncounter` flag controls whether `Main._pauseFlagged()` pauses it during encounters.

**GameLoop** — fixed 16.67ms timestep, accumulator, `requestAnimationFrame`. Uses `while (accumulatedTime >= timeStep)` to catch up when behind. (The inline comment in `GameLoop.js` notes the `if`-vs-`while` tradeoff; current choice is `while`.)

**State Machine** — `StateMachine` + `State` base with `enter/update/exit`. `blocksController` prevents controller updates (e.g. HitState, EntryState). Character has `get/set state` for backward compat. `Character._setupStateMachine()` registers the base states; subclasses override and call `super._setupStateMachine()` to add their own.

**States** (registered in base `Character`): `IdleState`, `MovingState`, `AttackingState`, `InteractingState`, `HitState`.
Hero adds: `ItemPickupState`, `EntryState` (walks Hero in from one tile back after level transitions; `blocksController = true`).

**Controllers** — decision layer only, never animate directly:
- `PlayerController`: keyboard → direction-hold threshold → tile moves. Keys: `0` unequip, `1` sword, `2` bow, `3` firearm, `ShiftRight` attack, `Space` action/interact.
- `EnemyController`: proximity detection → greedy pathfind toward hero → directional alignment → attack.
- `RoutineController`: scripted FACE/IDLE/MOVE_* commands with optional `loop` / `pingPong` (ping-pong inverts each direction on the backward pass).
- `CompanionController`: follow hero with configurable distance — currently **not wired up** (binding in `Companion.ready()` is commented out).

**Camera** — dead zone following, map boundary clamping, listens to `HERO_POSITION` events.

**Events** — pub/sub with caller tracking. `unsubscribe(caller)` removes all subs for an object. Key events: `HERO_POSITION`, `YSORT_DIRTY`, `HUD_DIRTY`, `HERO_EXITS`, `CHANGE_LEVEL`, `HERO_REQUESTS_ACTION`, `HERO_PICKS_UP_ITEM`, `HERO_ACTION_FINISHED`, `START_TEXT_BOX`/`END_TEXT_BOX`, `ENEMY_DETECTED`, `ENCOUNTER_START`, `WEAPON_SELECTED`, `WEAPON_UPEQUIPPED` (sic), `AMMO_DECREASE`.

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

**Encounter / Companion flow** — `Companion` extends `GameObject` (not `Character`). When an enemy is detected and Hero has no weapon equipped, Companion emits `ENCOUNTER_START`; `Main._pauseFlagged()` then pauses every object whose `pauseOnEncounter` is truthy. Companion bounces for `BOUNCE_DURATION`, picks a random weapon, and emits `WEAPON_SELECTED`, which Main listens to in order to equip the Hero and resume the world.

**Level transitions** — `CHANGE_LEVEL` event drives a fade-out (via `screenEffects`) → `setLevel()` → `level.initialize()` → set Hero to `STATE_ENTRY` → release black + fade-in. Hero and Companion persist across levels: `setLevel()` detaches them from the old level and re-parents them into the new one.

**Inventory** — HUD-layer `GameObject` (`drawLayer = "HUD"`). Listens for `HERO_PICKS_UP_ITEM` to append item sprites and `WEAPON_SELECTED` to render the equipped-weapon icon. Emits `HUD_DIRTY` whenever it re-renders.

**GameObjectFactory** — registry pattern, spawns objects from Tiled object layer data. Register new types here.

**Resources** — centralized image preloader; `Resources.allLoaded()` is a Promise used at boot.

## Important Gotchas

- `_setupStateMachine()` is called inside `Character` constructor — Hero's override runs before Hero constructor body. Fine because it only registers states.
- `startAttack()` sets `this.state = STATE_ATTACKING` then configures timer/animation — `AttackingState.enter()` must be a no-op.
- `MovingState` can transition to `AttackingState` mid-update via buffered attack. Safe because JS is single-threaded.
- Grid movement is cardinal-only, tile-locked with smooth interpolation via `moveTowards()`.
- Attack can be buffered during movement and fires immediately on tile arrival.
- **`Companion` extends `GameObject`, not `Character`** — it has no state machine, controller, or combat hooks. The `Character` import in `Companion.js` is unused. If Companion ever needs to take damage or be attack-targeted, it needs to be promoted to a Character subclass.
- `Companion.ready()` has the `CompanionController` binding commented out, so the follow-hero behaviour is not active. Treat `CompanionController.js` as dead code until that line is restored.
- Static Tiled layers must have a `static=true` custom property to be cached in `TiledChunk` — unmarked layers re-draw tile-by-tile every frame.
- HUD children must have `drawLayer = "HUD"` to render onto the cached HUD canvas; otherwise they will be drawn in the world Y-sort.
- `pauseOnEncounter` is opt-in: Main only pauses objects flagged with it on `ENCOUNTER_START`. Companion sets it to `false` so it can still animate during the encounter prompt.

## Conventions

- Extend `GameObject` for anything in the scene graph.
- Extend `Character` for anything with health, state machine, and a controller.
- Register new spawnable objects in `GameObjectFactory`.
- Use `Events` for cross-object communication; never hold direct references to unrelated objects.
- State classes should be stateless across instantiations — per-activation state goes in character fields set before `enter()` is called.
- Tile coordinates use `Vector2`; pixel positions derived via `gridCells()` helper.
- New states that should freeze the controller must set `this.blocksController = true` in their constructor.
- New objects that should still animate during an `ENCOUNTER_START` pause must set `this.pauseOnEncounter = false`.

## Dev Commands

```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # Production build to dist/
```

Tiled map files go in `public/maps/` and are referenced from level configs.
