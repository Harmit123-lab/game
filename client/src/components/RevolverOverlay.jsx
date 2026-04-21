import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getCharacterMeta } from "../constants/characters";
import CharacterPortrait from "./CharacterPortrait";

const PHASE = {
  INTRO: "intro",
  GUN_ENTER: "gunEnter",
  SPIN: "spin",
  LOCK: "lock",
  AIM: "aim",
  TRIGGER: "trigger",
  RESULT: "result"
};

const playSfx = (ctxRef, muted, type) => {
  if (muted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) ctxRef.current = new AudioCtx();
    const ctx = ctxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    if (type === "spin") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc.start(now);
      osc.stop(now + 0.7);
      return;
    }
    if (type === "lock") {
      osc.type = "square";
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.2);
      return;
    }
    if (type === "bang") {
      osc.type = "square";
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.24);
      return;
    }
    if (type === "click") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(860, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.12);
      return;
    }
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // Browser may block audio context until user gesture.
  }
};

const RevolverOverlay = ({ revolverStart, revolver, onClose, shooter, target, chamberOwner, actors, muted }) => {
  const open = Boolean(revolverStart || revolver);
  const [phase, setPhase] = useState(PHASE.INTRO);
  const [canSkip, setCanSkip] = useState(false);
  const audioCtxRef = useRef(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setPhase(PHASE.INTRO);
    setCanSkip(false);
    setShowResult(false);
    const timers = [];
    timers.push(setTimeout(() => setCanSkip(true), 2500));
    timers.push(setTimeout(() => setPhase(PHASE.GUN_ENTER), 700));
    timers.push(setTimeout(() => {
      setPhase(PHASE.SPIN);
      playSfx(audioCtxRef, muted, "spin");
    }, 1300));
    timers.push(setTimeout(() => {
      setPhase(PHASE.LOCK);
      playSfx(audioCtxRef, muted, "lock");
    }, 3300));
    timers.push(setTimeout(() => setPhase(PHASE.AIM), 4000));
    timers.push(setTimeout(() => setPhase(PHASE.TRIGGER), 4800));
    return () => timers.forEach((t) => clearTimeout(t));
  }, [open, muted]);

  useEffect(() => {
    if (!revolver) return;
    setPhase(PHASE.RESULT);
    setShowResult(true);
    playSfx(audioCtxRef, muted, revolver.isBang ? "bang" : "click");
    const closeTimer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(closeTimer);
  }, [revolver, onClose, muted]);

  const shooterLabel = shooter?.nickname || actors?.shooterName || actors?.shooterId || "Unknown shooter";
  const targetLabel = target?.nickname || actors?.targetName || actors?.targetId || "Unknown target";
  const chamberOwnerLabel =
    chamberOwner?.nickname || actors?.chamberOwnerName || actors?.chamberOwnerId || targetLabel || "Unknown";

  const title = useMemo(() => {
    if (!revolver) return "Resolving Challenge";
    return revolver.isBang ? "ELIMINATED" : "SURVIVED";
  }, [revolver]);
  const shooterMeta = getCharacterMeta(shooter?.character);
  const targetMeta = getCharacterMeta(target?.character);
  const isSelfShot = Boolean(shooter?.id && target?.id && shooter.id === target.id);
  const actionLabel = isSelfShot ? `${shooterLabel} shoots himself` : `${shooterLabel} shoots ${targetLabel}`;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-50 ${revolver?.isBang ? "gun-hit-shake" : ""}`}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,184,111,0.12),rgba(0,0,0,0.92)_62%)]" />
          {revolver?.isBang ? <div className="gun-flash-frame absolute inset-0" /> : null}

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-title text-xs tracking-[0.34em] text-gold"
            >
              CHALLENGE RESOLVED
            </motion.p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-zinc-300">
              {revolver?.isBang ? "Lie punished." : "Trigger outcome resolved."}
            </p>
            <p className="mt-2 text-sm font-semibold text-amber-200">{actionLabel}</p>
            <div className="relative mt-6 grid w-full max-w-6xl grid-cols-3 items-center gap-4">
              <motion.div
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className={`text-center transition ${phase === PHASE.RESULT && revolver?.isBang ? "opacity-80" : ""}`}
              >
                <CharacterPortrait
                  characterName={shooter?.character}
                  alt={shooterMeta.name}
                  className={`mx-auto h-44 w-32 border border-gold/35 md:h-56 md:w-40 ${
                    phase === PHASE.RESULT && revolver?.isBang ? "translate-x-2 -rotate-3" : ""
                  }`}
                  rounded="rounded-2xl"
                />
                <p className="mt-2 text-lg font-bold text-zinc-100">{shooterLabel}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">{shooterMeta.title}</p>
              </motion.div>

              <div className="relative h-48 md:h-56">
              <motion.div
                initial={{ x: "-110%", rotate: -16, opacity: 0 }}
                animate={{
                  x:
                    phase === PHASE.INTRO
                      ? "-110%"
                      : phase === PHASE.AIM || phase === PHASE.TRIGGER || phase === PHASE.RESULT
                        ? isSelfShot
                          ? "-6%"
                          : "8%"
                        : "0%",
                  rotate:
                    phase === PHASE.AIM || phase === PHASE.TRIGGER || phase === PHASE.RESULT
                      ? isSelfShot
                        ? -14
                        : 7
                      : -6,
                  opacity: 1
                }}
                transition={{ type: "spring", stiffness: 120, damping: 25, ...(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { type: "tween", duration: 0.3 } : {}) }}
                className="absolute left-0 top-1/2 h-24 w-72 -translate-y-1/2 md:h-28 md:w-96"
              >
                <div className="relative h-full w-full">
                  <div className="absolute bottom-0 left-2 h-4 w-64 rounded-full bg-black/45 blur-md md:w-80" />
                  <div className="absolute left-0 top-7 h-12 w-52 rounded-r-3xl rounded-tl-2xl rounded-bl-2xl border border-zinc-300/45 bg-gradient-to-b from-zinc-300/85 to-zinc-700/85 md:w-64" />
                  <div className="absolute right-2 top-10 h-5 w-28 rounded-full border border-zinc-400/50 bg-gradient-to-b from-zinc-400/80 to-zinc-800/95 md:w-36" />
                  <motion.div
                    animate={{ rotate: phase === PHASE.SPIN ? 1080 : 0 }}
                    transition={{ duration: 2, ease: [0.2, 0.9, 0.2, 1] }}
                    className="absolute left-24 top-4 grid h-16 w-16 grid-cols-3 gap-1 rounded-full border border-zinc-300/45 bg-zinc-900/90 p-1 md:left-32 md:h-20 md:w-20"
                  >
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`rounded-full border ${revolver && idx === (revolver.chamberBefore ?? 0) ? "border-gold bg-gold/70" : "border-zinc-500 bg-zinc-800"}`}
                      />
                    ))}
                  </motion.div>
                  {(phase === PHASE.RESULT || phase === PHASE.TRIGGER) && revolver ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute right-0 top-5 h-14 w-14 rounded-full blur-sm ${revolver.isBang ? "bg-amber-200/75" : "bg-zinc-300/30"}`}
                    />
                  ) : null}
                  {phase === PHASE.LOCK ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute left-1/2 top-2 -translate-x-1/2 rounded-md border border-gold/50 bg-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gold"
                    >
                      Locked
                    </motion.div>
                  ) : null}
                  {phase === PHASE.TRIGGER ? (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute right-8 top-10 h-3 w-8 rounded-full border border-zinc-500/70 bg-zinc-700/90"
                    />
                  ) : null}
                  {phase === PHASE.RESULT && revolver?.isBang ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: [0, 1, 0.25], scaleX: [0, 1, 1.2] }}
                        transition={{ duration: 0.35 }}
                        className={`absolute top-[46px] h-2 w-28 rounded-full ${
                          isSelfShot
                            ? "left-[-88px] origin-right bg-gradient-to-l from-amber-100 via-amber-300 to-transparent"
                            : "right-[-90px] origin-left bg-gradient-to-r from-amber-100 via-amber-300 to-transparent"
                        }`}
                      />
                      <motion.div
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          x: isSelfShot ? [0, -75, -120] : [0, 75, 120],
                          y: [0, -6, -10]
                        }}
                        transition={{ duration: 0.45 }}
                        className={`absolute top-[46px] h-2 w-2 rounded-full bg-amber-200 blur-[1px] ${
                          isSelfShot ? "left-[-8px]" : "right-[-10px]"
                        }`}
                      />
                    </>
                  ) : null}
                  {phase === PHASE.RESULT && !revolver?.isBang ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.1, 1.3] }}
                      transition={{ duration: 0.8 }}
                      className="absolute right-[-14px] top-[36px] h-10 w-10 rounded-full bg-zinc-200/35 blur-md"
                    />
                  ) : null}
                </div>
              </motion.div>
              </div>

              <motion.div
                initial={{ x: 80, opacity: 0 }}
                animate={{
                  x: phase === PHASE.RESULT && revolver?.isBang ? 22 : 0,
                  opacity: phase === PHASE.RESULT && revolver?.isBang ? 0.4 : 1,
                  rotate: phase === PHASE.RESULT && revolver?.isBang ? -8 : 0
                }}
                transition={{ duration: 0.7 }}
                className="text-center"
              >
                <CharacterPortrait
                  characterName={target?.character}
                  alt={targetMeta.name}
                  className={`mx-auto h-44 w-32 border border-rose-300/35 md:h-56 md:w-40 ${
                    phase === PHASE.TRIGGER ? "animate-pulse" : ""
                  }`}
                  rounded="rounded-2xl"
                />
                <p className="mt-2 text-lg font-bold text-zinc-100">{targetLabel}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-rose-300">{targetMeta.title}</p>
                {phase === PHASE.RESULT && revolver?.isBang ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: [0, 0.8, 0.4], scale: [0.4, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mt-2 h-8 w-8 rounded-full bg-rose-500/60 blur-sm"
                  />
                ) : null}
              </motion.div>
            </div>

            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm uppercase tracking-[0.24em] text-zinc-300"
            >
              {phase === PHASE.SPIN && "Cylinder spinning..."}
              {phase === PHASE.LOCK && "Chamber locked..."}
              {phase === PHASE.AIM && "Aiming..."}
              {phase === PHASE.TRIGGER && "Trigger press..."}
              {phase === PHASE.RESULT && title}
            </motion.p>
            <p className="mt-1 text-xs text-zinc-300">
              Shooter: <span className="text-zinc-200">{shooterLabel}</span> | Target:{" "}
              <span className="text-zinc-200">{isSelfShot ? "Himself" : targetLabel}</span> | Chamber Used:{" "}
              <span className="text-zinc-200">{chamberOwnerLabel}</span>
            </p>

            {showResult ? (
              <motion.button
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="btn-gold mt-5 px-8 py-2"
              >
                Continue
              </motion.button>
            ) : canSkip ? (
              <button onClick={onClose} className="mt-5 rounded-full border border-white/30 px-4 py-1 text-xs text-zinc-200 hover:bg-white/10">
                Skip
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default RevolverOverlay;
