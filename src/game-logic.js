export const GRID_SIZE = 16;
export const INITIAL_DIRECTION = "right";

export const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export function createInitialState(options = {}) {
  const rows = options.rows ?? GRID_SIZE;
  const cols = options.cols ?? GRID_SIZE;
  const random = options.random ?? Math.random;
  const midX = Math.floor(cols / 2);
  const midY = Math.floor(rows / 2);
  const snake = [
    { x: midX - 1, y: midY },
    { x: midX, y: midY },
    { x: midX + 1, y: midY }
  ];

  return {
    rows,
    cols,
    snake,
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    food: placeFood(snake, rows, cols, random),
    score: 0,
    status: "running"
  };
}

export function queueDirection(state, direction) {
  if (!DIRECTION_VECTORS[direction]) {
    return state;
  }

  if (isOppositeDirection(state.direction, direction) && state.snake.length > 1) {
    return state;
  }

  return {
    ...state,
    nextDirection: direction
  };
}

export function togglePause(state) {
  if (state.status === "gameover") {
    return state;
  }

  return {
    ...state,
    status: state.status === "paused" ? "running" : "paused"
  };
}

export function advanceState(state, random = Math.random) {
  if (state.status !== "running") {
    return state;
  }

  const direction = canTurn(state.direction, state.nextDirection, state.snake.length)
    ? state.nextDirection
    : state.direction;
  const head = state.snake[state.snake.length - 1];
  const vector = DIRECTION_VECTORS[direction];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };
  const eating = positionsEqual(nextHead, state.food);
  const bodyToCheck = eating ? state.snake : state.snake.slice(1);

  if (hitsWall(nextHead, state.rows, state.cols) || hitsSnake(nextHead, bodyToCheck)) {
    return {
      ...state,
      direction,
      nextDirection: direction,
      status: "gameover"
    };
  }

  const nextSnake = eating
    ? [...state.snake, nextHead]
    : [...state.snake.slice(1), nextHead];

  return {
    ...state,
    snake: nextSnake,
    direction,
    nextDirection: direction,
    food: eating ? placeFood(nextSnake, state.rows, state.cols, random) : state.food,
    score: eating ? state.score + 1 : state.score
  };
}

export function placeFood(snake, rows, cols, random = Math.random) {
  const occupied = new Set(snake.map((segment) => toKey(segment)));
  const openCells = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const point = { x, y };
      if (!occupied.has(toKey(point))) {
        openCells.push(point);
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  const index = Math.min(
    openCells.length - 1,
    Math.floor(normalizeRandom(random()) * openCells.length)
  );

  return openCells[index];
}

export function positionsEqual(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function hitsWall(point, rows, cols) {
  return point.x < 0 || point.y < 0 || point.x >= cols || point.y >= rows;
}

function hitsSnake(point, snake) {
  return snake.some((segment) => positionsEqual(point, segment));
}

function isOppositeDirection(current, next) {
  return (
    (current === "up" && next === "down") ||
    (current === "down" && next === "up") ||
    (current === "left" && next === "right") ||
    (current === "right" && next === "left")
  );
}

function canTurn(current, next, length) {
  return !(length > 1 && isOppositeDirection(current, next));
}

function toKey(point) {
  return `${point.x}:${point.y}`;
}

function normalizeRandom(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value >= 1) {
    return 0.999999;
  }

  if (value < 0) {
    return 0;
  }

  return value;
}
