export default class MathUtility {
    static clamp(num: number, max: number, min: number): number {
        return Math.min(Math.max(num, min), max);
    }
    static randomIntegerInclusive(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
