import { useEffect, useMemo, useRef, useState } from "react";
import CasinoTable from "../components/CasinoTable";
import CardHand from "../components/CardHand";
import GameHud from "../components/GameHud";
import PlayerSidePanel from "../components/PlayerSidePanel";
import RevealResultBanner from "../components/RevealResultBanner";
import RevolverOverlay from "../components/RevolverOverlay";
import ToastMessage from "../components/ToastMessage";
import WinnerModal from "../components/WinnerModal";
import { createPhaserGame } from "../game/createGame";

const GameRoomPage = ({
  state,
  me,
  events,
  muted,
  setMuted,
  onPlayCards,
  onChallenge,
  onContinue,
  onRemovePlayer,
  onCloseOverlay,
  onReplay,
  onDismissToast
}) => {
  const containerRef = useRef(null);
  const phaserRef = useRef(null);
  const sceneRef = useRef(null);
  const [challengeSeconds, setChallengeSeconds] = useState(0);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [tableView, setTableView] = useState({
    byPlayerId: null,
    cardCount: 0,
    cards: [],
    revealBanner: null
  });
  const [revealResultBanner, setRevealResultBanner] = useState(null);

  useEffect(() => {
    phaserRef.current = createPhaserGame("phaser-table");
    phaserRef.current.events.on("ready", () => {});
    const scene = phaserRef.current.scene.getScene("TableScene");
    sceneRef.current = scene;
    return () => {
      phaserRef.current?.destroy(true);
      phaserRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !state) return;
    scene.updatePlayers(state.players, state.currentTurnPlayerId);
  }, [state]);

  useEffect(() => {
    if (events.revolver && sceneRef.current) {
      sceneRef.current.revolverCinematic(events.revolver.isBang, events.revolver.shooterId, events.revolver.punishedId);
    }
  }, [events.revolver]);

  useEffect(() => {
    if (events.playedCard && sceneRef.current) {
      sceneRef.current.playCardAnimation(events.playedCard.cardCount || 1);
    }
    if (events.playedCard) {
      setTableView({
        byPlayerId: events.playedCard.byPlayerId,
        cardCount: events.playedCard.cardCount || 0,
        cards: [],
        revealBanner: null
      });
    }
  }, [events.playedCard]);

  useEffect(() => {
    if (!events.reveal) return;
    const playedBy = state.players.find((p) => p.id === events.reveal.playedById);
    const isChallengedReveal = events.reveal.punishedId != null && events.reveal.shooterId != null;
    setTableView((prev) => ({
      ...prev,
      byPlayerId: events.reveal.playedById,
      cards: isChallengedReveal ? events.reveal.actualCards || [] : [],
      revealBanner: {
        lied: isChallengedReveal ? Boolean(events.reveal.lied) : false,
        subtitle: `${playedBy?.nickname || "Player"} | Target was ${events.reveal.claim}`
      }
    }));
  }, [events.reveal, state.players]);

  useEffect(() => {
    if (!events.revealComplete) return;
    setTableView({
      byPlayerId: null,
      cardCount: 0,
      cards: [],
      revealBanner: null
    });
  }, [events.revealComplete]);

  useEffect(() => {
    if (!events.startGunSequence && !events.revolver && !events.nextTurn) return;
    setTableView({
      byPlayerId: null,
      cardCount: 0,
      cards: [],
      revealBanner: null
    });
  }, [events.startGunSequence, events.revolver, events.nextTurn]);

  useEffect(() => {
    if (!events.showResultNotification) return;
    setRevealResultBanner({
      id: events.showResultNotification.id,
      lied: Boolean(events.showResultNotification.lied),
      message: events.showResultNotification.lied
        ? `${events.showResultNotification.playerName || "Player"} lied about the target card!`
        : `${events.showResultNotification.playerName || "Player"} told the truth!`
    });
  }, [events.showResultNotification]);

  useEffect(() => {
    if (!revealResultBanner) return undefined;
    const timeout = setTimeout(() => setRevealResultBanner(null), 2000);
    return () => clearTimeout(timeout);
  }, [revealResultBanner]);

  useEffect(() => {
    if (!events.clearTable) return;
    setTableView({
      byPlayerId: null,
      cardCount: 0,
      cards: [],
      revealBanner: null
    });
  }, [events.clearTable]);

  useEffect(() => {
    let rafId = null;
    let throttledTime = 0;
    const tick = () => {
      throttledTime += 16;
      if (throttledTime >= 100) {
        throttledTime = 0;
        if (events.challengeWindow?.expiresAt) {
          const startedAt = events.challengeWindow.startedAt || Date.now();
          const totalMs = Math.max(1, events.challengeWindow.expiresAt - startedAt);
          const now = Date.now();
          const remainingMs = Math.max(0, events.challengeWindow.expiresAt - now);
          const remaining = Math.ceil(remainingMs / 1000);
          const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
          setChallengeSeconds(remaining);
          setChallengeProgress(pct);
        } else {
          setChallengeSeconds(0);
          setChallengeProgress(0);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [events.challengeWindow]);

  useEffect(() => {
    if (!events.toast) return undefined;
    const timeout = setTimeout(() => onDismissToast(), 2000);
    return () => clearTimeout(timeout);
  }, [events.toast]);


  const winner = useMemo(
    () => state.players.find((p) => p.id === state.winnerId),
    [state.players, state.winnerId]
  );

  const canPlay =
    me?.id === state.currentTurnPlayerId && me?.alive && state.status === "in_game" && state.phase === "playerSelecting";

  const shooterId =
    events.revolver?.shooterId ||
    events.personalRevolverStart?.shooterId ||
    events.resolvePunishment?.shooterId ||
    events.reveal?.shooterId;
  const targetId =
    events.revolver?.punishedId ||
    events.personalRevolverStart?.punishedId ||
    events.resolvePunishment?.punishedId ||
    events.reveal?.punishedId;
  const chamberOwnerId =
    events.revolver?.chamberOwnerId ||
    events.resolvePunishment?.chamberOwnerId ||
    events.personalRevolverStart?.shooterId ||
    events.reveal?.shooterId;

  const shooter = state.players.find((p) => p.id === shooterId);
  const target = state.players.find((p) => p.id === targetId);
  const chamberOwner = state.players.find((p) => p.id === chamberOwnerId);
  const compactLayout = state.players.length >= 5;
  const tableLeft = compactLayout ? "md:left-52" : "md:left-60";
  const orderedPlayers = [...state.players].sort((a, b) => {
    if (a.id === me?.id) return -1;
    if (b.id === me?.id) return 1;
    return a.seat - b.seat;
  });
  const revolverActors = {
    shooterId,
    targetId,
    chamberOwnerId,
    shooterName: shooter?.nickname || null,
    targetName: target?.nickname || null,
    chamberOwnerName: chamberOwner?.nickname || null
  };
  const turnPlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-[#0a0c10]">
      <div id="phaser-table" className="absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(30,53,38,0.45),rgba(8,10,14,0.9)_58%)]" />
      <PlayerSidePanel
        players={orderedPlayers}
        currentTurnPlayerId={state.currentTurnPlayerId}
        punishedPlayerId={targetId}
        viewerId={me?.id}
        compact={compactLayout}
        hostId={state.hostId}
        onRemovePlayer={onRemovePlayer}
      />
      <GameHud
        state={state}
        me={me}
        muted={muted}
        setMuted={setMuted}
        onChallenge={onChallenge}
        onContinue={onContinue}
        challengeSeconds={challengeSeconds}
        challengeProgress={challengeProgress}
        compact={compactLayout}
      />
      <RevolverOverlay
        reveal={events.reveal}
        revolverStart={events.personalRevolverStart}
        revolver={events.revolver}
        onClose={onCloseOverlay}
        shooter={shooter}
        target={target}
        chamberOwner={chamberOwner}
        actors={revolverActors}
        muted={muted}
      />
      <div className={`absolute inset-x-4 top-24 z-10 flex items-center justify-center md:top-28 md:right-8 ${tableLeft}`}>
        <CasinoTable
          centerLabel="Played face-down cards"
          pileCount={tableView.cardCount}
          turnName={turnPlayer?.nickname}
          showPulse={state.phase === "challengeWindow"}
          playedBy={state.players.find((p) => p.id === tableView.byPlayerId)?.nickname}
          revealedCards={tableView.cards}
          revealBanner={tableView.revealBanner}
        />
      </div>
      <CardHand hand={me?.hand || []} canPlay={canPlay} onPlay={onPlayCards} roundTarget={state.roundTarget} compact={compactLayout} />
      <WinnerModal winner={winner} onReplay={onReplay} />
    </div>
  );
};

export default GameRoomPage;
