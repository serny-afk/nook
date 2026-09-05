import Phaser from "phaser";

export function createGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent,
    backgroundColor: "#2d2d2d",
    scene: {
      create() {
        this.add.text(20, 20, "Nook", {
          fontSize: "32px",
        });
      },
    },
  });
}