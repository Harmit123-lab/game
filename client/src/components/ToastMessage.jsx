import { AnimatePresence, motion } from "framer-motion";

const ToastMessage = ({ message }) => (
  <AnimatePresence>
    {message ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="pointer-events-none absolute bottom-28 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-gold/40 bg-black/70 px-4 py-2 text-sm text-zinc-100 shadow-glow"
      >
        {message}
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default ToastMessage;
