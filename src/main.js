import {
  GRID_SIZE,
  advanceState,
  createInitialState,
  queueDirection,
  togglePause
} from "./game-logic.js";

const TICK_MS = 140;
const scoreNode = document.querySelector("#score");
const statusNode = document.querySelector("#status");
const boardNode = document.querySelector("#board");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const controlButtons = document.querySelectorAll("[data-direction]");

let state = createInitialState();
const cells = buildBoard(boardNode, GRID_SIZE);

function render() {
  for (const cell of cells) {
    cell.className = "cell";
  }

  for (const segment of state.snake) {
    getCell(segment.x, segment.y)?.classList.add("snake");
  }

  const head = state.snake[state.snake.length - 1];
  getCell(head.x, head.y)?.classList.add("head");

  if (state.food) {
    getCell(state.food.x, state.food.y)?.classList.add("food");
  }

  scoreNode.textContent = String(state.score);
  pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
  statusNode.textContent = getStatusText(state.status);
}

function tick() {
  const nextState = advanceState(state);
  if (nextState !== state) {
    state = nextState;
    render();
  }
}

function restartGame() {
  state = createInitialState();
  render();
}

function updateDirection(direction) {
  state = queueDirection(state, direction);
}

function onKeydown(event) {
  const direction = getDirectionFromKey(event.key);
  if (!direction && event.key !== " ") {
    return;
  }

  event.preventDefault();

  if (event.key === " ") {
    state = togglePause(state);
    render();
    return;
  }

  updateDirection(direction);
}

pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  render();
});

restartButton.addEventListener("click", restartGame);

for (const button of controlButtons) {
  button.addEventListener("click", () => {
    updateDirection(button.dataset.direction);
  });
}

window.addEventListener("keydown", onKeydown);
window.setInterval(tick, TICK_MS);
render();

function buildBoard(node, size) {
  const nextCells = [];
  node.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      node.append(cell);
      nextCells.push(cell);
    }
  }

  return nextCells;
}

function getCell(x, y) {
  return boardNode.querySelector(`[data-x="${x}"][data-y="${y}"]`);
}

function getDirectionFromKey(key) {
  const normalized = key.toLowerCase();
  const map = {
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right"
  };

  return map[normalized] ?? null;
}

function getStatusText(status) {
  if (status === "paused") {
    return "Paused. Press space or Resume to continue.";
  }

  if (status === "gameover") {
    return "Game over. Press Restart to try again.";
  }

  return "Use arrow keys or WASD to steer.";
}
