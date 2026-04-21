import { GAMEPLAY_TIMERS, TABLE_PHASES } from "./config.js";
import { DEFAULT_CHARACTER } from "./characters.js";

const TARGETS = ["King", "Queen", "Jack"];
const CARD_RANKS = ["King", "Queen", "Jack", "Ace", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = ["Spades", "Hearts", "Diamonds", "Clubs"];

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;
const STARTING_CARDS = 10;
const MAX_PLAY_PER_TURN = 3;

const randomCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const pickTarget = () => TARGETS[Math.floor(Math.random() * TARGETS.length)];
const isTruthForTarget = (cardRank, target) => cardRank === target;
const createRevolverState = () => ({
  bulletChamber: Math.floor(Math.random() * 6),
  currentChamber: 0
});

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const createDeck = (deckCount = 1) => {
  const deck = [];
  let id = 0;
  for (let d = 0; d < deckCount; d += 1) {
    for (const rank of CARD_RANKS) {
      for (const suit of SUITS) {
        deck.push({ id: `card-${d}-${id}`, rank, suit });
        id += 1;
      }
    }
  }
  return shuffle(deck);
};

const sanitizePlayer = (p, hostId) => ({
  id: p.id,
  nickname: p.nickname,
  isHost: p.id === hostId,
  isReady: p.isReady,
  alive: p.alive,
  seat: p.seat,
  character: p.character,
  cardCount: p.hand.length,
  gunCurrentChamber: p.revolver?.currentChamber ?? 0,
  gunBulletChamber: p.revolver?.bulletChamber ?? 0,
  chambersUsed: p.revolver?.currentChamber ?? 0,
  chambersLeft: 6 - (p.revolver?.currentChamber ?? 0)
});

const alivePlayers = (room) => room.players.filter((p) => p.alive);
const aliveCount = (room) => alivePlayers(room).length;

export const getCurrentPlayer = (room) => room.players[room.currentTurnIndex];
export const getChallengeWindowMs = () => GAMEPLAY_TIMERS.CHALLENGE_MS;

const getNextAliveIndexFrom = (room, startIndex) => {
  if (room.players.length === 0) return -1;
  let idx = startIndex;
  let guard = 0;
  do {
    idx = (idx + 1) % room.players.length;
    guard += 1;
  } while (!room.players[idx].alive && guard <= room.players.length);
  return idx;
};

export const createRoomState = (hostSocketId, nickname) => {
  const roomCode = randomCode();
  const host = {
    id: hostSocketId,
    nickname: nickname || "Host",
    isReady: false,
    alive: true,
    seat: 0,
    character: DEFAULT_CHARACTER,
    hand: [],
    revolver: createRevolverState(),
    connected: true
  };

  return {
    roomCode,
    status: "lobby",
    hostId: hostSocketId,
    players: [host],
    currentTurnIndex: 0,
    round: 0,
    roundTarget: pickTarget(),
    tablePile: [],
    lastPlayed: null,
    deck: [],
    winnerId: null,
    phase: TABLE_PHASES.IDLE,
    pendingChallenge: null,
    revealContext: null,
    discardPile: [],
    createdAt: Date.now()
  };
};

export const addPlayer = (room, socketId, nickname) => {
  if (room.players.length >= MAX_PLAYERS) return { ok: false, error: "Room is full (6 players max)." };
  if (room.status !== "lobby") return { ok: false, error: "Game already started." };
  if (room.players.some((p) => p.id === socketId)) return { ok: false, error: "Already in room." };

  room.players.push({
    id: socketId,
    nickname: nickname || `Player ${room.players.length + 1}`,
    isReady: false,
    alive: true,
    seat: room.players.length,
    character: DEFAULT_CHARACTER,
    hand: [],
    revolver: createRevolverState(),
    connected: true
  });
  return { ok: true };
};

export const removePlayer = (room, socketId) => {
  const idx = room.players.findIndex((p) => p.id === socketId);
  if (idx === -1) return;
  room.players.splice(idx, 1);
  room.players.forEach((p, i) => {
    p.seat = i;
  });
  if (room.hostId === socketId && room.players.length > 0) room.hostId = room.players[0].id;
  if (room.currentTurnIndex >= room.players.length) room.currentTurnIndex = 0;
  if (room.pendingChallenge?.challengerId === socketId || room.pendingChallenge?.fromPlayerId === socketId) {
    room.pendingChallenge = null;
    room.phase = TABLE_PHASES.PLAYER_SELECTING;
  }
};

export const startGame = (room) => {
  if (room.players.length < MIN_PLAYERS) return { ok: false, error: "Need at least 2 players." };
  if (!room.players.every((p) => p.isReady || p.id === room.hostId)) {
    return { ok: false, error: "All non-host players must be ready." };
  }

  room.status = "in_game";
  room.phase = TABLE_PHASES.PLAYER_SELECTING;
  room.round = 1;
  room.roundTarget = pickTarget();
  room.tablePile = [];
  room.lastPlayed = null;
  room.winnerId = null;
  room.pendingChallenge = null;

  const totalCardsRequired = room.players.length * STARTING_CARDS;
  const deckCount = Math.max(1, Math.ceil(totalCardsRequired / 52));
  room.deck = createDeck(deckCount);

  const targetPool = shuffle(room.deck.filter((card) => card.rank === room.roundTarget));
  const fillerPool = shuffle(room.deck.filter((card) => card.rank !== room.roundTarget));

  for (const player of room.players) {
    player.alive = true;
    player.revolver = createRevolverState();
    player.hand = [];
  }

  // Fairly spread target cards in round-robin before filler cards.
  let cursor = 0;
  while (targetPool.length > 0 && room.players.some((p) => p.hand.length < STARTING_CARDS)) {
    const player = room.players[cursor % room.players.length];
    if (player.hand.length < STARTING_CARDS) {
      player.hand.push(targetPool.pop());
    }
    cursor += 1;
  }

  for (const player of room.players) {
    while (player.hand.length < STARTING_CARDS) {
      const nextCard = fillerPool.pop() || targetPool.pop();
      if (!nextCard) return { ok: false, error: "Deck exhausted while dealing." };
      player.hand.push(nextCard);
    }
    player.hand = shuffle(player.hand);
  }

  room.deck = shuffle([...targetPool, ...fillerPool]);
  room.currentTurnIndex = 0;
  return { ok: true };
};

export const advanceTurn = (room) => {
  if (room.players.length === 0) return null;
  let guard = 0;
  do {
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    guard += 1;
  } while (!room.players[room.currentTurnIndex].alive && guard <= room.players.length);
  return room.players[room.currentTurnIndex];
};

export const playCards = (room, playerId, cardIds) => {
  if (room.phase !== TABLE_PHASES.PLAYER_SELECTING) {
    return { ok: false, error: "Cannot play cards right now." };
  }
  const current = getCurrentPlayer(room);
  if (!current || current.id !== playerId) return { ok: false, error: "Not your turn." };
  if (!current.alive) return { ok: false, error: "Eliminated players cannot play." };
  if (!Array.isArray(cardIds) || cardIds.length === 0) return { ok: false, error: "Pick at least one card." };
  if (cardIds.length > MAX_PLAY_PER_TURN) {
    return { ok: false, error: "Maximum 3 cards per turn." };
  }

  const uniqueIds = [...new Set(cardIds)];
  if (uniqueIds.length > MAX_PLAY_PER_TURN) {
    return { ok: false, error: "Maximum 3 cards per turn." };
  }
  const selected = [];
  for (const id of uniqueIds) {
    const idx = current.hand.findIndex((c) => c.id === id);
    if (idx === -1) return { ok: false, error: "One or more cards were not found in hand." };
    selected.push(current.hand[idx]);
  }
  current.hand = current.hand.filter((card) => !uniqueIds.includes(card.id));

  const nextTurnIndex = getNextAliveIndexFrom(room, room.currentTurnIndex);
  const nextPlayer = room.players[nextTurnIndex];
  const payload = {
    byPlayerId: playerId,
    claim: room.roundTarget,
    actualCards: selected,
    cardCount: selected.length,
    timestamp: Date.now()
  };
  room.lastPlayed = payload;
  room.tablePile.push(payload);
  room.currentTurnIndex = nextTurnIndex;
  room.phase = TABLE_PHASES.CARDS_THROWN;
  room.pendingChallenge = {
    fromPlayerId: playerId,
    challengerId: nextPlayer?.id ?? null,
    startedAt: Date.now(),
    expiresAt: Date.now() + GAMEPLAY_TIMERS.CHALLENGE_MS
  };
  room.revealContext = null;

  return { ok: true, payload, challengeWindow: room.pendingChallenge, nextTurnPlayerId: nextPlayer?.id ?? null };
};

export const beginChallengeWindow = (room) => {
  if (room.phase !== TABLE_PHASES.CARDS_THROWN || !room.pendingChallenge) {
    return { ok: false, error: "No cards waiting for challenge window." };
  }
  room.phase = TABLE_PHASES.CHALLENGE_WINDOW;
  return { ok: true, challengeWindow: room.pendingChallenge };
};

export const challenge = (room, challengerId) => {
  if (room.phase !== TABLE_PHASES.CHALLENGE_WINDOW || !room.pendingChallenge || !room.lastPlayed) {
    return { ok: false, error: "Nothing to challenge." };
  }
  if (room.pendingChallenge.challengerId !== challengerId) {
    return { ok: false, error: "Only the immediate next player can challenge." };
  }
  if (Date.now() > room.pendingChallenge.expiresAt) return { ok: false, error: "Challenge window expired." };

  const challenger = room.players.find((p) => p.id === challengerId);
  if (!challenger || !challenger.alive) return { ok: false, error: "Invalid challenger." };

  const lied = room.lastPlayed.actualCards.some((card) => !isTruthForTarget(card.rank, room.lastPlayed.claim));
  const punishedId = lied ? room.lastPlayed.byPlayerId : challengerId;
  const shooterId = challengerId;

  room.phase = TABLE_PHASES.REVEAL_CARDS;
  room.pendingChallenge = null;
  room.revealContext = {
    lied,
    challenged: true,
    punishedId,
    shooterId
  };

  return {
    ok: true,
    reveal: {
      lied,
      challengerId,
      playedById: room.lastPlayed.byPlayerId,
      claim: room.lastPlayed.claim,
      actualCards: room.lastPlayed.actualCards,
      punishedId,
      shooterId
    }
  };
};

export const continueWithoutChallenge = (room, requesterId) => {
  if (room.phase !== TABLE_PHASES.CHALLENGE_WINDOW || !room.pendingChallenge || !room.lastPlayed) {
    return { ok: false, error: "No active challenge window." };
  }
  if (room.pendingChallenge.challengerId !== requesterId) {
    return { ok: false, error: "Only the eligible next player can continue." };
  }
  room.phase = TABLE_PHASES.REVEAL_CARDS;
  room.pendingChallenge = null;
  room.revealContext = {
    lied: false,
    challenged: false,
    punishedId: null,
    shooterId: null
  };
  return {
    ok: true,
    reveal: {
      lied: false,
      challengerId: requesterId,
      playedById: room.lastPlayed.byPlayerId,
      claim: room.lastPlayed.claim,
      actualCards: room.lastPlayed.actualCards,
      punishedId: null,
      shooterId: null
    }
  };
};

export const resolveChallengeTimeout = (room) => {
  if (room.phase !== TABLE_PHASES.CHALLENGE_WINDOW || !room.pendingChallenge) {
    return { ok: false, error: "No active challenge window." };
  }
  const challengerId = room.pendingChallenge.challengerId;
  room.phase = TABLE_PHASES.REVEAL_CARDS;
  room.pendingChallenge = null;
  room.revealContext = {
    lied: false,
    challenged: false,
    punishedId: null,
    shooterId: null
  };
  return {
    ok: true,
    reveal: {
      lied: false,
      challengerId,
      playedById: room.lastPlayed?.byPlayerId ?? null,
      claim: room.lastPlayed?.claim ?? room.roundTarget,
      actualCards: room.lastPlayed?.actualCards ?? [],
      punishedId: null,
      shooterId: null
    }
  };
};

export const completeReveal = (room) => {
  if (room.phase !== TABLE_PHASES.REVEAL_CARDS || !room.lastPlayed) {
    return { ok: false, error: "No reveal in progress." };
  }
  room.discardPile.push(...room.lastPlayed.actualCards);
  const summary = room.lastPlayed;
  room.lastPlayed = null;
  room.tablePile = [];
  if (room.revealContext?.challenged) {
    room.phase = TABLE_PHASES.GUN_SEQUENCE;
    return { ok: true, next: TABLE_PHASES.GUN_SEQUENCE, summary };
  }
  room.phase = TABLE_PHASES.NEXT_TURN;
  return { ok: true, next: TABLE_PHASES.NEXT_TURN, summary };
};

export const advanceAfterRevealNoChallenge = (room) => {
  if (room.phase !== TABLE_PHASES.NEXT_TURN) {
    return { ok: false, error: "Cannot advance turn yet." };
  }
  room.round += 1;
  room.phase = TABLE_PHASES.PLAYER_SELECTING;
  return {
    ok: true,
    nextPlayerId: room.players[room.currentTurnIndex]?.id ?? null,
    nextTarget: room.roundTarget
  };
};

export const runRevolver = (room, punishedId, shooterId) => {
  if (room.phase !== TABLE_PHASES.GUN_SEQUENCE) {
    return { isBang: false, punishedId, shooterId, winnerId: room.winnerId, nextTarget: room.roundTarget };
  }
  const punishedPlayer = room.players.find((p) => p.id === punishedId);
  const shooterPlayer = room.players.find((p) => p.id === shooterId);
  if (!punishedPlayer || !shooterPlayer) {
    return { isBang: false, punishedId, shooterId, winnerId: room.winnerId, nextTarget: room.roundTarget };
  }

  const chamberBefore = shooterPlayer.revolver.currentChamber;
  const isBang = chamberBefore === shooterPlayer.revolver.bulletChamber;
  shooterPlayer.revolver.currentChamber = (shooterPlayer.revolver.currentChamber + 1) % 6;

  if (isBang) {
    punishedPlayer.alive = false;
  }

  if (aliveCount(room) === 1) {
    room.status = "finished";
    room.phase = TABLE_PHASES.FINISHED;
    room.winnerId = alivePlayers(room)[0].id;
  } else {
    if (!room.players[room.currentTurnIndex]?.alive) advanceTurn(room);
    room.round += 1;
    room.phase = TABLE_PHASES.PLAYER_SELECTING;
  }

  return {
    isBang,
    punishedId,
    shooterId,
    chamberOwnerId: shooterId,
    chamberBefore,
    winnerId: room.winnerId,
    nextTarget: room.roundTarget,
    chamberAfter: shooterPlayer.revolver.currentChamber,
    playerGunChamber: shooterPlayer.revolver.currentChamber
  };
};

export const roomPublicState = (room, viewerId = null) => {
  const current = getCurrentPlayer(room);
  const players = room.players.map((p) => {
    const base = sanitizePlayer(p, room.hostId);
    if (p.id === viewerId) return { ...base, hand: p.hand };
    return base;
  });

  return {
    roomCode: room.roomCode,
    status: room.status,
    hostId: room.hostId,
    players,
    currentTurnPlayerId: current?.id ?? null,
    phase: room.phase,
    round: room.round,
    roundTarget: room.roundTarget,
    lastPlayed: room.lastPlayed
      ? {
          byPlayerId: room.lastPlayed.byPlayerId,
          claim: room.lastPlayed.claim,
          cardCount: room.lastPlayed.cardCount,
          timestamp: room.lastPlayed.timestamp
        }
      : null,
    tableCount: room.tablePile.length,
    discardCount: room.discardPile.length,
    winnerId: room.winnerId,
    pendingChallenge: room.pendingChallenge
      ? {
          challengerId: room.pendingChallenge.challengerId,
          fromPlayerId: room.pendingChallenge.fromPlayerId,
          startedAt: room.pendingChallenge.startedAt,
          expiresAt: room.pendingChallenge.expiresAt
        }
      : null
  };
};
