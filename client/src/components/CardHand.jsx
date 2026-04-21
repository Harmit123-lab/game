import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const MAX_SELECTED = 3;

const CardHand = ({ hand, canPlay, onPlay, roundTarget, compact }) => {
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSelectedCardIds((prev) => prev.filter((id) => hand?.some((card) => card.id === id)));
  }, [hand]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(""), 1200);
    return () => clearTimeout(timeout);
  }, [notice]);

  const toggleCard = (id) => {
    setSelectedCardIds((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= MAX_SELECTED) {
        setNotice("Maximum 3 cards per turn");
        return prev;
      }
      return [...prev, id];
    });
  };

  const playLabel = selectedCardIds.length === 1 ? "Play 1 Card" : `Play ${selectedCardIds.length} Cards`;
  const canSubmit = canPlay && selectedCardIds.length > 0;

  return (
    <div className={`absolute bottom-3 left-1/2 z-30 w-[min(92vw,1200px)] -translate-x-1/2 transition-all ${compact ? "md:w-[min(90vw,1150px)] md:ml-6" : "md:w-[min(91vw,1170px)] md:ml-10"}`}>
      <div className="relative">
        <button
          onClick={() => canSubmit && onPlay(selectedCardIds)}
          disabled={!canSubmit}
          className="btn-gold absolute -top-10 right-1 z-20 px-4 py-1.5 text-sm disabled:opacity-45"
        >
          {selectedCardIds.length ? playLabel : "Play Selected Cards"}
        </button>
      </div>
      <div className="premium-glass rounded-2xl px-2.5 pb-1.5 pt-1.5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-300">Target claim: {roundTarget}</p>
          <p className="text-[11px] text-zinc-400">
            Selected: <span className="text-gold">{selectedCardIds.length}</span>/3
          </p>
        </div>
        {notice ? <p className="mb-1 text-center text-xs text-amber-300">{notice}</p> : null}
        <div className="flex gap-1.5 px-1 pb-1 pt-1">
          {hand?.map((card, index) => {
            const selected = selectedCardIds.includes(card.id);
            const selectionLocked = selectedCardIds.length >= MAX_SELECTED && !selected;
            const rowRotate = Math.max(-3, Math.min(3, (index - (hand.length - 1) / 2) * 0.35));
            return (
              <motion.button
                whileHover={{ y: -10, scale: 1.02, rotate: rowRotate }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                key={card.id}
                onClick={() => toggleCard(card.id)}
                disabled={!canPlay || selectionLocked}
                style={{ rotate: `${rowRotate}deg`, flex: `1 1 ${100 / hand.length}%` }}
                animate={
                  selected
                    ? { y: -16, scale: 1.04, boxShadow: "0 0 28px rgba(245, 188, 93, 0.6)" }
                    : { y: 0, scale: 1, boxShadow: "0 12px 24px rgba(0,0,0,0.35)" }
                }
                className={`premium-card relative min-h-[114px] rounded-xl border p-2 text-left text-black shadow-lg disabled:opacity-45 md:min-h-[128px] ${
                  selected ? "border-amber-400 ring-2 ring-amber-300/85" : "border-[#c8aa68] saturate-90"
                }`}
              >
                {selected ? (
                  <div className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full border border-amber-300 bg-amber-500 text-xs text-black">
                    ✓
                  </div>
                ) : (
                  <div className="absolute right-2 top-2 text-[10px] text-[#967230]">✦</div>
                )}
                <p className="text-[10px] uppercase text-zinc-500">{card.suit}</p>
                <p className="font-serif text-2xl font-black leading-none md:text-[28px]">{card.rank}</p>
                <p className="mt-5 text-xs text-[#694f20]">{card.suit}</p>
                <div className="absolute bottom-1.5 left-2 text-[9px] text-[#ad8a44]">Premium Deck</div>
                {!selected ? <div className="absolute inset-0 rounded-xl bg-black/0 transition group-hover:bg-black/5" /> : null}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CardHand;
