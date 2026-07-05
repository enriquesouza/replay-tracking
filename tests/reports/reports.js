const axios = require("axios");
const fs = require("fs");

const apiUrl = "http://localhost:3000";
const testData = {
  address: "0x495190163716C123C5545Dd1C677D9Eb39513513",
  month: 4,
  year: 2024,
  day: 20,
  movieId: "300",
  timeWatched: 120,
  amountEarned: 140,
  batchData: [
    {
      userID: "0x495190163716C123C5545Dd1C677D9Eb39513513",
      month: 7,
      year: 2024,
      day: 20,
      movieId: "movie123",
      timeWatched: 30,
      amountEarned: 500,
    },
    {
      userID: "0x495190163716C123C5545Dd1C677D9Eb39513513",
      month: 7,
      year: 2024,
      day: 20,
      movieId: "movie124",
      timeWatched: 60,
      amountEarned: 873,
    },
  ],
};

const tests = [
  {
    name: "Add Tokens",
    method: "POST",
    url: `${apiUrl}/addTokens`,
    headers: { "Content-Type": "application/json" },
    data: { address: testData.address, amount: "100" },
  },
  {
    name: "Increment Record",
    method: "POST",
    url: `${apiUrl}/incrementRecord`,
    headers: { "Content-Type": "application/json" },
    data: {
      userID: testData.address,
      month: testData.month,
      year: testData.year,
      day: testData.day,
      movieId: testData.movieId,
      timeWatched: testData.timeWatched,
      amountEarned: testData.amountEarned,
    },
  },
  {
    name: "Batch Increment Records",
    method: "POST",
    url: `${apiUrl}/batchIncrementRecords`,
    headers: { "Content-Type": "application/json" },
    data: { data: testData.batchData },
  },
  {
    name: "Add Transaction",
    method: "POST",
    url: `${apiUrl}/addTransaction`,
    headers: { "Content-Type": "application/json" },
    data: {
      userID: testData.address,
      month: testData.month,
      year: testData.year,
      day: testData.day,
      txnId: "txn123",
      walletAddress: testData.address,
      amount: "50",
      type_: "user",
    },
  },
  {
    name: "Get Consolidated By Movie",
    method: "GET",
    url: `${apiUrl}/getConsolidatedByMovie?userID=${testData.address}&month=${testData.month}&year=${testData.year}&day=${testData.day}&movieId=${testData.movieId}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get Consolidated By Month",
    method: "GET",
    url: `${apiUrl}/getConsolidatedByMonth?userID=${testData.address}&month=${testData.month}&year=${testData.year}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get Consolidated By Year",
    method: "GET",
    url: `${apiUrl}/getConsolidatedByYear?userID=${testData.address}&year=${testData.year}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get Transactions By Month",
    method: "GET",
    url: `${apiUrl}/getTransactionsByMonth?userID=${testData.address}&month=${testData.month}&year=${testData.year}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get Transactions By Year",
    method: "GET",
    url: `${apiUrl}/getTransactionsByYear?userID=${testData.address}&year=${testData.year}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get Daily Transactions",
    method: "GET",
    url: `${apiUrl}/getDailyTransactions?userID=${testData.address}&month=${testData.month}&year=${testData.year}&day=${testData.day}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get User Summary",
    method: "GET",
    url: `${apiUrl}/getUserSummary?userID=${testData.address}&month=${testData.month}&year=${testData.year}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get Total Transactions By User",
    method: "GET",
    url: `${apiUrl}/getTotalTransactionsByUser?userID=${testData.address}&month=${testData.month}&year=${testData.year}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get User Details",
    method: "GET",
    url: `${apiUrl}/getUserDetails?userID=${testData.address}&topYear=${testData.year}`,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "Get Monthly Yearly Report",
    method: "GET",
    url: `${apiUrl}/getMonthlyYearlyReport?month=${testData.month}&year=${testData.year}`,
    headers: { "Content-Type": "application/json" },
  },
];

