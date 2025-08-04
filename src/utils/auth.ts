import { auth } from "@/backend/firebase/firebase"; // Firebase auth instance
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	FacebookAuthProvider,
	onAuthStateChanged,
	type User,
} from "firebase/auth";
import type { AppDispatch } from "@/frontend/redux/store";
import {
	setCurrentUser,
	setAuthInitialized,
	fetchUserById,
} from "@/frontend/redux/slices/userSlice";

// Sign up with email and password
export const signUp = async (email: string, password: string) => {
	return await createUserWithEmailAndPassword(auth, email, password);
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
	return await signInWithEmailAndPassword(auth, email, password);
};

// Sign out the current user
export const signOutUser = async () => {
	return await auth.signOut();
};

// Sign in with Google popup
export const signInWithGoogle = async () => {
	const provider = new GoogleAuthProvider();
	return await signInWithPopup(auth, provider);
};

// Sign in with Facebook popup
export const signInWithFacebook = async () => {
	const provider = new FacebookAuthProvider();
	return await signInWithPopup(auth, provider);
};

// Get the currently signed-in user (returns null if no user)
export const getCurrentUser = (): User | null => {
	return auth.currentUser;
};

// Listen to Firebase Auth state changes and update Redux store
export const observeAuthState = (dispatch: AppDispatch) => {
	return onAuthStateChanged(auth, async (user) => {
		if (user) {
			const resultAction = await dispatch(fetchUserById(user.uid));
			if (fetchUserById.fulfilled.match(resultAction)) {
				dispatch(setCurrentUser(resultAction.payload)); // <-- this is the fix
			} else {
				dispatch(setCurrentUser(null));
			}
			dispatch(setAuthInitialized(true));
		} else {
			dispatch(setCurrentUser(null));
			dispatch(setAuthInitialized(true));
		}
	});
};

// Returns a Promise that resolves when auth state is known (user or null)
export const waitForAuthUser = (): Promise<User | null> => {
	return new Promise((resolve) => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			unsubscribe(); // Unsubscribe after first callback
			resolve(user);
		});
	});
};
