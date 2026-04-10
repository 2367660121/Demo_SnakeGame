import test from "node:test";
import assert from "node:assert/strict";

import {
  getPlayerBest,
  getPlayerRank,
  normalizePlayerName,
  upsertLeaderboard
} from "../src/leaderboard.js";

test("normalizes player names for stable leaderboard keys", () => {
  assert.equal(normalizePlayerName("  Alice   Cooper  "), "Alice Cooper");
  assert.equal(normalizePlayerName(""), "");
});

test("adds new players and sorts by highest score first", () => {
  const leaderboard = upsertLeaderboard([], {
    name: "Alice",
    score: 6,
    updatedAt: 10
  });
  const next = upsertLeaderboard(leaderboard, {
    name: "Bob",
    score: 9,
    updatedAt: 11
  });

  assert.deepEqual(
    next.map((entry) => `${entry.name}:${entry.score}`),
    ["Bob:9", "Alice:6"]
  );
});

test("keeps only the best score for the same player", () => {
  const leaderboard = upsertLeaderboard(
    [
      { name: "Alice", score: 6, updatedAt: 10 },
      { name: "Bob", score: 4, updatedAt: 11 }
    ],
    { name: "alice", score: 5, updatedAt: 12 }
  );

  assert.equal(getPlayerBest(leaderboard, "Alice"), 6);
  assert.equal(getPlayerRank(leaderboard, "Alice"), 1);
});

test("improves rank when a player beats their previous best", () => {
  const leaderboard = upsertLeaderboard(
    [
      { name: "Alice", score: 6, updatedAt: 10 },
      { name: "Bob", score: 4, updatedAt: 11 }
    ],
    { name: "Bob", score: 8, updatedAt: 12 }
  );

  assert.equal(getPlayerBest(leaderboard, "Bob"), 8);
  assert.equal(getPlayerRank(leaderboard, "Bob"), 1);
  assert.equal(getPlayerRank(leaderboard, "Alice"), 2);
});
