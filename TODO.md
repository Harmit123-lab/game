# Card Animations and Table Improvements

Status: ✅ COMPLETE

## Changes Made:
- **PhaserTableScene.js**: Smoother back card fly-in with scale bounce, alpha/glow fades, Elastic easing.
- **CasinoTable.jsx**: Plain face-down backs (no texture), bigger revealed cards (h-28 w-20, bold text/shadows), enhanced flip stagger.

## Verified Flows:
- Play cards: Smooth Phaser anim → plain stacked backs on table.
- Challenge: Flip → big cards shown → gun popup.
- Continue: Pile removes without flip/reveal.

## Test:
`npm run dev` → play/challenge/continue to verify.

All requirements met.

