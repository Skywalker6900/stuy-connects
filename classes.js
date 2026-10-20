import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// 1. Fetch all classes from Firestore, sorted by name
export const fetchAllClasses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'classes'));
    const classesList = [];
    querySnapshot.forEach((doc) => {
      classesList.push({ id: doc.id, ...doc.data() });
    });
    return classesList.sort((a, b) => (a.className || '').localeCompare(b.className || ''));
  } catch (error) {
    console.error('Error fetching classes: ', error);
    return [];
  }
};

// 2. Search the class list by class name or teacher. Names that start with the
// search text come first, and the result is capped so the dropdown stays short.
export const searchClasses = (classes, text, maxResults = 8) => {
  const term = text.trim().toLowerCase();
  if (!term) return [];

  const startsWith = [];
  const contains = [];
  for (const item of classes) {
    const name = (item.className || '').toLowerCase();
    const teacher = (item.teacher || '').toLowerCase();
    if (name.startsWith(term)) startsWith.push(item);
    else if (name.includes(term) || teacher.includes(term)) contains.push(item);
  }
  return [...startsWith, ...contains].slice(0, maxResults);
};

// 3. Helper to add a test class (run this once to populate your database!)
export const addTestClass = async (className, period, teacher) => {
  try {
    await addDoc(collection(db, 'classes'), { className, period, teacher });
    console.log(`Added test class: ${className}`);
  } catch (error) {
    console.error('Error adding class: ', error);
  }
};
