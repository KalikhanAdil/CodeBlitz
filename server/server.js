const express = require("express");
const { WebSocketServer, WebSocket } = require("ws");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// ── In-memory room store ──────────────────────────────────────────────
// rooms: Map<roomCode, Room>
// Room {
//   code, diff, topic, problem,
//   players: Map<playerId, { ws, name, ready, finished, finishedAt }>
// }
const rooms = new Map();

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function broadcast(room, msg, excludeId = null) {
  room.players.forEach((p, id) => {
    if (id !== excludeId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify(msg));
    }
  });
}

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function roomInfo(room) {
  return {
    code: room.code,
    diff: room.diff,
    topic: room.topic,
    players: [...room.players.entries()].map(([id, p]) => ({
      id,
      name: p.name,
      ready: p.ready,
      finished: p.finished,
    })),
  };
}

// ── Cleanup empty rooms after 30 min ─────────────────────────────────
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  rooms.forEach((room, code) => {
    if (room.createdAt < cutoff) {
      rooms.delete(code);
      console.log(`🧹 Cleaned up room ${code}`);
    }
  });
}, 5 * 60 * 1000);

// ── HTTP endpoints ────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", rooms: rooms.size }));

app.get("/", (_, res) =>
  res.json({ name: "CodeBlitz Server", version: "1.0.0" })
);

// ── WebSocket server ──────────────────────────────────────────────────
const server = app.listen(PORT, () =>
  console.log(`🚀 CodeBlitz server on port ${PORT}`)
);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  let playerId = uuidv4();
  let currentRoom = null;

  console.log(`🔌 Client connected: ${playerId}`);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {

      // ── CREATE ROOM ───────────────────────────────────────────────
      case "create_room": {
        const code = genCode();
        const room = {
          code,
          diff: msg.diff || "medium",
          topic: msg.topic || "arrays",
          problem: null,
          createdAt: Date.now(),
          players: new Map(),
        };
        room.players.set(playerId, {
          ws,
          name: msg.name || "Player 1",
          ready: true,
          finished: false,
          finishedAt: null,
          isHost: true,
        });
        rooms.set(code, room);
        currentRoom = room;

        send(ws, {
          type: "room_created",
          roomCode: code,
          playerId,
          roomInfo: roomInfo(room),
        });

        console.log(`🏠 Room created: ${code} by ${playerId}`);
        break;
      }

      // ── JOIN ROOM ─────────────────────────────────────────────────
      case "join_room": {
        const code = msg.roomCode?.toUpperCase();
        const room = rooms.get(code);

        if (!room) {
          send(ws, { type: "error", message: "Room not found" });
          return;
        }
        if (room.players.size >= 2) {
          send(ws, { type: "error", message: "Room is full" });
          return;
        }
        if (room.problem) {
          send(ws, { type: "error", message: "Game already started" });
          return;
        }

        room.players.set(playerId, {
          ws,
          name: msg.name || "Player 2",
          ready: true,
          finished: false,
          finishedAt: null,
          isHost: false,
        });
        currentRoom = room;

        // Tell the joiner their ID + room state
        send(ws, {
          type: "room_joined",
          playerId,
          roomInfo: roomInfo(room),
        });

        // Notify host
        broadcast(room, {
          type: "player_joined",
          playerId,
          name: msg.name || "Player 2",
          roomInfo: roomInfo(room),
        }, playerId);

        console.log(`👋 ${playerId} joined room ${code}`);
        break;
      }

      // ── START GAME (host only) ────────────────────────────────────
      case "start_game": {
        if (!currentRoom) return;
        const player = currentRoom.players.get(playerId);
        if (!player?.isHost) {
          send(ws, { type: "error", message: "Only host can start" });
          return;
        }
        if (currentRoom.players.size < 2) {
          send(ws, { type: "error", message: "Need 2 players" });
          return;
        }

        currentRoom.problem = msg.problem;
        currentRoom.startedAt = Date.now();

        // Send to everyone including host
        currentRoom.players.forEach((p) => {
          send(p.ws, {
            type: "game_start",
            problem: msg.problem,
            diff: currentRoom.diff,
            topic: currentRoom.topic,
            startedAt: currentRoom.startedAt,
          });
        });

        console.log(`🎮 Game started in room ${currentRoom.code}`);
        break;
      }

      // ── STATUS UPDATE (typing, running, WA...) ────────────────────
      case "player_status": {
        if (!currentRoom) return;
        broadcast(currentRoom, {
          type: "opponent_status",
          status: msg.status,
          playerId,
        }, playerId);
        break;
      }

      // ── PLAYER FINISHED ───────────────────────────────────────────
      case "player_finished": {
        if (!currentRoom) return;
        const p = currentRoom.players.get(playerId);
        if (p) {
          p.finished = true;
          p.finishedAt = Date.now();
        }

        broadcast(currentRoom, {
          type: "opponent_finished",
          playerId,
          elapsed: msg.elapsed,
        }, playerId);

        // Check if both finished
        const all = [...currentRoom.players.values()];
        if (all.every((p) => p.finished)) {
          console.log(`🏁 Both players finished in room ${currentRoom.code}`);
        }

        break;
      }

      // ── PING (keepalive) ──────────────────────────────────────────
      case "ping": {
        send(ws, { type: "pong" });
        break;
      }

      default:
        console.log(`Unknown msg type: ${msg.type}`);
    }
  });

  ws.on("close", () => {
    console.log(`❌ Disconnected: ${playerId}`);
    if (currentRoom) {
      currentRoom.players.delete(playerId);

      // Notify remaining player
      broadcast(currentRoom, {
        type: "opponent_disconnected",
        playerId,
      });

      // Remove empty rooms
      if (currentRoom.players.size === 0) {
        rooms.delete(currentRoom.code);
        console.log(`🗑  Room ${currentRoom.code} deleted (empty)`);
      }
    }
  });

  ws.on("error", (err) => console.error(`WS error ${playerId}:`, err.message));
});
