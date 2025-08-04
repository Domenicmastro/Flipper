import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

const AuthLayout = () => {
    const currentUser = useSelector((state: RootState) => state.users.currentUser);

    if (currentUser) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen flex">
            <div className="hidden md:flex w-1/2 bg-gray-100 items-center justify-center p-10">
                <img
                    src="/logo.png"
                    alt="Flipper Logo"
                    className="max-h-screen w-auto object-contain"
                />
            </div>

            <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;