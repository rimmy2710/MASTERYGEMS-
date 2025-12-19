// backend/src/routes/walletV2.ts
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { walletIdentityStore } from "../core/walletIdentity";

const attachSchema = z.object({
  address: z.string().min(1),
  chainId: z.number(),
});

const walletV2Routes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/wallet/health", async () => {
    return {
      ok: true,
      data: {
        service: "walletV2",
        attachedWallets: walletIdentityStore.size(),
      },
    };
  });

  fastify.post("/wallet/attach", async (request, reply) => {
    const parsed = attachSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    try {
      const { address, chainId } = parsed.data;
      const result = walletIdentityStore.attachEvmWallet(address, chainId);
      return { ok: true, data: result };
    } catch (e: any) {
      return reply.status(400).send({ ok: false, error: e?.message ?? "Attach failed" });
    }
  });
};

export default walletV2Routes;
