const StatItem = ({ icon, label, value, valueClass = "" }) => (
  <div className="min-w-0 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
    <p className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
      <span aria-hidden>{icon}</span>
      {label}
    </p>
    <p className={`truncate text-sm font-semibold text-zinc-100 ${valueClass}`}>{value}</p>
  </div>
);

const ChallengeRing = ({ seconds, progress }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative h-14 w-14">
      <svg className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={radius} className="fill-none stroke-zinc-700" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="fill-none stroke-gold transition-[stroke-dashoffset] duration-200"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold text-gold">{seconds}</span>
    </div>
  );
};

const GameHud = ({ state, me, muted, setMuted, onChallenge, onContinue, challengeSeconds, challengeProgress, compact }) => {
  const currentTurnId = state.currentTurnPlayerId;
  const turnPlayer = state.players.find((p) => p.id === currentTurnId);
  const alive = state.players.filter((p) => p.alive).length;
  const pending = state.pendingChallenge;
  const canChallenge = pending?.challengerId === me?.id && me?.alive && state.phase === "challengeWindow";
  const canContinue = canChallenge;

  return (
    <div className={`pointer-events-none absolute left-4 right-4 top-4 z-30 transition-all ${compact ? "lg:left-52" : "lg:left-60"}`}>
      <div className="premium-glass rounded-2xl px-3 py-3 shadow-2xl">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          <StatItem icon="🎯" label="Target" value={state.roundTarget || "-"} valueClass="text-gold" />
          <StatItem icon="🕹" label="Turn" value={turnPlayer?.nickname || "Waiting"} />
          <StatItem icon="❤" label="Alive" value={`${alive}/${state.players.length}`} />
          <StatItem icon="◍" label="Round" value={state.round || 1} />
          <StatItem icon="⌂" label="Room" value={state.roomCode || "----"} valueClass="tracking-[0.2em]" />
          <StatItem
            icon="⏱"
            label="Challenge"
            value={state.phase === "challengeWindow" ? `${challengeSeconds}s` : "Closed"}
            valueClass={state.phase === "challengeWindow" ? "text-amber-300" : ""}
          />
          <button
            onClick={() => setMuted((v) => !v)}
            className="pointer-events-auto rounded-xl border border-gold/45 bg-black/35 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:border-gold hover:bg-black/55"
          >
            {muted ? "🔇 Sound Off" : "🔊 Sound On"}
          </button>
        </div>

        {canChallenge ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-300/45 bg-amber-500/10 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300">Challenge Window</p>
              <p className="text-sm text-zinc-100">You can challenge now. Act before timer expires.</p>
            </div>
            <div className="pointer-events-auto flex items-center gap-3">
              <ChallengeRing seconds={challengeSeconds} progress={challengeProgress} />
              <div className="flex items-center gap-2">
                <button onClick={onChallenge} className="btn-warning px-4 py-2 text-sm">
                  Challenge Claim
                </button>
                <button onClick={onContinue} className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/15">
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GameHud;
