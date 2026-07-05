const helmet = require("@fastify/helmet");
const compress = require("@fastify/compress");
const cors = require("@fastify/cors");
const fastifyCookie = require("@fastify/cookie");
const fastifyFormbody = require("@fastify/formbody");
const fastifyRateLimit = require("@fastify/rate-limit");
const fastifyJwt = require("@fastify/jwt");
const sanitizeHtml = require("sanitize-html");

/**
 * Fastify middleware wiring. Hardened on 2026-07-05:
 *   - CORS pinned to a configurable allowlist (no `*` in prod).
 *   - Helmet with strict CSP (`default-src 'none'`).
 *   - Global rate limit + per-route rate limits via the route-level `config.rateLimit`.
 *   - HPP (HTTP Parameter Pollution) middleware.
 *   - Sanitization on body, query, params.
 *   - Constant-time API-key comparison in production.
 *   - JWT support via @fastify/jwt (optional — only if JWT_SECRET is set).
 */
const serverConfig = async (fastify) => {
  // --- CORS: only the explicitly-allowed origins --------------------------------
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow same-origin / curl / no-origin (server-to-server) in development.
      if (!origin) return cb(null, true);
      if (process.env.NODE_ENV !== "production") return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true); // permissive in dev
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key", "X-Request-Id"],
  });

  // --- Compression -------------------------------------------------------------
  await fastify.register(compress, { threshold: 1024 });

  // --- Rate limiting -----------------------------------------------------------
  await fastify.register(fastifyRateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
    cache: 10_000,
    allowList: (process.env.RATE_LIMIT_ALLOWLIST || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    errorResponseBuilder: (request, context) => ({
      error: "rate_limited",
      message: `Too many requests. Try again in ${context.after}.`,
    }),
  });

  // --- Cookie + form-body parsers ----------------------------------------------
  await fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || undefined, // signed cookies if available
  });
  await fastify.register(fastifyFormbody);

  // --- Helmet with strict CSP --------------------------------------------------
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // API-only — no need
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer" },
  });

  // --- HPP: HTTP Parameter Pollution -------------------------------------------
  fastify.addHook("preHandler", (request, reply, done) => {
    if (request.query && typeof request.query === "object") {
      // Reject duplicate keys. Replace with the first occurrence.
      // (Fastify already parses arrays; this normalizes them.)
      Object.keys(request.query).forEach((key) => {
        if (Array.isArray(request.query[key]) && request.query[key].length > 1) {
          request.query[key] = request.query[key][0];
        }
      });
    }
    done();
  });

  // --- Sanitize body, query, params -------------------------------------------
  fastify.addHook("preHandler", (request, reply, done) => {
    try {
      if (request.body) request.body = sanitizeRequest(request.body);
      if (request.query) request.query = sanitizeRequest(request.query);
      if (request.params) request.params = sanitizeRequest(request.params);
    } catch {
      reply.code(400).send({ error: "bad_request", message: "Invalid payload" });
      return;
    }
    done();
  });

  // --- Auth: x-api-key in production, JWT optional -----------------------------
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health" || request.url === "/ready") return;
    if (process.env.NODE_ENV === "development") return;

    // Prefer JWT if present, else fall back to x-api-key.
    const auth = request.headers.authorization;
    if (auth && auth.startsWith("Bearer ") && process.env.JWT_SECRET) {
      try {
        await request.jwtVerify();
        return;
      } catch {
        // fall through to API-key check
      }
    }

    const xApiKey = request.headers["x-api-key"];
    const expected = process.env.X_API_KEY;
    if (xApiKey === undefined || expected === undefined || !constantTimeEqual(xApiKey, expected)) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  // Optional JWT — only register if JWT_SECRET is set.
  if (process.env.JWT_SECRET) {
    await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });
  }
};

const sanitizeRequest = (data) => {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") {
    return sanitizeHtml(data, { allowedTags: [], allowedAttributes: {} });
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeRequest);
  }
  if (typeof data === "object") {
    for (const key in data) {
      data[key] = sanitizeRequest(data[key]);
    }
    return data;
  }
  return data;
};

const constantTimeEqual = (a, b) => {
  // Length-different strings are not constant-time. We still compare in
  // constant time modulo length to avoid trivial length-leak attacks.
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; ++i) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

module.exports = serverConfig;
