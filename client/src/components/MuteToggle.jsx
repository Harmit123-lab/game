const MuteToggle = ({ muted, setMuted }) => (
  <button
    onClick={() => setMuted((v) => !v)}
    className="absolute right-4 top-4 z-30 rounded-full border border-gold/60 bg-black/45 px-3 py-1 text-sm"
  >
    {muted ? "Unmute" : "Mute"}
  </button>
);

export default MuteToggle;
