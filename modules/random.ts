import crypto from "crypto";

export function getRandomBase64(numBytes: number): string {
  return crypto.randomBytes(numBytes).toString("base64");
}

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
