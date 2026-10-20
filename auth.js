import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

// Only accounts on this domain can use the app.
export const ALLOWED_DOMAIN = 'stuy.edu';

// TODO: paste your WEB client ID here. Find it in the Firebase console:
// Authentication -> Sign-in method -> Google -> Web SDK configuration -> Web client ID.
// (It is NOT the iOS client ID used in app.json.)
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  // Hint for Google's account picker. The real check is isStuyEmail() below,
  // plus the Firestore security rules in firestore.rules.
  hostedDomain: ALLOWED_DOMAIN,
});

export const isStuyEmail = (email) =>
  typeof email === 'string' &&
  email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);

// Turns a Google response into a Firebase session, rejecting non-Stuy accounts.
const signInToFirebase = async (response) => {
  const { idToken, user } = response.data;

  if (!isStuyEmail(user?.email)) {
    await GoogleSignin.signOut();
    throw new Error(`Please sign in with your @${ALLOWED_DOMAIN} Google account.`);
  }
  if (!idToken) {
    throw new Error('Google did not return an ID token. Check the web client ID in auth.js.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
};

// Interactive Google sign-in. Returns the Firebase user, or null if the student cancelled.
export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  return signInToFirebase(response);
};

// Re-creates the Firebase session on app launch without showing any UI.
// Returns the user, or null if there is no saved Google sign-in.
export const restoreSession = async () => {
  try {
    const response = await GoogleSignin.signInSilently();
    if (!isSuccessResponse(response)) return null;
    return await signInToFirebase(response);
  } catch (error) {
    console.log('No session to restore:', error?.message);
    return null;
  }
};

export const logOutStudent = async () => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google sign-out error:', error?.message);
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase sign-out error:', error?.message);
  }
};
