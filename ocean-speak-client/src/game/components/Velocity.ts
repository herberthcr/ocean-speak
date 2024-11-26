export interface Velocity {
  vx: number;
  vy: number;
  speed: number; // Speed multiplier
  disabled?: boolean; // Indicates whether collision is temporarily disabled
}