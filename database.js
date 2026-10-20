import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const withIds = (snapshot) => snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

/* ---------------- Profiles & schedules ---------------- */

// Merges into the student's profile so saving one field never wipes the others.
export const saveUserProfile = async (userId, data) => {
  await setDoc(doc(db, 'users', userId), data, { merge: true });
};

export const getUserProfile = async (userId) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
};

// Puts a class into one period (or clears it when classId is null).
export const saveSchedulePeriod = async (userId, period, classId) => {
  await setDoc(
    doc(db, 'users', userId),
    { schedule: { [`period${period}`]: classId } },
    { merge: true }
  );
};

// Everyone who has the same class in the same period.
export const findClassmates = async (period, classId) => {
  const q = query(
    collection(db, 'users'),
    where(`schedule.period${period}`, '==', classId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, socials: data.socials };
  });
};

/* ---------------- Opportunities bulletin ---------------- */

export const POST_CATEGORIES = ['Club', 'Team', 'Tutoring', 'Study group', 'Internship', 'Other'];

// Live feed of the newest posts. Returns the unsubscribe function.
export const subscribeToPosts = (onPosts, onError) => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => onPosts(withIds(snapshot)), onError);
};

export const addPost = async ({ title, body, category, authorId, authorName }) => {
  await addDoc(collection(db, 'posts'), {
    title,
    body,
    category,
    authorId,
    authorName,
    createdAt: serverTimestamp(),
  });
};

export const deletePost = async (postId) => {
  await deleteDoc(doc(db, 'posts', postId));
};

/* ---------------- Teacher directory & class resources ---------------- */

export const fetchTeachers = async () => {
  const snapshot = await getDocs(query(collection(db, 'teachers'), orderBy('name')));
  return withIds(snapshot);
};

export const addTeacher = async ({ name, room, subject, authorId }) => {
  await addDoc(collection(db, 'teachers'), {
    name,
    room,
    subject,
    authorId,
    createdAt: serverTimestamp(),
  });
};

export const fetchResources = async () => {
  const snapshot = await getDocs(
    query(collection(db, 'resources'), orderBy('createdAt', 'desc'), limit(200))
  );
  return withIds(snapshot);
};

export const addResource = async ({ classId, className, title, url, authorId }) => {
  await addDoc(collection(db, 'resources'), {
    classId,
    className,
    title,
    url,
    authorId,
    createdAt: serverTimestamp(),
  });
};
