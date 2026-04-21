import {
  addPlayer,
  advanceAfterRevealNoChallenge,
  beginChallengeWindow,
  challenge,
  continueWithoutChallenge,
  completeReveal,
  createRoomState,
  getChallengeWindowMs,
  playCards,
  removePlayer,
  resolveChallengeTimeout,
  roomPublicState,
  runRevolver,
  startGame
} from "../gameLogic/engine.js";
import { GAMEPLAY_TIMERS } from "../gameLogic/config.js";
import { CHARACTER_NAMES } from "../gameLogic/characters.js";

const rooms = new Map();
const socketRoomIndex = new Map();
const challengeTimers = new Map();
const sequenceTimers = new Map();

const getRoomByCode = (roomCode) => rooms.get(roomCode);

const emitRoomToAll = (io, roomCode, room) => {
  for (const player of room.players) {
    const payload = roomPublicState(room, player.id);
    io.to(player.id).emit("roomState", payload);
    io.to(player.id).emit("syncState", payload);
  }
};

const clearChallengeTimer = (roomCode) => {
  const timeout = challengeTimers.get(roomCode);
  if (!timeout) return;
  clearTimeout(timeout);
  challengeTimers.delete(roomCode);
};

const clearSequenceTimer = (roomCode) => {
  const timeout = sequenceTimers.get(roomCode);
  if (!timeout) return;
  clearTimeout(timeout);
  sequenceTimers.delete(roomCode);
};

const schedule = (roomCode, delay, fn) => {
  clearSequenceTimer(roomCode);
  const timeout = setTimeout(() => {
    sequenceTimers.delete(roomCode);
    fn();
  }, delay);
  sequenceTimers.set(roomCode, timeout);
};

const startChallengeTimer = (io, roomCode) => {
  clearChallengeTimer(roomCode);
  const timeout = setTimeout(() => {
    const room = getRoomByCode(roomCode);
    if (!room) return;
    const resolved = resolveChallengeTimeout(room);
    if (!resolved.ok) return;

    io.to(roomCode).emit("continuePressed", {
      byPlayerId: resolved.reveal.challengerId,
      reason: "challenge_timeout"
    });

    emitRoomToAll(io, roomCode, room);

    schedule(roomCode, GAMEPLAY_TIMERS.REVEAL_MS, () => {
      const revealDone = completeReveal(room);
      if (!revealDone.ok) return;

      io.to(roomCode).emit("revealComplete", { reason: "no_challenge" });
      io.to(roomCode).emit("clearTable", { reason: "no_challenge" });

      const advanced = advanceAfterRevealNoChallenge(room);
      if (!advanced.ok) return;

      io.to(roomCode).emit("nextTurn", {
        playerId: advanced.nextPlayerId,
        target: advanced.nextTarget,
        reason: "continue"
      });

      io.to(roomCode).emit("playerTurn", {
        playerId: advanced.nextPlayerId
      });

      emitRoomToAll(io, roomCode, room);
    });

    challengeTimers.delete(roomCode);
  }, getChallengeWindowMs());

  challengeTimers.set(roomCode, timeout);
};

export const registerSocketHandlers = (io, socket) => {

  socket.on("createRoom", ({ nickname }, cb) => {
    const room = createRoomState(socket.id, nickname);
    rooms.set(room.roomCode, room);
    socketRoomIndex.set(socket.id, room.roomCode);
    socket.join(room.roomCode);
    emitRoomToAll(io, room.roomCode, room);
    cb?.({ ok: true, roomCode: room.roomCode });
  });

  socket.on("joinRoom", ({ roomCode, nickname }, cb) => {
    const room = getRoomByCode(roomCode);
    if (!room) return cb?.({ ok: false, error: "Room not found." });

    const res = addPlayer(room, socket.id, nickname);
    if (!res.ok) return cb?.(res);

    socketRoomIndex.set(socket.id, roomCode);
    socket.join(roomCode);
    emitRoomToAll(io, roomCode, room);
    cb?.({ ok: true });
  });

  socket.on("leaveRoom", (_, cb) => {
    const roomCode = socketRoomIndex.get(socket.id);
    if (!roomCode) return cb?.({ ok: true });

    const room = getRoomByCode(roomCode);
    if (!room) return cb?.({ ok: true });

    removePlayer(room, socket.id);
    socketRoomIndex.delete(socket.id);
    socket.leave(roomCode);

    if (room.players.length === 0) {
      clearChallengeTimer(roomCode);
      clearSequenceTimer(roomCode);
      rooms.delete(roomCode);
      return cb?.({ ok: true });
    }

    emitRoomToAll(io, roomCode, room);
    cb?.({ ok: true });
  });

  socket.on("selectCharacter", ({ character }, cb) => {
    const roomCode = socketRoomIndex.get(socket.id);
    const room = getRoomByCode(roomCode);
    if (!room) return cb?.({ ok: false, error: "Room not found." });

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return cb?.({ ok: false, error: "Player not found." });

    if (!CHARACTER_NAMES.includes(character)) {
      return cb?.({ ok: false, error: "Invalid character selection." });
    }

    const alreadyTaken = room.players.some(
      (p) => p.id !== socket.id && p.character === character
    );

    if (alreadyTaken) {
      return cb?.({
        ok: false,
        error: "Character already selected by another player."
      });
    }

    player.character = character;

    io.to(roomCode).emit("updateCharacter", {
      playerId: socket.id,
      character
    });

    io.to(roomCode).emit("syncLobby", { roomCode });

    emitRoomToAll(io, roomCode, room);
    cb?.({ ok: true });
  });

  socket.on("playerReady", ({ isReady }, cb) => {
    const roomCode = socketRoomIndex.get(socket.id);
    const room = getRoomByCode(roomCode);
    if (!room) return cb?.({ ok: false, error: "Room not found." });

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return cb?.({ ok: false, error: "Player not found." });

    player.isReady = Boolean(isReady);
    emitRoomToAll(io, roomCode, room);
    cb?.({ ok: true });
  });

  socket.on("removePlayer", ({ playerId }, cb) => {
    const roomCode = socketRoomIndex.get(socket.id);
    const room = getRoomByCode(roomCode);
    if (!room) return cb?.({ ok: false, error: "Room not found." });

    if (room.hostId !== socket.id)
      return cb?.({ ok: false, error: "Only host can remove players." });

    if (!playerId || playerId === socket.id)
      return cb?.({ ok: false, error: "Host cannot remove self." });

    const target = room.players.find((p) => p.id === playerId);
    if (!target)
      return cb?.({ ok: false, error: "Player not found." });

    removePlayer(room, playerId);
    socketRoomIndex.delete(playerId);

    const targetSocket = io.sockets.sockets.get(playerId);
    if (targetSocket) {
      targetSocket.leave(roomCode);
    }

    io.to(roomCode).emit("playerRemoved", {
      playerId,
      nickname: target.nickname,
      byPlayerId: socket.id
    });

    emitRoomToAll(io, roomCode, room);
    cb?.({ ok: true });
  });

  socket.on("disconnect", () => {
    const roomCode = socketRoomIndex.get(socket.id);
    if (!roomCode) return;

    const room = getRoomByCode(roomCode);
    if (!room) return;

    removePlayer(room, socket.id);
    socketRoomIndex.delete(socket.id);

    if (room.players.length === 0) {
      clearChallengeTimer(roomCode);
      clearSequenceTimer(roomCode);
      rooms.delete(roomCode);
      return;
    }

    // ✅ FIXED HERE
    io.to(roomCode).emit("player_left", { playerId: socket.id });

    emitRoomToAll(io, roomCode, room);
  });
};