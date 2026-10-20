import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Function to save or update a student's profile and schedule
export const saveUserProfile = async (userId, userData) => {
  try {
    // This writes (or overwrites) a document in the "users" collection
    await setDoc(doc(db, "users", userId), userData);
    console.log("User profile saved successfully!");
  } catch (error) {
    console.error("Error saving user profile: ", error);
  }
};

// Function to find classmates sharing a specific class period
export const findClassmates = async (periodNumber, classId) => {
  try {
    const q = query(
      collection(db, "users"), 
      where(`schedule.period${periodNumber}`, "==", classId)
    );
    const querySnapshot = await getDocs(q);
    const classmates = [];
    querySnapshot.forEach((doc) => {
      classmates.push({ id: doc.id, ...doc.data() });
    });
    return classmates;
  } catch (error) {
    console.error("Error finding classmates: ", error);
    return [];
  }
};
