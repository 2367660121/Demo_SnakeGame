import {
  GRID_SIZE,
  advanceState,
  createInitialState,
  queueDirection,
  togglePause
} from "./game-logic.js";
import {
  getPlayerBest,
  getPlayerRank,
  normalizePlayerName,
  sanitizeEntries,
  upsertLeaderboard
} from "./leaderboard.js";

const LEADERBOARD_STORAGE_KEY = "snake-leaderboard";
const PLAYER_STORAGE_KEY = "snake-player-name";
const TICK_MS = 140;

const scoreNode = document.querySelector("#score");
const statusNode = document.querySelector("#status");
const boardNode = document.querySelector("#board");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const changePlayerButton = document.querySelector("#change-player-button");
const controlButtons = document.querySelectorAll("[data-direction]");
const startScreenNode = document.querySelector("#start-screen");
const gameShellNode = document.querySelector("#game-shell");
const startForm = document.querySelector("#start-form");
const playerNameInput = document.querySelector("#player-name-input");
const playerNameNode = document.querySelector("#player-name");
const playerBestNode = document.querySelector("#player-best");
const playerRankNode = document.querySelector("#player-rank");
const leaderboardNode = document.querySelector("#leaderboard");

let state = createInitialState();
let currentPlayer = readStoredPlayerName();
let leaderboard = readLeaderboard();
let hasSavedCurrentScore = false;
let screen = "start";

const cells = buildBoard(boardNode, GRID_SIZE);

if (currentPlayer) {
  playerNameInput.value = currentPlayer;
}

render();
window.setInterval(tick, TICK_MS);
window.addEventListener("keydown", onKeydown);

pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  render();
});

restartButton.addEventListener("click", restartGame);

changePlayerButton.addEventListener("click", () => {
  state = createInitialState();
  hasSavedCurrentScore = false;
  showStartScreen();
});

startForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextPlayer = normalizePlayerName(playerNameInput.value);

  if (!nextPlayer) {
    playerNameInput.focus();
    return;
  }

  currentPlayer = nextPlayer;
  window.localStorage.setItem(PLAYER_STORAGE_KEY, currentPlayer);
  restartGame();
  showGameScreen();
});

for (const button of controlButtons) {
  button.addEventListener("click", () => {
    updateDirection(button.dataset.direction);
  });
}

function tick() {
  if (!isGameVisible()) {
    return;
  }

  const nextState = advanceState(state);

  if (nextState !== state) {
    const reachedGameOver = state.status !== "gameover" && nextState.status === "gameover";
    state = nextState;

    if (reachedGameOver) {
      persistCurrentScore();
    }

    render();
  }
}

function restartGame() {
  state = createInitialState();
  hasSavedCurrentScore = false;
  render();
}

function updateDirection(direction) {
  if (!isGameVisible()) {
    return;
  }

  state = queueDirection(state, direction);
}

function onKeydown(event) {
  if (!isGameVisible()) {
    return;
  }

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

function render() {
  renderBoard();
  renderPlayerMeta();
  renderLeaderboard();
  renderVisibility();

  scoreNode.textContent = String(state.score);
  pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
  statusNode.textContent = getStatusText(state.status);
}

function renderBoard() {
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
}

function renderPlayerMeta() {
  const name = currentPlayer || "Guest";
  const best = getPlayerBest(leaderboard, currentPlayer);
  const rank = getPlayerRank(leaderboard, currentPlayer);

  playerNameNode.textContent = name;
  playerBestNode.textContent = String(best);
  playerRankNode.textContent = rank ? `#${rank}` : "-";
}

function renderLeaderboard() {
  leaderboardNode.innerHTML = "";

  if (leaderboard.length === 0) {
    const emptyNode = document.createElement("li");
    emptyNode.className = "empty-state";
    emptyNode.textContent = "No scores yet. Start a run to claim the first spot.";
    leaderboardNode.append(emptyNode);
    return;
  }

  for (const [index, entry] of leaderboard.entries()) {
    const item = document.createElement("li");
    item.className = "leaderboard-item";

    if (currentPlayer && entry.name.toLowerCase() === currentPlayer.toLowerCase()) {
      item.classList.add("current-player");
    }

    const left = document.createElement("div");
    const rank = document.createElement("span");
    rank.className = "leaderboard-rank";
    rank.textContent = `#${index + 1}`;

    const name = document.createElement("span");
    name.className = "leaderboard-name";
    name.textContent = entry.name;

    left.append(rank, name);

    const right = document.createElement("div");
    right.className = "leaderboard-meta";

    const label = document.createElement("span");
    label.className = "leaderboard-rank";
    label.textContent = "Best";

    const score = document.createElement("span");
    score.className = "leaderboard-score";
    score.textContent = String(entry.score);

    right.append(label, score);
    item.append(left, right);
    leaderboardNode.append(item);
  }
}

function renderVisibility() {
  const gameVisible = isGameVisible();
  startScreenNode.classList.toggle("hidden", gameVisible);
  gameShellNode.classList.toggle("hidden", !gameVisible);
}

function showStartScreen() {
  screen = "start";
  render();
  playerNameInput.focus();
}

function showGameScreen() {
  screen = "game";
  render();
}

function isGameVisible() {
  return screen === "game";
}

function persistCurrentScore() {
  if (!currentPlayer || hasSavedCurrentScore) {
    return;
  }

  leaderboard = upsertLeaderboard(leaderboard, {
    name: currentPlayer,
    score: state.score,
    updatedAt: Date.now()
  });

  window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
  hasSavedCurrentScore = true;
}

function readLeaderboard() {
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    return sanitizeEntries(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function readStoredPlayerName() {
  try {
    return normalizePlayerName(window.localStorage.getItem(PLAYER_STORAGE_KEY));
  } catch {
    return "";
  }
}

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
    return `Game over, ${currentPlayer}. Press Restart to chase a better rank.`;
  }

  if (!currentPlayer) {
    return "Enter a player name to begin.";
  }

  return "Use arrow keys or WASD to steer.";
}
