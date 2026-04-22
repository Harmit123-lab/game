import { useEffect, useState } from "react";
import { socket } from "../socket/client";

export const useGameSocket = () => {
  const [roomState, setRoomState] = useState(null);
  const [events, setEvents] = useState({
    reveal: null,
    revolver: null,
    gameEnd: null,
    challengeWindow: null,
    nextTurn: null,
    toast: null,
    playedCard: null,
    cardsPlacedOnTable: null,
    challengePressed: null,
    continuePressed: null,
    revealComplete: null,
    startGunSequence: null,
    targetSet: null,
    personalRevolverStart: null,
    gunStateUpdate: null,
    resolvePunishment: null,
    showResultNotification: null,
    clearTable: null
  });

  useEffect(() => {
    const onRoomState = (state) => setRoomState(state);

    const onReveal = (reveal) =>
      setEvents((prev) => ({ ...prev, reveal }));

    const onRevolverResult = (revolver) =>
      setEvents((prev) => ({ ...prev, revolver }));

    const onGameEnd = (gameEnd) =>
      setEvents((prev) => ({ ...prev, gameEnd }));

    const onChallengeWindow = (challengeWindow) =>
      setEvents((prev) => ({
        ...prev,
        challengeWindow,
        toast: "Challenge window opened for next player."
      }));

    const onNextTurn = (nextTurn) =>
      setEvents((prev) => ({
        ...prev,
        nextTurn,
        challengeWindow: null,
        personalRevolverStart: null,
        revolver: null,
        toast:
          nextTurn.reason === "challenge_timeout"
            ? "No challenge. Turn passed."
            : "Challenge resolved. Next turn."
      }));

    const onCardsPlacedOnTable = (cardsPlacedOnTable) =>
      setEvents((prev) => ({
        ...prev,
        playedCard: cardsPlacedOnTable,
        cardsPlacedOnTable,
        toast: `${cardsPlacedOnTable.cardCount} card(s) played face-down.`
      }));

    const onChallengePressed = (challengePressed) =>
      setEvents((prev) => ({
        ...prev,
        challengePressed,
        toast: "Challenge pressed. Revealing cards..."
      }));

    const onContinuePressed = (continuePressed) =>
      setEvents((prev) => ({
        ...prev,
        continuePressed,
        toast: "Continue pressed. Revealing cards..."
      }));

    const onRevealComplete = (revealComplete) =>
      setEvents((prev) => ({ ...prev, revealComplete }));

    const onStartGunSequence = (startGunSequence) =>
      setEvents((prev) => ({
        ...prev,
        startGunSequence,
        toast: "Gun sequence starting..."
      }));

    const onSetTarget = ({ target }) =>
      setEvents((prev) => ({
        ...prev,
        targetSet: target,
        toast: `Match target set to ${target}`
      }));

    const onStartPersonalRevolver = (payload) =>
      setEvents((prev) => ({
        ...prev,
        personalRevolverStart: payload
      }));

    const onUpdateGunState = (payload) =>
      setEvents((prev) => ({
        ...prev,
        gunStateUpdate: payload
      }));

    const onResolvePunishment = (payload) =>
      setEvents((prev) => ({
        ...prev,
        resolvePunishment: payload
      }));

    const onShowResultNotification = (payload) =>
      setEvents((prev) => ({
        ...prev,
        showResultNotification: payload
      }));

    const onClearTable = (payload) =>
      setEvents((prev) => ({
        ...prev,
        clearTable: payload
      }));

    const onPlayerRemoved = ({ nickname }) =>
      setEvents((prev) => ({
        ...prev,
        toast: `${nickname || "Player"} was removed by host.`
      }));

    const onPlayerLeft = ({ playerId, nickname }) =>
      setEvents((prev) => ({
        ...prev,
        toast: `${nickname || "A player"} left the game`
      }));

    // ✅ SOCKET LISTENERS
    socket.on("roomState", onRoomState);
    socket.on("revealCards", onReveal);
    socket.on("revolverResult", onRevolverResult);
    socket.on("gameEnd", onGameEnd);
    socket.on("challengeWindowStart", onChallengeWindow);
    socket.on("nextTurn", onNextTurn);
    socket.on("cardsPlacedOnTable", onCardsPlacedOnTable);
    socket.on("challengePressed", onChallengePressed);
    socket.on("continuePressed", onContinuePressed);
    socket.on("revealComplete", onRevealComplete);
    socket.on("startGunSequence", onStartGunSequence);
    socket.on("setTarget", onSetTarget);
    socket.on("startPersonalRevolver", onStartPersonalRevolver);
    socket.on("updateGunState", onUpdateGunState);
    socket.on("resolvePunishment", onResolvePunishment);
    socket.on("showResultNotification", onShowResultNotification);
    socket.on("playerRemoved", onPlayerRemoved);
    socket.on("player_left", onPlayerLeft); // ✅ FIXED EVENT
    socket.on("clearTable", onClearTable);

    // ✅ CLEANUP
    return () => {
      socket.off("roomState", onRoomState);
      socket.off("revealCards", onReveal);
      socket.off("revolverResult", onRevolverResult);
      socket.off("gameEnd", onGameEnd);
      socket.off("challengeWindowStart", onChallengeWindow);
      socket.off("nextTurn", onNextTurn);
      socket.off("cardsPlacedOnTable", onCardsPlacedOnTable);
      socket.off("challengePressed", onChallengePressed);
      socket.off("continuePressed", onContinuePressed);
      socket.off("revealComplete", onRevealComplete);
      socket.off("startGunSequence", onStartGunSequence);
      socket.off("setTarget", onSetTarget);
      socket.off("startPersonalRevolver", onStartPersonalRevolver);
      socket.off("updateGunState", onUpdateGunState);
      socket.off("resolvePunishment", onResolvePunishment);
      socket.off("showResultNotification", onShowResultNotification);
      socket.off("clearTable", onClearTable);
      socket.off("playerRemoved", onPlayerRemoved);
      socket.off("player_left", onPlayerLeft);
    };
  }, []);

  return {
    socket,
    roomState,
    events,
    clearReveal: () => setEvents((prev) => ({ ...prev, reveal: null })),
    clearRevolver: () => setEvents((prev) => ({ ...prev, revolver: null })),
    clearPersonalRevolverStart: () =>
      setEvents((prev) => ({ ...prev, personalRevolverStart: null })),
    clearGameEnd: () => setEvents((prev) => ({ ...prev, gameEnd: null })),
    clearResultNotification: () =>
      setEvents((prev) => ({ ...prev, showResultNotification: null })),
    clearToast: () => setEvents((prev) => ({ ...prev, toast: null }))
  };
};