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
  controllers/     AI & input: PlayerController, EnemyController, RoutineController
  combat/          attackHelpers, attackTypes, weapons/
  core/            ChunkManager, TiledChunk, GameObjectFactory
  objects/         Main, Level, Character, Projectile, Exit, Chest, etc.
  helpers/         grid.js, moveTowards.js, levelConfig.js
  levels/          Overworld.js, CaveLevel1.js
public/            Static assets (sprites, maps, fonts)
dist/maps/         Tiled JSON map output
```

### Key Systems

**GameObject** — base class, parent/child tree, `stepEntry()` → `ready()` once → `step()` per frame → `draw()` recursive. Destroy via `destroy()` / `detachChild()`.

**GameLoop** — fixed 16.67ms timestep, accumulator, `requestAnimationFrame`. Single `if` (not `while`) to stay smooth.

**State Machine** — `StateMachine` + `State` base with `enter/update/exit`. `blocksController` prevents controller updates (e.g. HitState). Character has `get/set state` for backward compat.

**States**: `IdleState`, `MovingState`, `AttackingState`, `InteractingState`, `ItemPickupState` (Hero-only), `HitState`

**Controllers** — decision layer only, never animate directly:
- `PlayerController`: keyboard → direction queue → tile moves; weapon keys 1/2/3; Space for action
- `EnemyController`: proximity detection → pathfind toward hero → aligned attack
- `RoutineController`: patrol waypoints, optional loop/pingPong

**Camera** — dead zone following, map boundary clamping, listens to `HERO_POSITION` events.

**Events** — pub/sub with caller tracking. `unsubscribe(caller)` removes all subs for an object. Key events: `HERO_POSITION`, `YSORT_DIRTY`, `HERO_EXITS`, `CHANGE_LEVEL`, `HERO_REQUESTS_ACTION`, `HUD_DIRTY`.

**Rendering** — Y-sort list rebuilt on `YSORT_DIRTY`. Sort by `drawOrder` first, then Y. `DRAW_LAYER_FLOOR` always behind. HUD cached to separate canvas with dirty flag.

**Levels**:
- `ChunkedLevel` — open world, `ChunkManager` loads/unloads by camera proximity (default radius 1 = 3×3 chunks)
- `SimpleLevel` — single-room interior from one Tiled map file

**Combat**:
- Hitbox types: `HITBOX_FRONT` (1 tile ahead), `HITBOX_ARC` (3-tile cross)
- Weapons: sword (melee arc), bow (projectile), boomerang (returning projectile)
- `HitState` — knockback 1 tile + flash recovery; `blocksController = true`

**GameObjectFactory** — registry pattern, spawns objects from Tiled object layer data. Register new types here.

**Resources** — centralized image preloader; `Resources.allLoaded()` is a Promise used at boot.

## Important Gotchas

- `_setupStateMachine()` is called inside `Character` constructor — Hero's override runs before Hero constructor body. Fine because it only registers states.
- `startAttack()` sets `this.state = STATE_ATTACKING` then configures timer/animation — `AttackingState.enter()` must be a no-op.
- `MovingState` can transition to `AttackingState` mid-update via buffered attack. Safe because JS is single-threaded.
- Grid movement is cardinal-only, tile-locked with smooth interpolation via `moveTowards()`.
- Attack can be buffered during movement and fires immediately on tile arrival.

## Conventions

- Extend `GameObject` for anything in the scene graph.
- Extend `Character` for anything with health, state machine, and a controller.
- Register new spawnable objects in `GameObjectFactory`.
- Use `Events` for cross-object communication; never hold direct references to unrelated objects.
- State classes should be stateless across instantiations — per-activation state goes in character fields set before `enter()` is called.
- Tile coordinates use `Vector2`; pixel positions derived via `gridCells()` helper.

## Dev Commands

```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # Production build to dist/
```

Tiled map files go in `public/maps/` and are referenced from level configs.
