import { useEffect } from "react";
import { auth } from "../../backend/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../redux/slices/userSlice";
import type { AppDispatch } from "../redux/store";

const PORT = 3000;

export default function AuthListener() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const response = await fetch(`http://localhost:${PORT}/api/users/get-or-create/${user.uid}`, {
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({user: user})
          });
          const fullUser = await response.json();
          dispatch(setCurrentUser(fullUser));
        } catch (err) {
          console.error("Failed to sync user:", err);
          dispatch(setCurrentUser(null));
        }
      } else {
        dispatch(setCurrentUser(null));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}