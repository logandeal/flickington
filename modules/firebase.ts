import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  getDocs,
  getFirestore,
  connectFirestoreEmulator,
  documentId,
} from "firebase/firestore";

const firebaseApp = initializeApp({ projectId: "flickington" });
const db = getFirestore();
function startEmulators() {
  if (!global.areEmulatorsStarted) {
    console.log("Starting emulators...");
    global.areEmulatorsStarted = true;
    connectFirestoreEmulator(db, "localhost", 8080);
  }
}

if (process.env.NODE_ENV === "development") {
  startEmulators();
}

export function getFirestoreDb() {
  return db;
}
