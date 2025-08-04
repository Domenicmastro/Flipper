import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MainLayout from "./layouts/MainLayout"; // Navbar 포함된 layout
import AuthLayout from "./layouts/AuthLayout";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { observeAuthState } from "@/utils/auth";

import { useSelector } from "react-redux";
import type { RootState } from "@/frontend/redux/store";


function App() {
    const dispatch = useDispatch();
    const isAuthInitialized = useSelector(
        (state: RootState) => state.users.isAuthInitialized
    );

    useEffect(() => {
        // Subscribe to Firebase auth state changes
        const unsubscribe = observeAuthState(dispatch);
        return () => unsubscribe();
    }, [dispatch]);

    if (!isAuthInitialized) {
        // Loading state while auth is being initialized
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
                <svg
                    className="animate-spin h-16 w-16 text-gray-800"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                </svg>
                <p className="text-2xl font-bold text-gray-900 mt-6">Loading...</p>
            </div>
        );
    }

    return (
        <Routes>
            {/* Login & Signup pages without Navbar */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Route>

            {/* All other pages inside MainLayout (with Navbar + ProtectedRoute) */}
            <Route path="/*" element={<MainLayout />} />
        </Routes>
    );
}

export default App;