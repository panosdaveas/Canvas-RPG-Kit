# State Diagram

Reference for the Hero state machine: transitions and per-state input allowance.
Companion's separate state machine is not represented here — it has only `IDLE`
and `EQUIP` modes, both internal to Companion.

🔒 = `blocksController = true` (controller's `update()` does not run while in
this state).

## Transitions

```
IDLE         → MOVING       (direction held + tile free)
             → ATTACKING    (ShiftRight + weapon equipped)
             → INTERACTING  (Space near interactable)
             → HIT          (takeHit() called)
             → ITEM_PICKUP  (HERO_PICKS_UP_ITEM)

MOVING       → IDLE         (arrived, no further input)
             → MOVING       (arrived, direction still held)
             → ATTACKING    (buffered attack on arrival)
             → HIT          (takeHit() called)

ATTACKING    → IDLE         (animations.isFinished())
             → HIT          (takeHit() interrupts)

HIT          → IDLE         (knockback target reached + 150ms recovery)

INTERACTING  → IDLE         (HERO_ACTION_FINISHED)

ITEM_PICKUP  → IDLE         (itemPickupTime expires)

ENTRY        → IDLE         (walked one tile in from spawn − 1)
```

`ENTRY` is only entered explicitly by `Main` after a `CHANGE_LEVEL` transition.
`ITEM_PICKUP` is only entered explicitly by Hero on `HERO_PICKS_UP_ITEM`.
All other transitions originate from controllers (player input, AI proximity)
or combat events (`takeHit`, `HERO_ACTION_FINISHED`).

## Input allowance per state

```
State        | Controller? | Movement | Attack   | Action  | Notes
-------------+-------------+----------+----------+---------+----------------------------
IDLE         | yes         | ✓        | ✓        | ✓       | All inputs
MOVING       | yes         | ✓ cont.  | buffered | ✗       | Attack fires on tile arrival
ATTACKING    | yes (self)  | ✗        | ✗        | ✗       | Facing change only;
             |             |          |          |         | PlayerController checks STATE_ATTACKING
HIT          | NO 🔒       | ✗        | ✗        | ✗       | Then attackRecoveryTimer (150ms)
INTERACTING  | NO 🔒       | ✗        | ✗        | ✗       | TextBox/dialogue owns input
ITEM_PICKUP  | NO 🔒       | ✗        | ✗        | ✗       | Hero only
ENTRY        | NO 🔒       | ✗        | ✗        | ✗       | Hero only; on level entry
```

"Controller? = yes (self)" for ATTACKING means the controller's `update()` runs
but `PlayerController` self-restricts via an `if (state === STATE_ATTACKING)`
early-return that allows facing-change only.

## Animation-driven transitions

States that end when their animation ends (no manual timer):

- `ATTACKING` — exits when `body.animations.isFinished()` is true.
  Projectile launch within an attack is gated by the active tag's User Data
  field `{"launchFrame": N}` — see `src/loaders/aseprite.js`.

States with their own gameplay timers (independent of animation timing):

- `HIT` — 150ms recovery (`RECOVERY_TIME` in `HitState.js`).
- `ITEM_PICKUP` — 500ms (`itemPickupTime` set in `Hero.onPickUpItem`).
- `ENTRY` — runs until `hasArrivedAtDestination()`.

## Updating this file

Hand-curated. When adding a new state or transition, update both the
transitions block and the input-allowance table. Keep the file in sync with
the actual state classes in `src/state/states/`.
