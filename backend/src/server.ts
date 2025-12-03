import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";
import roomsRoutes from "./routes/rooms";

dotenv.config();

const server = Fastify({ logger: true });

server.register(cors, { origin: true });
server.register(swagger, {
  swagger: {
    info: {
      title: "Mastery Gems Backend",
      description: "API documentation for Mastery Gems MVP backend",
      version: "0.1.0"
    }
  }
});
server.register(swaggerUi, {
  routePrefix: "/docs"
});
server.register(roomsRoutes);

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
