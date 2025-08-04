
import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../redux/store";

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const currentUser = useSelector((state: RootState) => state.users.currentUser);
    const isGuest = localStorage.getItem("isGuest") === "true";

    if (!currentUser && !isGuest) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;