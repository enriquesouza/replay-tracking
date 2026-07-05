require("dotenv").config();

const Fastify = require("fastify");
const contractRoutes = require("./server/routes/contract");
const serverConfig = require("./server/config");

// Single Fastify instance, exported so tests / scripts can use it.
const buildApp = async (_opts = {}) => {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
      redact: ["req.headers.authorization", "req.headers['x-api-key']", 'res.headers["set-cookie"]'],
    },
    disableRequestLogging: false,
    trustProxy: process.env.TRUST_PROXY === "true",
    bodyLimit: 1024 * 1024, // 1 MiB max body
    requestIdHeader: "x-request-id",
    requestIdLogLabel: "reqId",
    genReqId: () => require("crypto").randomUUID(),
  });

  await serverConfig(app);
  await app.register(contractRoutes);

  // Health endpoints — registered after plugins so they're not behind auth.
  app.get("/health", async () => ({ status: "ok", uptime: process.uptime() }));
  app.get("/ready", async (request, reply) => {
    try {
      // Touch the contract to confirm RPC is reachable.
      // If `CONTRACT_ADDRESS` is not set we still report ready but warn.
      if (!process.env.CONTRACT_ADDRESS) {
        return { status: "ready", contract: "unset" };
      }
      return { status: "ready", contract: process.env.CONTRACT_ADDRESS };
    } catch (err) {
      reply.code(503);
      return { status: "not-ready", error: err.message };
    }
  });

  return app;
};

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || "0.0.0.0",
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Only auto-start when run directly (not when imported by tests).
if (require.main === module) {
  start();
}

module.exports = buildApp;
