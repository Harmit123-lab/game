import CharacterPortrait from "./CharacterPortrait";

const PlayerSidePanel = ({ players, currentTurnPlayerId, punishedPlayerId, viewerId, compact, hostId, onRemovePlayer }) => {
  const count = players.length;
  const rowHeightClass = count >= 6 ? "h-[88px]" : count >= 5 ? "h-[96px]" : "h-[104px]";
  const panelWidthClass = compact ? "w-48 lg:w-52" : "w-56 lg:w-60";
  const orderedPlayers = [...players].sort((a, b) => {
    if (a.id === viewerId) return -1;
    if (b.id === viewerId) return 1;
    return a.seat - b.seat;
  });

  return (
    <div className={`absolute left-4 top-24 z-20 space-y-1.5 pr-1 transition-all ${panelWidthClass}`}>
      {orderedPlayers.map((player) => {
        const isTurn = player.id === currentTurnPlayerId;
        const isPunished = player.id === punishedPlayerId;
        const isSelf = player.id === viewerId;
        const cardsRemaining = player.cardCount ?? player.cardsRemaining ?? player.handCount ?? "-";
        const canRemove = hostId === viewerId && !isSelf;
        return (
          <div
            key={player.id}
            className={`premium-glass ${rowHeightClass} rounded-xl px-2.5 py-2 transition-all ${
              player.alive ? "" : "opacity-50 grayscale"
            } ${isTurn ? "ring-1 ring-gold shadow-glow" : ""} ${
              isPunished ? "ring-2 ring-red-500/70" : ""
            } ${isSelf ? "border border-cyan-300/40 bg-cyan-500/5" : ""}`}
          >
            <div className="grid h-full grid-cols-[34px,1fr] gap-2">
              <CharacterPortrait
                characterName={player.character}
                alt={player.character}
                fit="contain"
                className="h-[70px] w-[34px] border border-gold/40 bg-black/35"
                rounded="rounded-md"
              />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-xs font-semibold">
                    {player.nickname} {isSelf ? <span className="text-cyan-200">(You)</span> : null}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] ${player.alive ? "text-emerald-300" : "text-rose-300"}`}>
                      {player.alive ? "Alive" : "Dead"}
                    </span>
                    {canRemove ? (
                      <button
                        onClick={() => onRemovePlayer?.(player)}
                        className="pointer-events-auto rounded-full border border-red-400/70 px-2 py-0.5 text-[10px] font-semibold text-red-300 transition hover:bg-red-500/15 hover:text-red-100"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="truncate text-[10px] text-zinc-400">{player.character}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-300">
                  <span>Chambers: {player.chambersLeft ?? 6}</span>
                  <span>Cards: {cardsRemaining}</span>
                </div>
                <div className="mt-1 grid grid-cols-6 gap-0.5">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full border ${
                        idx < (player.chambersUsed ?? 0) ? "border-gold bg-gold/80" : "border-zinc-600 bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerSidePanel;
