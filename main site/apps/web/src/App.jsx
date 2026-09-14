import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/hooks/useCart';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from './components/ScrollToTop';
import SiteLayout from './components/SiteLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import DestinationsPage from './pages/DestinationsPage';
import StorePage from './pages/StorePage';
import ProductDetailPage from './pages/ProductDetailPage';
import InquiryPage from './pages/InquiryPage';
import SuccessPage from './pages/SuccessPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <ScrollToTop />
                    <Routes>
                        <Route element={<SiteLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/destinations" element={<DestinationsPage />} />
                            <Route path="/store" element={<StorePage />} />
                            <Route path="/product/:id" element={<ProductDetailPage />} />
                            <Route path="/inquiry" element={<InquiryPage />} />
                            <Route path="/success" element={<SuccessPage />} />
                        </Route>
                        <Route path="/admin/login" element={<AdminLoginPage />} />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute redirectTo="/admin/login">
                                    <AdminDashboardPage />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Router>
                <Toaster />
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
