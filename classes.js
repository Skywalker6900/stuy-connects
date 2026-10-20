import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// 1. Fetch all classes from Firestore
export const fetchAllClasses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "classes"));
    const classesList = [];
    querySnapshot.forEach((doc) => {
      classesList.push({ id: doc.id, ...doc.data() });
    });
    return classesList;
  } catch (error) {
    console.error("Error fetching classes: ", error);
    return [];
  }
};

// 2. Helper to add a test class (run this once to populate your database!)
export const addTestClass = async (className, period, teacher) => {
  try {
    await addDoc(collection(db, "classes"), { className, period, teacher });
    console.log(`Added test class: ${className}`);
  } catch (error) {
    console.error("Error adding class: ", error);
  }
};
