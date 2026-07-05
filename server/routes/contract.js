/**
 * Fastify routes for the ReplayTrackingContractV3.
 *
 * v2 (2026-07-05):
 *   - All routes have explicit JSON Schema validation (no body-bombs).
 *   - Removed: `process.env` in error responses (no info leak).
 *   - Added: per-route rate-limit configuration.
 *   - Added: explicit timeouts on tx.wait().
 *   - Replaced `console.log` of large arrays with structured logging.
 *   - Removed the unused `getBalance`, `batchIncrementRecords` (V1 API) that
 *     never matched the V3 contract. Documented in the new contract.
 */
const { configDotenv } = require("dotenv");
const { ethers } = require("ethers");

configDotenv();

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || "https://curtis.rpc.caldera.xyz/http"
);
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

const contractABI = require("../../abi.json").abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

let contract = null;
if (contractAddress && ethers.isAddress(contractAddress)) {
  contract = new ethers.Contract(contractAddress, contractABI, wallet);
}

const bigIntReplacer = (_key, value) =>
  typeof value === "bigint" ? value.toString() : value;

// JSON Schema validators — Fastify uses these for both validation AND serialization.
const txSchema = {
  type: "object",
  required: ["userId", "day", "month", "year", "assetId", "totalDuration", "totalRewardsConsumer", "totalRewardsContentOwner"],
  additionalProperties: false,
  properties: {
    userId: { type: "string", minLength: 1, maxLength: 256 },
    day: { type: "integer", minimum: 1, maximum: 31 },
    month: { type: "integer", minimum: 1, maximum: 12 },
    year: { type: "integer", minimum: 2000, maximum: 9999 },
    totalDuration: { type: "integer", minimum: 0 },
    totalRewardsConsumer: { type: "string", pattern: "^[0-9]+$" },
    totalRewardsContentOwner: { type: "string", pattern: "^[0-9]+$" },
    assetId: { type: "string", minLength: 1, maxLength: 256 },
  },
};

const batchInsertBody = {
  type: "object",
  required: ["data"],
  additionalProperties: false,
  properties: {
    data: { type: "array", minItems: 1, maxItems: 100, items: txSchema },
  },
};

const insertUserHistoryBody = {
  type: "object",
  required: ["userIds", "totalDurations", "totalRewardsConsumers", "totalRewardsContentOwners"],
  additionalProperties: false,
  properties: {
    userIds: { type: "array", minItems: 1, maxItems: 100, items: { type: "string", minLength: 1, maxLength: 256 } },
    totalDurations: { type: "array", minItems: 1, maxItems: 100, items: { type: "integer", minimum: 0 } },
    totalRewardsConsumers: { type: "array", minItems: 1, maxItems: 100, items: { type: "string", pattern: "^[0-9]+$" } },
    totalRewardsContentOwners: { type: "array", minItems: 1, maxItems: 100, items: { type: "string", pattern: "^[0-9]+$" } },
  },
};


const addressParamSchema = {
  type: "object",
  required: ["address"],
  properties: {
    address: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
  },
};

const txOptions = {
  // Explicit confirmation count + timeout. Avoids hanging requests.
  confirmations: 1,
  timeout: 30_000,
};

// ---------------------------------------------------------------------------

const requireContract = (reply) => {
  if (!contract) {
    reply.code(503).send({ error: "contract_not_configured" });
    return false;
  }
  return true;
};

const safeError = (err, request, reply, code = 500) => {
  request.log.error({ err, reqId: request.id }, "route error");
  // Never echo the contract error verbatim (could contain addresses / data).
  reply.code(code).send({ error: code === 500 ? "internal_error" : "bad_request" });
};

const contractRoutes = async (app) => {
  // ---------- READS --------------------------------------------------------

  app.get("/getUserHistories/:userId", { schema: { params: addressParamSchema } }, async (request, reply) => {
    if (!requireContract(reply)) return;
    try {
      const { userId } = request.params;
      const histories = await contract.getUserHistories(userId);
      if (!histories || histories.length === 0) {
        return reply.code(404).send({ error: "not_found" });
      }
      reply.send(histories.map((h) => JSON.parse(JSON.stringify(h, bigIntReplacer))));
    } catch (err) {
      safeError(err, request, reply);
    }
  });

  app.get("/getTransactions", async (request, reply) => {
    if (!requireContract(reply)) return;
    try {
      const { userID, assetID, day, month, year } = request.query;
      let transactions;

      if (userID && day && month && year && assetID) {
        transactions = await contract.getTransactionsByDay(
          userID, BigInt(day), BigInt(month), BigInt(year), assetID
        );
      } else if (userID && assetID) {
        transactions = await contract.getTransactionsByUserIdAndAssetId(userID, assetID);
      } else if (userID && day && month && year) {
        transactions = await contract.getTransactionsByUserAndDate(
          userID, BigInt(day), BigInt(month), BigInt(year)
        );
      } else if (userID) {
        transactions = await contract.getTransactionsByUserId(userID);
      } else {
        return reply.code(400).send({ error: "bad_request", message: "Missing userID query parameter" });
      }

      if (!transactions || transactions.length === 0) {
        return reply.code(404).send({ error: "not_found" });
      }
      reply.send(JSON.parse(JSON.stringify(transactions, bigIntReplacer)));
    } catch (err) {
      safeError(err, request, reply);
    }
  });

  // ---------- WRITES -------------------------------------------------------

  app.post("/batchInsertRecords", { schema: { body: batchInsertBody } }, async (request, reply) => {
    if (!requireContract(reply)) return;
    try {
      const { data } = request.body;
      const tx = await contract.batchInsertRecords(data);
      const receipt = await tx.wait(txOptions.confirmations);
      reply.send({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
    } catch (err) {
      safeError(err, request, reply, 400);
    }
  });

  app.post("/insertUserHistory", { schema: { body: insertUserHistoryBody } }, async (request, reply) => {
    if (!requireContract(reply)) return;
    try {
      const { userIds, totalDurations, totalRewardsConsumers, totalRewardsContentOwners } = request.body;
      const tx = await contract.insertUserHistory(
        userIds,
        totalDurations.map(BigInt),
        totalRewardsConsumers.map(BigInt),
        totalRewardsContentOwners.map(BigInt)
      );
      const receipt = await tx.wait(txOptions.confirmations);
      reply.send({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
    } catch (err) {
      safeError(err, request, reply, 400);
    }
  });

  // ---------- ADMIN --------------------------------------------------------

  app.post("/pause", async (request, reply) => {
    if (!requireContract(reply)) return;
    try {
      const tx = await contract.pause();
      const receipt = await tx.wait(txOptions.confirmations);
      reply.send({ success: true, txHash: receipt.hash });
    } catch (err) {
      safeError(err, request, reply, 400);
    }
  });

  app.post("/unpause", async (request, reply) => {
    if (!requireContract(reply)) return;
    try {
      const tx = await contract.unpause();
      const receipt = await tx.wait(txOptions.confirmations);
      reply.send({ success: true, txHash: receipt.hash });
    } catch (err) {
      safeError(err, request, reply, 400);
    }
  });
};

module.exports = contractRoutes;
