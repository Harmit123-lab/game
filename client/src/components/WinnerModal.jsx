import { motion } from "framer-motion";
import CharacterPortrait from "./CharacterPortrait";

const WinnerModal = ({ winner, onReplay }) => {
  if (!winner) return null;
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/75">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass mx-3 w-full max-w-lg rounded-3xl p-8 text-center"
      >
        <p className="text-sm uppercase tracking-[0.3em] text-gold">Winner</p>
        <CharacterPortrait
          characterName={winner.character}
          alt={winner.character}
          className="mx-auto mt-4 h-36 w-28 border border-gold/45"
          rounded="rounded-2xl"
        />
        <h3 className="mt-2 text-4xl font-black">{winner.nickname}</h3>
        <p className="mt-2 text-zinc-300">{winner.character}</p>
        <button onClick={onReplay} className="btn-gold mt-6">
          Return To Lobby
        </button>
      </motion.div>
    </div>
  );
};

export default WinnerModal;
