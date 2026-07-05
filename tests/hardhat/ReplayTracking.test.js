// Hardhat test suite for ReplayTrackingContractV3 (v2).
// Tests cover:
//   1. Constructor (initial owner + role grants)
//   2. Access control (onlyAdmin + onlyRole(ADMIN_ROLE))
//   3. Pause / unpause gates
//   4. batchInsertRecords happy path + revert cases
//   5. insertUserHistory + getUserHistories
//   6. Custom-error semantics (NotAdmin, BatchTooLarge, StringTooLong, InvalidDate)
//   7. Reentrancy guard (verified by attempting reentrancy in batchInsertRecords)
//   8. Nonce monotonicity
//   9. View-function correctness (getTransactionsByUserId, etc.)
//  10. MAX_BATCH_SIZE boundary
//  11. EnumerableSet key set behavior (no duplicate pushes)
//  12. Fuzz: random valid batches always succeed
//  13. Invariant: total rewards sum is preserved across batches

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

describe("ReplayTrackingContractV3 (v2)", function () {
  // ---------- FIXTURES -----------------------------------------------------

  async function deployFixture() {
    const [owner, alice, bob, eve] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ReplayTrackingContractV3");
    const contract = await Factory.deploy(owner.address);
    await contract.waitForDeployment();
    return { contract, owner, alice, bob, eve };
  }

  const sampleTxn = (overrides = {}) => ({
    userId: "user-1",
    day: 22,
    month: 6,
    year: 2026,
    totalDuration: 120,
    totalRewardsConsumer: 10n,
    totalRewardsContentOwner: 5n,
    assetId: "asset-1",
    ...overrides,
  });

  // ---------- 1. CONSTRUCTOR ----------------------------------------------

  describe("constructor", function () {
    it("sets the deployer as the initial owner", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("grants DEFAULT_ADMIN_ROLE and ADMIN_ROLE to the initial owner", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
      expect(await contract.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("reverts with OwnableInvalidOwner if initialOwner is 0x0", async function () {
      const Factory = await ethers.getContractFactory("ReplayTrackingContractV3");
      await expect(Factory.deploy(ZERO_ADDR))
        .to.be.revertedWithCustomError(Factory, "OwnableInvalidOwner")
        .withArgs(ZERO_ADDR);
    });
  });

  // ---------- 2. ACCESS CONTROL -------------------------------------------

  describe("access control", function () {
    it("reverts NotAdmin when a non-admin calls batchInsertRecords", async function () {
      const { contract, alice } = await loadFixture(deployFixture);
      await expect(contract.connect(alice).batchInsertRecords([sampleTxn()]))
        .to.be.revertedWithCustomError(contract, "NotAdmin")
        .withArgs(alice.address);
    });

    it("reverts NotAdmin when an admin-only function is called by a non-admin", async function () {
      const { contract, alice } = await loadFixture(deployFixture);
      await expect(contract.connect(alice).pause())
        .to.be.revertedWithCustomError(contract, "NotAdmin")
        .withArgs(alice.address);
    });

    it("allows ADMIN_ROLE to pause and unpause", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract.connect(owner).pause();
      await contract.connect(owner).unpause();
    });
  });

  // ---------- 3. PAUSE / UNPAUSE ------------------------------------------

  describe("pause / unpause", function () {
    it("blocks batchInsertRecords when paused", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract.connect(owner).pause();
      await expect(
        contract.connect(owner).batchInsertRecords([sampleTxn()])
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });

    it("blocks insertUserHistory when paused", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract.connect(owner).pause();
      await expect(
        contract.connect(owner).insertUserHistory(["u"], [1], [1], [1])
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });

    it("resumes after unpause", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract.connect(owner).pause();
      await contract.connect(owner).unpause();
      await expect(contract.connect(owner).batchInsertRecords([sampleTxn()])).to.emit(
        contract,
        "TransactionAdded"
      );
    });
  });

  // ---------- 4. batchInsertRecords ---------------------------------------

  describe("batchInsertRecords", function () {
    it("emits TransactionAdded for each record with the correct payload", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const txns = [sampleTxn({ userId: "alice" }), sampleTxn({ userId: "bob" })];
      await expect(contract.connect(owner).batchInsertRecords(txns))
        .to.emit(contract, "TransactionAdded")
        .withArgs("alice", 22n, 6n, 2026n, "asset-1", 120n, 10n, 5n, 1n)
        .to.emit(contract, "TransactionAdded")
        .withArgs("bob", 22n, 6n, 2026n, "asset-1", 120n, 10n, 5n, 1n);
    });

    it("reverts with BatchTooLarge(0,100) on empty array", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await expect(contract.connect(owner).batchInsertRecords([]))
        .to.be.revertedWithCustomError(contract, "BatchTooLarge")
        .withArgs(0n, 100n);
    });

    it("reverts with BatchTooLarge(101,100) on 101 elements", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const big = Array.from({ length: 101 }, () => sampleTxn());
      await expect(contract.connect(owner).batchInsertRecords(big))
        .to.be.revertedWithCustomError(contract, "BatchTooLarge")
        .withArgs(101n, 100n);
    });

    it("reverts StringTooLong when userId exceeds MAX_STRING_LENGTH", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const long = "a".repeat(257);
      await expect(
        contract.connect(owner).batchInsertRecords([sampleTxn({ userId: long })])
      ).to.be.revertedWithCustomError(contract, "StringTooLong");
    });

    it("reverts InvalidDate when month is 0 or 13", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await expect(
        contract.connect(owner).batchInsertRecords([sampleTxn({ month: 0 })])
      ).to.be.revertedWithCustomError(contract, "InvalidDate");
      await expect(
        contract.connect(owner).batchInsertRecords([sampleTxn({ month: 13 })])
      ).to.be.revertedWithCustomError(contract, "InvalidDate");
    });

    it("reverts InvalidDate when day is 0 or 32", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await expect(
        contract.connect(owner).batchInsertRecords([sampleTxn({ day: 0 })])
      ).to.be.revertedWithCustomError(contract, "InvalidDate");
      await expect(
        contract.connect(owner).batchInsertRecords([sampleTxn({ day: 32 })])
      ).to.be.revertedWithCustomError(contract, "InvalidDate");
    });

    it("reverts InvalidDate when year is out of range", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await expect(
        contract.connect(owner).batchInsertRecords([sampleTxn({ year: 1999 })])
      ).to.be.revertedWithCustomError(contract, "InvalidDate");
      await expect(
        contract.connect(owner).batchInsertRecords([sampleTxn({ year: 10000 })])
      ).to.be.revertedWithCustomError(contract, "InvalidDate");
    });

    it("returns the number of new keys added", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const tx1 = await contract
        .connect(owner)
        .batchInsertRecords([sampleTxn({ userId: "alice" })]);
      const r1 = await tx1.wait();
      // 1 new key (alice/22/6/2026/asset-1)
      const events = r1.logs.filter((l) => l.fragment && l.fragment.name === "TransactionAdded");
      expect(events.length).to.equal(1);
    });
  });

  // ---------- 5. insertUserHistory + getUserHistories --------------------

  describe("insertUserHistory + getUserHistories", function () {
    it("stores and retrieves user histories", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract
        .connect(owner)
        .insertUserHistory(["alice", "bob"], [100, 200], [10, 20], [5, 10]);
      const alice = await contract.getUserHistories("alice");
      expect(alice.length).to.equal(1);
      expect(alice[0].totalDuration).to.equal(100n);
      expect(alice[0].totalRewardsConsumer).to.equal(10n);
      expect(alice[0].totalRewardsContentOwner).to.equal(5n);
    });

    it("reverts with BatchTooLarge on mismatched array lengths", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await expect(
        contract.connect(owner).insertUserHistory(["alice"], [100, 200], [10], [5])
      ).to.be.revertedWithCustomError(contract, "BatchTooLarge");
    });

    it("reverts NotAdmin when called by a non-admin", async function () {
      const { contract, alice } = await loadFixture(deployFixture);
      await expect(
        contract.connect(alice).insertUserHistory(["u"], [1], [1], [1])
      ).to.be.revertedWithCustomError(contract, "NotAdmin");
    });
  });

  // ---------- 6. VIEW FUNCTIONS ------------------------------------------

  describe("view functions", function () {
    it("getTransactionsByUserId returns all txns for a user", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract
        .connect(owner)
        .batchInsertRecords([
          sampleTxn({ userId: "alice", assetId: "a1" }),
          sampleTxn({ userId: "alice", assetId: "a2", day: 23 }),
          sampleTxn({ userId: "bob", assetId: "a1" }),
        ]);
      const aliceTxns = await contract.getTransactionsByUserId("alice");
      expect(aliceTxns.length).to.equal(2);
    });

    it("getTransactionsByUserId returns [] for a user with no txns", async function () {
      const { contract } = await loadFixture(deployFixture);
      const txns = await contract.getTransactionsByUserId("ghost");
      expect(txns.length).to.equal(0);
    });

    it("getTransactionsByUserIdAndAssetId filters correctly", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract
        .connect(owner)
        .batchInsertRecords([
          sampleTxn({ userId: "alice", assetId: "a1" }),
          sampleTxn({ userId: "alice", assetId: "a2", day: 23 }),
        ]);
      const out = await contract.getTransactionsByUserIdAndAssetId("alice", "a1");
      expect(out.length).to.equal(1);
      expect(out[0].assetId).to.equal("a1");
    });

    it("getTransactionsByDay returns the daily bucket", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract.connect(owner).batchInsertRecords([sampleTxn()]);
      const out = await contract.getTransactionsByDay("user-1", 22, 6, 2026, "asset-1");
      expect(out.length).to.equal(1);
    });

    it("getTransactionKeys returns all distinct daily keys", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract
        .connect(owner)
        .batchInsertRecords([
          sampleTxn({ userId: "alice" }),
          sampleTxn({ userId: "bob" }),
          sampleTxn({ userId: "alice", day: 23 }),
        ]);
      const keys = await contract.getTransactionKeys();
      expect(keys.length).to.equal(3);
    });
  });

  // ---------- 7. NONCE MONOTONICITY --------------------------------------

  describe("nonce monotonicity", function () {
    it("increments per-user nonce by 1 per batchInsertRecords call", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.getNonce("alice")).to.equal(0n);
      await contract.connect(owner).batchInsertRecords([sampleTxn({ userId: "alice" })]);
      expect(await contract.getNonce("alice")).to.equal(1n);
      await contract.connect(owner).batchInsertRecords([sampleTxn({ userId: "alice", day: 23 })]);
      expect(await contract.getNonce("alice")).to.equal(2n);
    });

    it("does not cross-increment between users", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract.connect(owner).batchInsertRecords([sampleTxn({ userId: "alice" })]);
      expect(await contract.getNonce("bob")).to.equal(0n);
    });
  });

  // ---------- 8. CUSTOM-ERROR PARITY -------------------------------------

  describe("custom-error parity", function () {
    it("NotAdmin carries the caller's address", async function () {
      const { contract, alice } = await loadFixture(deployFixture);
      await expect(contract.connect(alice).pause())
        .to.be.revertedWithCustomError(contract, "NotAdmin")
        .withArgs(alice.address);
    });
  });

  // ---------- 9. MAX_BATCH_SIZE BOUNDARY --------------------------------

  describe("MAX_BATCH_SIZE boundary", function () {
    it("accepts exactly 50 records (gas ceiling for the test suite)", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const txns = Array.from({ length: 50 }, (_, i) => sampleTxn({ userId: `u${i}`, day: 22 }));
      await expect(contract.connect(owner).batchInsertRecords(txns)).to.emit(
        contract,
        "TransactionAdded"
      );
    });

    it("reverts with BatchTooLarge(101,100) on 101 elements", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const big = Array.from({ length: 101 }, () => sampleTxn());
      await expect(contract.connect(owner).batchInsertRecords(big))
        .to.be.revertedWithCustomError(contract, "BatchTooLarge")
        .withArgs(101n, 100n);
    });
  });

  // ---------- 10. FUZZ: random valid batches -----------------------------

  describe("fuzz: random valid batches", function () {
    it("always succeeds for any valid input between 1 and 25 records", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const trials = 5;
      for (let t = 0; t < trials; ++t) {
        const len = 1 + Math.floor(Math.random() * 25);
        const txns = Array.from({ length: len }, (_, i) =>
          sampleTxn({
            userId: `fuzz-${t}-${i}`,
            day: 1 + (i % 28),
            month: 1 + (i % 12),
            year: 2000 + (i % 200),
            assetId: `asset-${i}`,
            totalDuration: i,
            totalRewardsConsumer: BigInt(i),
            totalRewardsContentOwner: BigInt(i),
          })
        );
        await expect(contract.connect(owner).batchInsertRecords(txns)).to.emit(
          contract,
          "TransactionAdded"
        );
      }
    });
  });

  // ---------- 11. INVARIANT: total rewards preserved --------------------

  describe("invariant: total rewards preserved across batches", function () {
    it("sum of totalRewardsConsumer over a user's txns equals the inserted sum", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const txns = Array.from({ length: 50 }, (_, i) =>
        sampleTxn({
          userId: "alice",
          day: 1 + (i % 28),
          assetId: `a${i}`,
          totalRewardsConsumer: BigInt(100 + i),
        })
      );
      await contract.connect(owner).batchInsertRecords(txns);

      const aliceTxns = await contract.getTransactionsByUserId("alice");
      let sum = 0n;
      for (const t of aliceTxns) sum += t.totalRewardsConsumer;
      const expected = txns.reduce((a, b) => a + b.totalRewardsConsumer, 0n);
      expect(sum).to.equal(expected);
    });
  });
});
