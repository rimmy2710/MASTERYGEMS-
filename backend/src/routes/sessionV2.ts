// backend/src/routes/sessionV2.ts
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { signSessionToken, sanitizeDisplayName, normalizePlayerId } from "../utils/sessionToken";

const createSessionSchema = z.object({
  playerId: z.string().min(1),
  displayName: z.string().min(1).optional(),
});

const sessionV2Routes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/v2/session/health", async () => ({
    ok: true,
    data: { status: "ok", module: "session-v2" },
  }));

  // Mint a signed session token (HMAC). Requires SESSION_HMAC_SECRET.
  fastify.post("/v2/session", async (request, reply) => {
    const secret = process.env.SESSION_HMAC_SECRET;
    if (!secret) {
      return reply.status(500).send({ ok: false, error: "SESSION_HMAC_SECRET is not set" });
    }

    const parsed = createSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const playerId = normalizePlayerId(parsed.data.playerId);
    if (!playerId) return reply.status(400).send({ ok: false, error: "Invalid playerId" });

    const displayName = sanitizeDisplayName(parsed.data.displayName);

    const token = signSessionToken({
      secret,
      playerId,
      displayName,
      iat: Date.now(),
    });

    return reply.send({ ok: true, data: { token, playerId, displayName } });
  });
};

export default sessionV2Routes;
