import '../App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/NavBar.tsx';
import ProtectedRoute from "../components/ProtectedRoute.tsx";

import {
  Home,
  PurchasePage,
  SwipePage,
  UserProfile,
  Wishlist,
  Settings,
  Messages,
  Recommended,
  ViewAllProducts
} from '../pages';


const MainLayout = () => {
    return (
        <>
            {/*<AuthListener />*/}
            <Navbar />
            <Routes>
                {/* Protected routes */}
                {/* Home page, shown at root URL ("/") */}
                <Route
                    path ="/"
                    element={
                        <Home />
                    }
                />
                {/* Purchase page, dynamic route with product ID */}
                <Route
                    path="/purchase/:id"
                    element={
                        <ProtectedRoute>
                            <PurchasePage />
                        </ProtectedRoute>
                    }
                />
                {/* Swipe page */}
                <Route
                    path="/swipe"
                    element={
                        <ProtectedRoute>
                            <SwipePage />
                        </ProtectedRoute>
                    }
                />
                {/* View All page */}
                <Route
                    path="/ViewAll"
                    element={
                        <ProtectedRoute>
                            <ViewAllProducts />
                        </ProtectedRoute>
                    }
                />
                {/* User profile page */}
                <Route
                    path="/user/:id"
                    element={
                        <ProtectedRoute>
                            <UserProfile />
                        </ProtectedRoute>
                    }
                />
                {/* Wishlist Page */}
                <Route
                    path="/wishlist"
                    element={
                        <ProtectedRoute>
                            <Wishlist />
                        </ProtectedRoute>
                    }
                />
                {/* Settings Page */}
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />
                {/* Messages Page */}
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

                {/* Recommended Page */}
                <Route
                    path="/recommended"
                    element={
                        <ProtectedRoute>
                            <Recommended />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </>
    );
}

export default MainLayout;