const runTests = async () => {
  const results = [];
  for (const test of tests) {
    try {
      const response = await axios({
        method: test.method,
        url: test.url,
        headers: test.headers,
        data: test.data,
      });
      results.push({
        name: test.name,
        status: response.status,
        dataSent: test.data,
        dataReceived: response.data,
      });
      console.log(`Test ${test.name} passed`);
    } catch (error) {
      results.push({ name: test.name, error: error.message });
      console.error(`Test ${test.name} failed: ${error.message}`);
    }
  }
  fs.writeFileSync("tests/reports/report.json", JSON.stringify(results, null, 2));

  // Generate Markdown report
  let markdownReport = "# Relatório Consolidado\n\n";

  results.forEach((result) => {
    if (result.status === 200 && result.dataReceived) {
      const data = result.dataReceived;
      if (result.name.includes("Get Consolidated By Movie")) {
        markdownReport += `## Consolidated record for ${testData.address} for month ${testData.month} and year ${testData.year}:\n\`\`\`\n`;
        markdownReport += generateTable(
          data,
          ["timeWatched", "amountEarned", "month", "year"],
          testData.month,
          testData.year
        );
        markdownReport += "```\n\n";
      } else if (result.name.includes("Get Consolidated By Month")) {
        markdownReport += `## Consolidated record for ${testData.address} for month ${testData.month} and year ${testData.year}:\n\`\`\`\n`;
        markdownReport += generateTable(
          data,
          ["timeWatched", "amountEarned", "month", "year"],
          testData.month,
          testData.year
        );
        markdownReport += "```\n\n";
      } else if (result.name.includes("Get Consolidated By Year")) {
        markdownReport += `## Consolidated record for ${testData.address} for year ${testData.year}:\n\`\`\`\n`;
        markdownReport += generateTable(
          data,
          ["timeWatched", "amountEarned", "year"],
          null,
          testData.year
        );
        markdownReport += "```\n\n";
      } else if (result.name.includes("Get Transactions By Month")) {
        markdownReport += `## Transactions for ${testData.address} for month ${testData.month} and year ${testData.year}:\n\`\`\`\n`;
        markdownReport += generateTable(
          data,
          ["txnId", "walletAddress", "amount", "type_", "month", "year"],
          testData.month,
          testData.year
        );
        markdownReport += "```\n\n";
      } else if (result.name.includes("Get Transactions By Year")) {
        markdownReport += `## Transactions for ${testData.address} for year ${testData.year}:\n\`\`\`\n`;
        markdownReport += generateTable(
          data,
          ["txnId", "walletAddress", "amount", "type_", "year"],
          null,
          testData.year
        );
        markdownReport += "```\n\n";
      } else if (result.name.includes("Get User Summary")) {
        markdownReport += `## User summary for ${testData.address} for month ${testData.month} and year ${testData.year}:\n\`\`\`\n`;
        markdownReport += generateTable(
          data,
          ["totalWatched", "totalEarned", "month", "year"],
          testData.month,
          testData.year
        );
        markdownReport += "```\n\n";
      } else if (result.name.includes("Get User Details")) {
        markdownReport += `## Detailed user information for ${testData.address} for year ${testData.year}:\n\`\`\`\n`;
        markdownReport += generateTable(
          data,
          ["balance", "nonce", "totalWatched", "totalEarned", "year"],
          null,
          testData.year
        );
        markdownReport += "```\n\n";
      } else if (result.name.includes("Get Monthly Yearly Report")) {
        markdownReport += `## Monthly and yearly report for month ${testData.month} and year ${testData.year}:\n\`\`\`\n`;
        markdownReport += generateMonthlyYearlyReport(data);
        markdownReport += "```\n\n";
      }
    }
  });

  fs.writeFileSync("tests/reports/report.md", markdownReport);
};

const generateTable = (data, columns, month, year) => {
  let table = "";
  const headers = columns.map((col) => col.padEnd(15)).join(" | ");
  table += `${headers}\n`;
  table += `${columns.map(() => "---------------").join(" | ")}\n`;

  if (Array.isArray(data)) {
    data.forEach((row, index) => {
      const rowData = columns
        .map((col) => {
          if (col === "month") return String(month).padEnd(15);
          if (col === "year") return String(year).padEnd(15);
          return String(row[col] !== undefined ? row[col] : "undefined").padEnd(15);
        })
        .join(" | ");
      table += `${rowData}\n`;
    });
  } else {
    const rowData = columns
      .map((col) => {
        if (col === "month") return String(month).padEnd(15);
        if (col === "year") return String(year).padEnd(15);
        return String(data[col] !== undefined ? data[col] : "undefined").padEnd(15);
      })
      .join(" | ");
    table += `${rowData}\n`;
  }

  return table;
};

const generateMonthlyYearlyReport = (data) => {
  let table = "";
  const headers = ["user", "monthlyWatched", "monthlyEarned", "yearlyWatched", "yearlyEarned"]
    .map((col) => col.padEnd(20))
    .join(" | ");
  table += `${headers}\n`;
  table += `${["user", "monthlyWatched", "monthlyEarned", "yearlyWatched", "yearlyEarned"].map(() => "-------------------").join(" | ")}\n`;

  data.forEach((row) => {
    const rowData = [
      row.user,
      row.monthly.watched,
      row.monthly.earned,
      row.yearly.watched,
      row.yearly.earned,
    ]
      .map((col) => String(col).padEnd(20))
      .join(" | ");
    table += `${rowData}\n`;
  });

  return table;
};

runTests();
