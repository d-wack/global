# Planet Atlas — Core Concepts

The product-model source of truth. Four concepts define the app: **User Context**, **Events**,
**Groups**, and **RBAC**. This document fleshes them out so we can align on the model **without
locking into a schema** — only Concept #1 (User Context) is built now; #2–#4 are **design-only**,
implemented additively in later phases (see [Phasing](#phasing)).

> **Guiding principle — keep data lite.** The event model will keep evolving as UI ideas land.
> Every persisted change must be **additive and reversible**, sit **behind a repository seam**, and
> avoid premature normalization. When in doubt, model it in the design here and defer the table.

## The coordinate system: `x, y, z, date`

Everything in the app lives at a point in **space, scale, and time**:

| Axis   | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| `x, y` | longitude / latitude                                     |
| `z`    | **zoom = admin scale** (street ↔ town ↔ country ↔ globe) |
| `date` | when (year now; finer precision later)                   |

- **Concept #1** makes `x,y,z,date` the **user's cursor** — where/when they're looking.
- **Concept #2** makes it an **event's address** — where/when/at-what-scale an event lives.
- **Concepts #3–#4** govern **who** may see and do what at those coordinates.

---

## Concept #1 — User Context _(built now)_

At every moment the app knows **where and when the user is looking**: `{ lng, lat, zoom, year }`.

- **Already in memory** as `AtlasContextValue.view` (`{lng,lat,zoom}`) + `selectedYear`, emitted by
  the map on `move`/`moveend`. We formalize it as one `UserContext` value (a `useUserContext()`
  selector) — the single input to "what should I display."
- **Live vs settled.** The _live_ viewport updates on every pan (drives display); a _settled_ view
  (after motion stops + on year change) is what we **log** — never every frame.
- **Drives display**: events are filtered by **location** (viewport bbox — wire the existing unused
  `filterVisible`), **scale** (`z`; activates once events carry `z`, Concept #2/P3), and **time**
  (`filterAsOf(year)`). "Zoomed into a small town in 1865" → only that place, that scale, that year.
- **Persistence (lite view-log).** Settled views append to a single **`user_views`** table
  (`user_id, lng, lat, zoom, year, created_at`) — **orthogonal to the event model, so it locks in
  nothing**. Powers:
  - **Analytics / trends** — where/when users look (feeds a Grafana dashboard later).
  - **"Places I've visited"** — a per-user history with click-to-fly-back.
- **Privacy (GDPR).** This is user-tracking data → the history must be **user-viewable and
  clearable**, and disclosed. Tie every row to the Auth0 `sub`.

---

## Concept #2 — Events (the base unit) _(design only)_

An **Event** is the atom of the app. Everything — a news item, a historical site, a personal
milestone — is an Event at `x,y,z,date`.

### Fields (additive to today's `events` table)

| Field                           | Notes                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `x,y` (`geom`), `date` (`year`) | exist today                                                                     |
| **`z`**                         | **relevance scale** — the zoom band at which the event appears (new)            |
| **`type`**                      | `news` · `historical` · `tagged` · `birth` · `vacation` · `death` · … (new)     |
| **`visibility`**                | **`private` → `group` → `public`** (new; the moderation spine)                  |
| `title`, `description`          | exist today                                                                     |
| **`attachments`**               | pictures / docs → **Vercel Blob** (deferred; private access for private events) |
| `created_by`                    | exists (Auth0 `sub`; attribution)                                               |
| **`updated_by`, `updated_at`**  | audit (new)                                                                     |
| `votes` / `event_votes`         | exist today (one-per-user, derived score)                                       |
| **`deleted_at`**                | soft-delete (new)                                                               |

### Visibility & moderation

- **User events are always `private`** by default — shown **only to their creator**.
- **`public`** events are shown to everyone. **Private → public requires admin approval**:
  `private → (submit) pending → (admin) public | rejected`.
- **`group`** scope (Concept #3) sits between: visible to a group's members.
- **Deletion**: `private` → owner **or** admin; `public` → **admin only**. Soft-delete
  (`deleted_at`) so moderation is reversible/auditable.
- **Votes** apply to `public`/`group` events (they bubble visibility, Reddit/like-style); a
  `private` event has no meaningful vote.

### Types vs. Layers, and dates

- Today "category" = **layers** (`news`/`event`/`historical`, driving shape/color + visibility
  toggles). We reconcile by making **`type`** the canonical taxonomy and deriving the display
  layer/shape/color from it; personal types (`birth`, `vacation`, …) form a **"My Life"** layer
  that is inherently `private`.
- **Date precision**: `year` now; personal events want finer dates (day/month) — additive later,
  paired with the zoomable timeline.

---

## Concept #3 — Groups _(design only, build last)_

Users form **Groups** and invite members; groups add the **middle visibility scope**.

- **Entities**: `groups`, `group_members(user_id, group_id, role)`, and `event.group_id`.
- **Roles in a group**: `member`, `admin` (a group admin **is** the group's moderator).
- **Workflows**:
  - Group admins **create group events** (visible to all members).
  - Members create events → group admin **approves** them to **group-public**.
  - A group admin can **request** a group event be made **globally public** (→ site admin approval).
- **Invitations**: invite → accept → membership (in-app; email optional later).
- This is the **heaviest data concept** — designed now, built **last**, so the event/RBAC model
  settles first.

---

## Concept #4 — RBAC _(design now; minimal slice built when Concept #2 lands)_

Authorization = **role + ownership + scope**, enforced by a **pure policy layer** in our own DB —
not Auth0 roles (keeps it decoupled, testable, and per-group-scopable).

- **Roles**: global `user` / `admin`; per-group `member` / `admin`. Stored in **our DB**
  (a `role` on the user + `group_members.role`); admin bootstrap seeds `d-wack`.
- **Policy**: a single `src/lib/authz.ts` → `can(user, action, resource): boolean`, called in each
  `src/app/api/**` route **after** the existing `getSessionUser` auth check. `created_by` becomes an
  ownership signal here (today it's attribution-only).

### Permission matrix

| Action                       | `user` (owner)     | `user` (other) | group `admin`     | site `admin` |
| ---------------------------- | ------------------ | -------------- | ----------------- | ------------ |
| Create private event         | ✅                 | ✅             | ✅                | ✅           |
| Read event                   | if visible to them | if visible     | group events      | all          |
| Delete **private** event     | ✅ (own)           | ❌             | ❌                | ✅           |
| Delete **public** event      | ❌                 | ❌             | ❌                | ✅           |
| Approve **private → public** | ❌                 | ❌             | request only      | ✅           |
| Vote on public/group event   | ✅                 | ✅             | ✅                | ✅           |
| Create group event           | ❌                 | ❌             | ✅                | ✅           |
| Approve member → **group**   | ❌                 | ❌             | ✅                | ✅           |
| Request group → **global**   | ❌                 | ❌             | ✅ (→ site admin) | ✅           |
| Manage group membership      | ❌                 | ❌             | ✅ (own group)    | ✅           |

---

## Phasing

Each phase is additive and behind seams; nothing forces the next.

- **P1 — User Context (now).** `useUserContext`, viewport-aware display, the `user_views` view-log,
  "places I've visited." _Only new table: `user_views` (isolated)._
- **P2 — Events, additive.** `type`, `visibility` (`private`/`public`), `updated_by`/`updated_at`,
  soft-delete + delete rules; **minimal RBAC** (`user`/`admin` + ownership); the
  private→public moderation queue.
- **P3 — Rich events.** Attachments (**Vercel Blob**); `z` relevance-scale display; finer dates +
  zoomable timeline.
- **P4 — Groups.** `groups`/`group_members`; the **group** visibility scope; group-admin RBAC;
  invitations.

## Open questions (resolve before the relevant phase)

- **`z` banding** — how many admin-scale bands, and how an event's `z` maps to a zoom range for
  display (single band vs. min/max)?
- **Type ↔ layer** — do user-defined types create user-defined layers (shape/color), and how do
  personal types interact with the public layer toggles?
- **Admin surface** — is moderation a dedicated admin view, or inline actions gated by `can()`?
- **Attachment limits** — size/type caps; private-blob access model.
- **Analytics granularity** — raw `user_views` vs. pre-aggregated rollups for trends at scale.
