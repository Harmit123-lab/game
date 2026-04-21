import { motion } from "framer-motion";

const CasinoTable = ({ centerLabel = "Face-down stack", pileCount = 0, turnName, showPulse, playedBy, revealedCards, revealBanner }) => (
  <div className="pointer-events-none relative mx-auto flex h-[320px] w-full max-w-[980px] items-center justify-center md:h-[380px]">
    <div className="absolute inset-0 rounded-[42%] bg-[radial-gradient(circle_at_50%_50%,rgba(200,156,90,0.32),transparent_58%)] blur-2xl" />
    <div className="table-frame relative h-[88%] w-[94%] max-w-[940px] rounded-[42%] p-[14px] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
      <div className="table-felt relative h-full w-full rounded-[40%]">
        <div className="absolute inset-0 rounded-[40%] border border-white/5" />
        <div className="absolute left-1/2 top-1/2 h-28 w-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gold/35 bg-black/35 shadow-[0_0_26px_rgba(217,184,111,0.35)]">
          <div className="grid h-full place-items-center text-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-300">{centerLabel}</p>
            <p className="text-xs text-zinc-400">{pileCount} card(s) on stack</p>
            {playedBy ? <p className="text-[11px] text-amber-200">{playedBy} played {pileCount}</p> : null}
          </div>
        </div>
        {!revealedCards?.length && pileCount > 0 ? (
          <div className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2">
            {Array.from({ length: pileCount }).map((_, idx) => (
              <motion.div
                key={`back-${idx}`}
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: idx * -2, opacity: 1 }}
                transition={{ duration: 0.2, delay: idx * 0.07 }}
                className="absolute left-0 top-0 h-20 w-14 rounded-lg border border-gold/45 bg-[linear-gradient(145deg,#2a303d,#121822)] shadow-xl"
                style={{ left: idx * 7, top: idx * -2, rotate: `${idx * 1.5}deg` }}
              >
                <div className="m-1 h-[calc(100%-8px)] rounded-md border border-gold/35 bg-[radial-gradient(circle_at_50%_35%,rgba(217,184,111,0.3),rgba(20,28,39,0.9))]" />
              </motion.div>
            ))}
          </div>
        ) : null}
        {revealedCards?.length ? (
          <div className="absolute left-1/2 top-[54%] flex -translate-x-1/2 -translate-y-1/2">
            {revealedCards.map((card, idx) => (
              <motion.div
                key={card.id || `${card.rank}-${card.suit}-${idx}`}
                initial={{ rotateY: 90, y: -20, opacity: 0 }}
                animate={{ rotateY: 0, y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="premium-card relative -ml-3 h-20 w-14 rounded-lg border border-[#d4b06f] p-1 text-black shadow-xl first:ml-0"
              >
                <p className="text-[10px] font-semibold leading-none">{card.rank}</p>
                <p className="text-[9px] text-zinc-700">{card.suit}</p>
              </motion.div>
            ))}
          </div>
        ) : null}
        {revealBanner ? (
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`absolute left-1/2 top-5 -translate-x-1/2 rounded-full border px-4 py-1 text-sm font-bold ${
              revealBanner.lied ? "border-red-400/70 bg-red-500/25 text-red-100" : "border-gold/70 bg-gold/20 text-amber-100"
            }`}
          >
            {revealBanner.lied ? "Lie Detected!" : "Truth Confirmed"} {revealBanner.subtitle ? `- ${revealBanner.subtitle}` : ""}
          </motion.div>
        ) : null}
        <motion.div
          animate={showPulse ? { scale: [1, 1.05, 1], opacity: [0.35, 0.65, 0.35] } : { scale: 1, opacity: 0.25 }}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/35"
        />
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-gold/25 bg-black/30 px-4 py-1 text-xs text-zinc-200">
          Current turn: <span className="font-semibold text-gold">{turnName || "Waiting"}</span>
        </div>
      </div>
    </div>
  </div>
);

export default CasinoTable;
