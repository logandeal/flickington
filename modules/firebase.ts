import { initializeApp } from 'firebase/app';
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
} from 'firebase/firestore';

const firebaseApp = initializeApp({ projectId: 'flickington' });
const db = getFirestore();
connectFirestoreEmulator(db, 'localhost', 8080);

export function getFirestoreDb() {
  return db;
}
