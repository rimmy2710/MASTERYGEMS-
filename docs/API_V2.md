# Mastery Gems — API v2 (Envelope Standard)

## Envelope
Success:
- { "ok": true, "data": ... }

Error:
- { "ok": false, "error": "message" }
- { "ok": false, "error": { "code": "...", "message": "..." } }

## Access pattern (Frontend / Partner)
Frontend MUST call via proxy:
- /api/backend/*

Backend base (Codespaces/local):
- BACKEND_INTERNAL_URL=http://127.0.0.1:3001

## v2 Rooms
- GET  /v2/health
- GET  /v2/rooms
- POST /v2/rooms
- POST /v2/rooms/:id/join
- GET  /v2/rooms/:id/state

## v2 Games
- GET  /v2/games/health
- POST /v2/games
- GET  /v2/games/:gameId
- POST /v2/games/:gameId/join
- POST /v2/games/:gameId/action
- GET  /v2/rooms/:roomId/games

## Legacy kept (do not break)
Rooms legacy:
- GET /rooms
- POST /rooms
- POST /rooms/:id/join
- GET /rooms/:id/state

Games legacy:
- GET /games/health
- POST /games
- GET /games/:gameId
- POST /games/:gameId/join
- POST /games/:gameId/action
- GET /rooms/:roomId/games

## Canonical FE lifecycle (room-based)
- POST /rooms/:id/game
- POST /rooms/:id/game/join
- POST /rooms/:id/game/ready
- POST /rooms/:id/game/start
- POST /rooms/:id/game/finish
- GET  /overview/rooms
- GET  /overview/rooms/:roomId
