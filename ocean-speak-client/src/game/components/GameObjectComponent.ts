import Phaser from 'phaser';

export interface GameObjectComponent {
  sprite: Phaser.GameObjects.Sprite;
  type: string; // The type of the game object (e.g., "fish", "plant").
  grouped: boolean; // true or false if are part of a groups
}