import { describe, it, expect } from "vitest";
import axios from "axios";

const BASE_URL = "http://localhost:3000";

describe("Fastify Server API Tests", () => {
  it("should add tokens to a wallet address", async () => {
    const response = await axios.post(`${BASE_URL}/addTokens`, {
      address: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
      amount: "10",
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("success", true);
  });

  it("should fetch the balance of a wallet address", async () => {
    const response = await axios.get(
      `${BASE_URL}/balance/0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4`
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("address");
    expect(response.data).toHaveProperty("balance");
  });

  it("should update the balance of a wallet address", async () => {
    const response = await axios.post(`${BASE_URL}/updateBalance`, {
      address: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
      amount: "20",
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("success", true);
  });

  it("should increment a user record", async () => {
    const response = await axios.post(`${BASE_URL}/incrementRecord`, {
      userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
      month: 6,
      year: 2024,
      day: 22,
      movieId: "movie1",
      timeWatched: 120,
      amountEarned: 10,
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("success", true);
  });

  it("should add a transaction", async () => {
    const response = await axios.post(`${BASE_URL}/addTransaction`, {
      userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
      month: 6,
      year: 2024,
      day: 22,
      txnId: "txn1",
      walletAddress: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
      amount: "10",
      type_: "credit",
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("success", true);
  });

  it("should batch increment records", async () => {
    const response = await axios.post(`${BASE_URL}/batchIncrementRecords`, {
      data: [
        {
          userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
          month: 6,
          year: 2024,
          day: 22,
          movieId: "movie1",
          timeWatched: 120,
          amountEarned: 10,
        },
        {
          userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
          month: 6,
          year: 2024,
          day: 22,
          movieId: "movie2",
          timeWatched: 150,
          amountEarned: 15,
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("success", true);
  });

  it("should emit total earned by all users for a month", async () => {
    const response = await axios.post(`${BASE_URL}/emitTotalEarnedByAllUsers`, {
      month: 6,
      year: 2024,
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("success", true);
  });

  it("should emit top earners for a month", async () => {
    const response = await axios.post(`${BASE_URL}/emitTopEarners`, {
      month: 6,
      year: 2024,
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("success", true);
  });

  it("should get consolidated record by movie", async () => {
    const response = await axios.get(`${BASE_URL}/getConsolidatedByMovie`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        month: 6,
        year: 2024,
        day: 22,
        movieId: "movie1",
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("timeWatched");
    expect(response.data).toHaveProperty("amountEarned");
  });

  it("should get consolidated record by month", async () => {
    const response = await axios.get(`${BASE_URL}/getConsolidatedByMonth`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        month: 6,
        year: 2024,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("timeWatched");
    expect(response.data).toHaveProperty("amountEarned");
  });

  it("should get consolidated record by year", async () => {
    const response = await axios.get(`${BASE_URL}/getConsolidatedByYear`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        year: 2024,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("timeWatched");
    expect(response.data).toHaveProperty("amountEarned");
  });

  it("should get transactions by month", async () => {
    const response = await axios.get(`${BASE_URL}/getTransactionsByMonth`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        month: 6,
        year: 2024,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeInstanceOf(Array);
  });

  it("should get transactions by year", async () => {
    const response = await axios.get(`${BASE_URL}/getTransactionsByYear`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        year: 2024,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeInstanceOf(Array);
  });

  it("should get daily transactions", async () => {
    const response = await axios.get(`${BASE_URL}/getDailyTransactions`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        month: 6,
        year: 2024,
        day: 22,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeInstanceOf(Array);
  });

  it("should get user summary", async () => {
    const response = await axios.get(`${BASE_URL}/getUserSummary`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        month: 6,
        year: 2024,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("totalWatched");
    expect(response.data).toHaveProperty("totalEarned");
  });

  it("should get total transactions by user", async () => {
    const response = await axios.get(`${BASE_URL}/getTotalTransactionsByUser`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        month: 6,
        year: 2024,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("totalTransactions");
  });

  it("should get user details", async () => {
    const response = await axios.get(`${BASE_URL}/getUserDetails`, {
      params: {
        userID: "0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4",
        topYear: 2024,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("balance");
    expect(response.data).toHaveProperty("nonce");
    expect(response.data).toHaveProperty("totalWatched");
    expect(response.data).toHaveProperty("totalEarned");
  });

  it("should get monthly yearly report", async () => {
    const response = await axios.get(`${BASE_URL}/getMonthlyYearlyReport`, {
      params: {
        month: 6,
        year: 2024,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeInstanceOf(Array);
  });

  // it('should add an admin', async () => {
  //   const response = await axios.post(`${BASE_URL}/addAdmin`, {
  //     newAdmin: '0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4'
  //   });
  //   expect(response.status).toBe(200);
  //   expect(response.data).toHaveProperty('success', true);
  // });

  // it('should remove an admin', async () => {
  //   const response = await axios.post(`${BASE_URL}/removeAdmin`, {
  //     adminToRemove: '0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4'
  //   });
  //   expect(response.status).toBe(200);
  //   expect(response.data).toHaveProperty('success', true);
  // });

  // it('should set token admin', async () => {
  //   const response = await axios.post(`${BASE_URL}/setTokenAdmin`, {
  //     newTokenAdmin: '0xf6869FD13E4dd1bC532e295b140c7436f4d2B8c4'
  //   });
  //   expect(response.status).toBe(200);
  //   expect(response.data).toHaveProperty('success', true);
  // });

  // it('should pause the contract', async () => {
  //   const response = await axios.post(`${BASE_URL}/pause`);
  //   expect(response.status).toBe(200);
  //   expect(response.data).toHaveProperty('success', true);
  // });

  // it('should unpause the contract', async () => {
  //   const response = await axios.post(`${BASE_URL}/unpause`);
  //   expect(response.status).toBe(200);
  //   expect(response.data).toHaveProperty('success', true);
  // });
});
