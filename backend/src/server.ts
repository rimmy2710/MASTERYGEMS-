import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";

import roomsRoutes from "./routes/rooms";
import roomsV2Routes from "./routes/roomsV2";

import gameRoutes from "./routes/game";
import gamesV2Routes from "./routes/gamesV2";

import overviewRoutes from "./routes/overview";
import roomGameRoutes from "./routes/roomGame";

import overviewV2Routes from "./routes/overviewV2";
import roomGameV2Routes from "./routes/roomGameV2";
import sessionV2Routes from "./routes/sessionV2";

// ✅ ADD: Wallet V2 routes
import walletV2Routes from "./routes/walletV2";

dotenv.config();

const server = Fastify({ logger: true });

server.register(cors, { origin: true });
server.register(swagger, {
  swagger: {
    info: {
      title: "Mastery Gems Backend",
      description: "API documentation for Mastery Gems MVP backend",
      version: "0.1.0",
    },
  },
});
server.register(swaggerUi, { routePrefix: "/docs" });

// Legacy (keep behavior)
server.register(roomsRoutes);
server.register(gameRoutes);
server.register(overviewRoutes);
server.register(roomGameRoutes);

// V2 (additive, standardized response format)
server.register(roomsV2Routes, { prefix: "/v2" });
server.register(gamesV2Routes, { prefix: "/v2" });

// ✅ ADD: wallet V2 uses standard /v2 prefix
server.register(walletV2Routes, { prefix: "/v2" });

// V2 modules that already include /v2 in route paths
server.register(overviewV2Routes);
server.register(roomGameV2Routes);
server.register(sessionV2Routes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`Server listening at http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
