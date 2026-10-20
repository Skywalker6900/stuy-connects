import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
  } from 'firebase/auth';
  import { auth } from './firebaseConfig';
  
  // 1. Sign up a new student
  export const signUpStudent = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registered:", userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error("Signup error:", error.message);
      throw error;
    }
  };
  
  // 2. Log in an existing student
  export const logInStudent = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  };
  
  // 3. Log out
  export const logOutStudent = async () => {
    try {
      await signOut(auth);
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };
  