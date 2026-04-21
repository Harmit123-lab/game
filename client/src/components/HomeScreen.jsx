import { motion } from "framer-motion";

const HomeScreen = ({
  nickname,
  setNickname,
  roomCodeInput,
  setRoomCodeInput,
  onCreateRoom,
  onJoinRoom,
  error
}) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,184,111,0.2),transparent_35%),radial-gradient(circle_at_80%_25%,rgba(180,30,85,0.22),transparent_35%)]" />
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass z-10 w-full max-w-xl rounded-3xl p-8 shadow-glow"
    >
      <h1 className="text-center text-4xl font-black tracking-wide text-gold">BLUFF REVOLVER</h1>
      <p className="mt-2 text-center text-sm text-zinc-300">Steam-grade party tension, right in your browser.</p>
      <div className="mt-6 space-y-3">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname"
          className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 outline-none focus:border-gold"
        />
        <button onClick={onCreateRoom} className="btn-gold w-full">
          Create Private Room
        </button>
        <input
          value={roomCodeInput}
          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
          placeholder="Room code"
          className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 uppercase outline-none focus:border-gold"
        />
        <button onClick={onJoinRoom} className="w-full rounded-xl border border-gold/60 px-4 py-3 font-semibold text-gold">
          Join Room
        </button>
        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
      </div>
    </motion.div>
  </div>
);

export default HomeScreen;
