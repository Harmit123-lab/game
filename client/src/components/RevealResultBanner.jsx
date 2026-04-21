import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";



const RevealResultBanner = ({ result }) => {
  const lastPlayedIdRef = useRef(null);

  return (
    <AnimatePresence>
      {result ? (
        <motion.div
          initial={{ opacity: 0, y: -36, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          className={`pointer-events-none absolute left-1/2 top-20 z-40 w-[min(92vw,540px)] -translate-x-1/2 rounded-2xl border px-5 py-3 text-center shadow-2xl ${
"border-yellow-400/70 bg-gradient-to-r from-yellow-600/40 via-yellow-400/30 to-yellow-300/20"
          }`}
        >
          <motion.p
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            className="font-title text-lg tracking-[0.1em] text-zinc-100"
          >
"🔍 CARDS REVEALED"
          </motion.p>
          <p className="mt-1 text-sm text-zinc-100">{result.message}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default RevealResultBanner;
