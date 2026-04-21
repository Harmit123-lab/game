import { useCallback, useMemo, useState } from "react";
import HomeScreen from "./components/HomeScreen";
import LobbyScreen from "./components/LobbyScreen";
import { useGameSocket } from "./hooks/useGameSocket";
import GameRoomPage from "./pages/GameRoomPage";

function App() {
  const {
    socket,
    roomState,
    events,
    clearReveal,
    clearRevolver,
    clearPersonalRevolverStart,
    clearGameEnd,
    clearToast,
    clearResultNotification
  } = useGameSocket();
  const [nickname, setNickname] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);

  const me = useMemo(
    () => roomState?.players?.find((p) => p.id === socket.id),
    [roomState?.players, socket.id]
  );

  const callAck = (event, payload = {}) =>
    new Promise((resolve) => {
      socket.emit(event, payload, (res) => resolve(res));
    });

  const onCreateRoom = async () => {
    setError("");
    const res = await callAck("createRoom", { nickname: nickname.trim() || "Player" });
    if (!res?.ok) setError(res?.error || "Failed to create room.");
  };

  const onJoinRoom = async () => {
    setError("");
    const res = await callAck("joinRoom", {
      roomCode: roomCodeInput.trim(),
      nickname: nickname.trim() || "Player"
    });
    if (!res?.ok) setError(res?.error || "Failed to join room.");
  };

  const onPlayCards = async (cardIds) => {
    const res = await callAck("playCards", { cardIds });
    if (!res?.ok) setError(res.error);
  };

  const onChallenge = async () => {
    const res = await callAck("challengePlayer");
    if (!res?.ok) setError(res.error);
  };

  const onContinue = async () => {
    const res = await callAck("continueTurn");
    if (!res?.ok) setError(res.error);
  };

  const onReplay = async () => {
    clearGameEnd();
    await callAck("leaveRoom");
    window.location.reload();
  };

  const onRemovePlayer = async (player) => {
    if (!player?.id || player.id === socket.id) return;
    const ok = window.confirm(`Remove ${player.nickname} from room?`);
    if (!ok) return;
    const res = await callAck("removePlayer", { playerId: player.id });
    if (!res?.ok) setError(res?.error || "Failed to remove player.");
  };

  const dismissToast = useCallback(() => {
    clearToast();
  }, [clearToast]);

  if (!roomState) {
    return (
      <HomeScreen
        nickname={nickname}
        setNickname={setNickname}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        onCreateRoom={onCreateRoom}
        onJoinRoom={onJoinRoom}
        error={error}
      />
    );
  }

  if (roomState.status === "lobby") {
    return (
      <LobbyScreen
        state={roomState}
        me={me}
        onSelectCharacter={(character) => socket.emit("selectCharacter", { character })}
        onReady={(isReady) => socket.emit("playerReady", { isReady })}
        onStart={() => socket.emit("startGame")}
      />
    );
  }

  return (
    <GameRoomPage
      state={roomState}
      me={me}
      events={events}
      muted={muted}
      setMuted={setMuted}
      onPlayCards={onPlayCards}
      onChallenge={onChallenge}
      onContinue={onContinue}
      onRemovePlayer={onRemovePlayer}
      onCloseOverlay={() => {
        clearReveal();
        clearRevolver();
        clearPersonalRevolverStart();
        clearResultNotification();
      }}
      onReplay={onReplay}
      onDismissToast={dismissToast}
    />
  );
}

export default App;
