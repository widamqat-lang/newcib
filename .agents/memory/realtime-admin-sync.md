---
name: Realtime admin/client sync
description: Pattern used to keep a customer-facing flow and an internal admin/ops panel continuously in sync in this monorepo, without OpenAPI/REST.
---

For a "customer app + live ops panel" feature (e.g. an admin panel that must see every field the customer types, with instant online/offline status and the ability to force-navigate the customer's browser), a single shared WebSocket endpoint on the API server is simpler and more reliable than REST polling.

**Pattern:**
- One WS endpoint (e.g. `/api/ws`) mounted on the existing Express `http.Server` (not a separate port) — the shared proxy already routes `/api` to that service.
- Two roles connect to the same endpoint: `client` (one per customer browser/session, identified by a UUID persisted in `localStorage`) and `admin` (one per open admin tab, no session id).
- Client reports state via `stage_update` messages `{ stage, data }` on every route mount *and* every form submit — mount-time reports (empty `data`) keep "which page are they on" accurate even when nothing has been typed yet; submit-time reports carry the actual field values. The server does a partial upsert (only columns present in `data` are touched), so this never blanks out previously entered fields.
- Server persists latest state per session in one table, and appends every non-empty submission to a separate append-only log table (keyed by session + stage) — this is what powers a "history" button per box without extra endpoints.
- Admin panel gets a full snapshot on connect, then incremental `client_state` broadcasts after every client update. Redirect/"quick action" commands from admin are simply forwarded to that session's live socket by session id; the client listens for `redirect` and navigates itself (no DB round-trip needed for the actual navigation).
- Both sides auto-reconnect fast (~1s) with a heartbeat ping, so "always connected" is a UX illusion built from quick reconnection + an online/offline flag driven by WS close/open, not a literally unbreakable socket.

**Why:** OpenAPI/REST codegen is the default contract-first approach in this repo, but it has no good fit for push-based, low-latency, bidirectional state — trying to force it (REST + polling) would add latency and complexity for no benefit here.

**How to apply:** Reuse this pattern (not this exact code) whenever a future request needs one surface to "see live" what another surface's users are doing, or needs to remote-control another user's navigation in real time.
