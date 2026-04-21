import Phaser from "phaser";

export default class PhaserTableScene extends Phaser.Scene {
  constructor() {
    super("TableScene");
    this.players = [];
    this.turnId = null;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#08080d");

    const bg = this.add.rectangle(width / 2, height / 2, width * 1.2, height * 1.2, 0x120c14, 1);
    bg.setPipeline("Light2D");

    const glow = this.add.ellipse(width / 2, height / 2 + 24, width * 0.78, height * 0.5, 0x6e2f1f, 0.3);
    const table = this.add.ellipse(width / 2, height / 2 + 24, width * 0.62, height * 0.36, 0x4b2d1b, 1);
    table.setStrokeStyle(7, 0xd9b86f, 0.8);
    const felt = this.add.ellipse(width / 2, height / 2 + 24, width * 0.5, height * 0.28, 0x1c4a3d, 0.55);

    this.turnGlow = this.add.circle(width / 2, height / 2, 48, 0xd9b86f, 0.28);
    this.turnGlow.setVisible(false);

    this.cardDeck = this.add.rectangle(width / 2, height / 2, 44, 62, 0x10131a, 1);
    this.cardDeck.setStrokeStyle(2, 0xd9b86f, 1);

    this.revolverBody = this.add.rectangle(width / 2, height / 2, 150, 54, 0x757983, 0.9);
    this.revolverBody.setStrokeStyle(2, 0xd8d8d8, 0.6);
    this.revolverBody.setVisible(false);
    this.chambers = [];
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      const chamber = this.add.circle(
        width / 2 + Math.cos(angle) * 22,
        height / 2 + Math.sin(angle) * 22,
        7,
        0x2e3139,
        1
      );
      chamber.setVisible(false);
      this.chambers.push(chamber);
    }

    this.tweens.add({
      targets: [glow, table, felt],
      alpha: { from: 0.88, to: 1 },
      duration: 2400,
      repeat: -1,
      yoyo: true,
      ease: "Sine.easeInOut"
    });
  }

  seatPosition(index, total) {
    const { width, height } = this.scale;
    const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2;
      const rx = width * 0.24;
      const ry = height * 0.15;
    return {
      x: width / 2 + Math.cos(angle) * rx,
      y: height / 2 + 22 + Math.sin(angle) * ry
    };
  }

  updatePlayers(players, turnId) {
    this.turnId = turnId;
    for (const seat of this.players) {
      seat.avatar.destroy();
      seat.name.destroy();
      seat.chambers.forEach((c) => c.destroy());
    }
    this.players = [];

    players.forEach((player, index) => {
      const pos = this.seatPosition(index, players.length);
      const alive = player.alive;
      const avatar = this.add.circle(pos.x, pos.y, 26, alive ? 0x8a4f38 : 0x2e2e2e, 1);
      avatar.setStrokeStyle(3, player.id === turnId ? 0xd9b86f : 0x241d1a, 1);
      const name = this.add.text(pos.x, pos.y + 38, player.nickname, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#f5e9cc"
      }).setOrigin(0.5, 0);
      name.setAlpha(alive ? 1 : 0.6);

      const chambers = [];
      for (let c = 0; c < 6; c += 1) {
        const chamberDot = this.add.circle(
          pos.x - 22 + c * 9,
          pos.y + 56,
          3.5,
          c === (player.gunProgress ?? 0) ? 0xf4ca6e : 0x4a4d57,
          1
        );
        chambers.push(chamberDot);
      }

      this.tweens.add({
        targets: avatar,
        scale: { from: 0.95, to: 1.02 },
        duration: 2000 + index * 120,
        repeat: -1,
        yoyo: true
      });
      this.players.push({ avatar, name, chambers });

      if (player.id === turnId) {
        this.turnGlow.setVisible(true);
        this.turnGlow.setPosition(pos.x, pos.y);
        this.tweens.add({
          targets: this.turnGlow,
          alpha: { from: 0.22, to: 0.45 },
          scale: { from: 0.85, to: 1.15 },
          duration: 850,
          repeat: -1,
          yoyo: true
        });
      }
    });
  }

  playCardAnimation(cardCount = 1) {
    const { width, height } = this.scale;
    const count = Math.min(cardCount, 8);
    for (let i = 0; i < count; i += 1) {
      const card = this.add.rectangle(width / 2, height * 0.83, 40, 58, 0x1a1f2c, 1);
      card.setStrokeStyle(2, 0xd9b86f, 1);
      this.tweens.add({
        targets: card,
        x: width / 2 + i * 4 - count * 2,
        y: height / 2 + i * 2,
        angle: 360 + i * 8,
        duration: 420 + i * 40,
        ease: "Cubic.easeOut",
        onComplete: () => card.destroy()
      });
    }
  }

  revolverCinematic(isBang) {
    this.revolverBody.setVisible(true);
    this.chambers.forEach((c) => c.setVisible(true));
    this.tweens.add({
      targets: [this.revolverBody, ...this.chambers],
      angle: 360,
      duration: 600,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.time.delayedCall(500, () => {
          this.revolverBody.setVisible(false);
          this.chambers.forEach((c) => c.setVisible(false));
        });
      }
    });
    this.cameras.main.shake(isBang ? 180 : 70, isBang ? 0.01 : 0.003);
    this.cameras.main.flash(120, 255, 230, 200, isBang);
  }
}
