import { useCallback, useRef } from "react";
import { CHARACTER_OPTIONS } from "../constants/characters";
import CharacterPortrait from "./CharacterPortrait";

const LobbyScreen = ({ state, me, onSelectCharacter, onReady, onStart }) => {
  const isHost = state.hostId === me?.id;
  const taken = new Set(state.players.filter((p) => p.id !== me?.id).map((p) => p.character));
  const audioCtxRef = useRef(null);

  const playSelectSfx = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.14);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // Browser may block audio context until a user interaction.
    }
  }, []);

  const handleSelectCharacter = useCallback(
    (name) => {
      playSelectSfx();
      onSelectCharacter(name);
    },
    [onSelectCharacter, playSelectSfx]
  );

  return (
    <div className="flex min-h-screen flex-col p-4 md:p-8">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gold">Lobby Room: {state.roomCode}</h2>
          <p className="text-sm text-zinc-300">{state.players.length}/6 players</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.players.map((player) => (
          <div key={player.id} className={`glass rounded-2xl p-4 ${player.id === state.hostId ? "ring-1 ring-gold" : ""}`}>
            <div className="flex items-center gap-3">
              <CharacterPortrait
                characterName={player.character}
                alt={player.character}
                className="h-12 w-12 border border-gold/45"
                rounded="rounded-lg"
              />
              <p className="font-semibold">{player.nickname}</p>
            </div>
            <p className="text-xs text-zinc-400">{player.id === state.hostId ? "Host" : "Guest"}</p>
            <p className="mt-2 text-sm text-gold">{player.character}</p>
            <p className="text-xs text-zinc-300">{player.isReady ? "Ready" : "Waiting"}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 premium-glass rounded-2xl p-4">
        <p className="mb-3 text-sm uppercase tracking-wide text-zinc-400">Choose character</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHARACTER_OPTIONS.map((char) => {
            const selected = me?.character === char.name;
            const locked = taken.has(char.name);
            return (
              <button
                key={char.key}
                onClick={() => handleSelectCharacter(char.name)}
                disabled={locked}
                className={`group overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                  selected ? "border-gold ring-1 ring-gold shadow-[0_0_24px_rgba(217,184,111,0.45)]" : "border-white/15"
                } ${
                  locked
                    ? "cursor-not-allowed opacity-45"
                    : "hover:-translate-y-1 hover:border-gold/80 hover:shadow-[0_0_20px_rgba(217,184,111,0.35)]"
                }`}
              >
                <div className={`h-28 bg-gradient-to-br ${char.accent} p-1.5`}>
                  <CharacterPortrait
                    characterName={char.name}
                    alt={char.name}
                    fit="contain"
                    className="h-full w-full bg-black/20 transition-transform duration-300 group-hover:scale-105"
                    imageClassName="p-1"
                    rounded="rounded-lg"
                  />
                </div>
                <div className="bg-black/45 px-3 py-2">
                  <p className="flex items-center justify-between text-sm font-semibold text-zinc-100">
                    {char.name}
                    {selected ? <span className="text-gold">✔</span> : null}
                  </p>
                  <p className="text-[11px] text-zinc-400">{char.title}</p>
                  {locked ? <p className="mt-1 text-[11px] text-rose-300">Locked</p> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={() => onReady(!me?.isReady)} className="btn-gold">
          {me?.isReady ? "Unready" : "Ready"}
        </button>
        {isHost ? (
          <button onClick={onStart} className="rounded-xl border border-gold/60 px-4 py-2 font-semibold text-gold">
            Start Game
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default LobbyScreen;
