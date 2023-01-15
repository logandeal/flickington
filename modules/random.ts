import crypto from "crypto";

export function getRandomBase64(numBytes: number): string {
  return crypto.randomBytes(numBytes).toString("base64");
}

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

export function getRandomIntSetInRange(
  min: number,
  max: number,
  count: number
) {
  const set = new Set();
  // Asking for more random integers than are in the range, so just add them all.
  if (max - min <= count) {
    for (let i = min; i < max; i++) {
      set.add(i);
    }
  } else {
    const array = [];
    for (let i = min; i < max; i++) {
      array.push(i);
    }
    shuffleArray(array);
    for (let i = 0; i < count; i++) {
      set.add(array[i]);
    }
  }
  return set;
}
