import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceState,
  createInitialState,
  placeFood,
  queueDirection
} from "../src/game-logic.js";

test("moves one cell in the active direction", () => {
  const initial = createInitialState({ rows: 8, cols: 8, random: () => 0 });
  const next = advanceState(initial, () => 0);

  assert.deepEqual(next.snake, [
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 }
  ]);
  assert.equal(next.score, 0);
  assert.equal(next.status, "running");
});

test("grows and increments score when food is eaten", () => {
  const state = {
    rows: 8,
    cols: 8,
    snake: [
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 }
    ],
    direction: "right",
    nextDirection: "right",
    food: { x: 5, y: 4 },
    score: 0,
    status: "running"
  };

  const next = advanceState(state, () => 0);

  assert.equal(next.snake.length, 4);
  assert.deepEqual(next.snake.at(-1), { x: 5, y: 4 });
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, { x: 5, y: 4 });
});

test("ignores a direct reversal when snake length is greater than one", () => {
  const initial = createInitialState({ rows: 8, cols: 8, random: () => 0 });
  const queued = queueDirection(initial, "left");
  const next = advanceState(queued, () => 0);

  assert.equal(next.direction, "right");
  assert.deepEqual(next.snake.at(-1), { x: 6, y: 4 });
});

test("marks the game over after hitting a wall", () => {
  const state = {
    rows: 5,
    cols: 5,
    snake: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 }
    ],
    direction: "right",
    nextDirection: "right",
    food: { x: 0, y: 0 },
    score: 0,
    status: "running"
  };

  const next = advanceState(state, () => 0);

  assert.equal(next.status, "gameover");
});

test("marks the game over after hitting the snake body", () => {
  const state = {
    rows: 6,
    cols: 6,
    snake: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 2, y: 1 }
    ],
    direction: "down",
    nextDirection: "down",
    food: { x: 0, y: 0 },
    score: 0,
    status: "running"
  };

  const next = advanceState(state, () => 0);

  assert.equal(next.status, "gameover");
});

test("places food only on empty cells", () => {
  const food = placeFood(
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ],
    2,
    2,
    () => 0
  );

  assert.deepEqual(food, { x: 1, y: 1 });
});
