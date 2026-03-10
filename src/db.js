import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ── JOB APPLICATIONS ──────────────────────────────────────────────────────────

export function subscribeToJobs(userId, callback) {
  const q = query(
    collection(db, "users", userId, "jobs"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(jobs);
  });
}

export async function addJob(userId, job) {
  return addDoc(collection(db, "users", userId, "jobs"), {
    ...job,
    createdAt: serverTimestamp(),
  });
}

export async function updateJob(userId, jobId, updates) {
  return updateDoc(doc(db, "users", userId, "jobs", jobId), updates);
}

export async function deleteJob(userId, jobId) {
  return deleteDoc(doc(db, "users", userId, "jobs", jobId));
}

// ── COVER LETTERS ─────────────────────────────────────────────────────────────

export function subscribeToCoverLetters(userId, callback) {
  const q = query(
    collection(db, "users", userId, "coverLetters"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const letters = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(letters);
  });
}

export async function saveCoverLetter(userId, data) {
  return addDoc(collection(db, "users", userId, "coverLetters"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function deleteCoverLetter(userId, letterId) {
  return deleteDoc(doc(db, "users", userId, "coverLetters", letterId));
}

// ── RESUME SCORES ─────────────────────────────────────────────────────────────

export async function saveResumeScore(userId, data) {
  return addDoc(collection(db, "users", userId, "resumeScores"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToResumeScores(userId, callback) {
  const q = query(
    collection(db, "users", userId, "resumeScores"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const scores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(scores);
  });
}
