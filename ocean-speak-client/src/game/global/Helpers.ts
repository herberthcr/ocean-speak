
export class Helpers {
  /**
   * Capitalizes the first letter of a string
   * @param val - The string to capitalize
   * @returns A string with the first letter capitalized
   */
  static capitalizeFirstLetter(val: string): string {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  }

  /**
   * Picks a random element from an array
   * @param array - The array to pick from
   * @returns A random element from the array
   */
  static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generates a random integer between min and max (inclusive)
   * @param min - The minimum value
   * @param max - The maximum value
   * @returns A random integer between min and max
   */
  static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Formats a number with leading zeros
   * @param num - The number to format
   * @param length - The desired length
   * @returns A string with the number padded with leading zeros
   */
  static formatWithLeadingZeros(num: number, length: number): string {
    return String(num).padStart(length, '0');
  }

  /**
   * Clamps a number within a given range
   * @param value - The number to clamp
   * @param min - The minimum bound
   * @param max - The maximum bound
   * @returns The clamped value
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}