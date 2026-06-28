import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

import CustomerLayout from './layouts/CustomerLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy-loaded pages (code splitting)
const HomePage = lazy(() => import('./pages/customer/HomePage'));
const CategoryPage = lazy(() => import('./pages/customer/CategoryPage'));
const ProductPage = lazy(() => import('./pages/customer/ProductPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const AccountPage = lazy(() => import('./pages/customer/AccountPage'));
const OffersPage = lazy(() => import('./pages/customer/OffersPage'));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'));
const SearchPage = lazy(() => import('./pages/customer/SearchPage'));

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

const StaffOrders = lazy(() => import('./pages/staff/StaffOrders'));
const StaffProducts = lazy(() => import('./pages/staff/StaffProducts'));
const StaffInventory = lazy(() => import('./pages/staff/StaffInventory'));
const StaffPOS = lazy(() => import('./pages/staff/StaffPOS'));

const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminStaffActivity = lazy(() => import('./pages/admin/AdminStaffActivity'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

const DeliveryDashboard = lazy(() => import('./pages/delivery/DeliveryDashboard'));
const OrderTracking = lazy(() => import('./pages/customer/OrderTracking'));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Auth Pages */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Customer Portal */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/category/:categoryId" element={<CategoryPage />} />
                  <Route path="/product/:productId" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/checkout" element={
                    <ProtectedRoute><CheckoutPage /></ProtectedRoute>
                  } />
                  <Route path="/account" element={
                    <ProtectedRoute><AccountPage /></ProtectedRoute>
                  } />
                  <Route path="/track/:orderId" element={
                    <ProtectedRoute><OrderTracking /></ProtectedRoute>
                  } />
                  <Route path="/delivery" element={
                    <ProtectedRoute roles={['DELIVERY']}><DeliveryDashboard /></ProtectedRoute>
                  } />
                </Route>

                {/* Staff Dashboard */}
                <Route element={
                  <ProtectedRoute roles={['MANAGEMENT', 'ADMIN']}>
                    <DashboardLayout type="staff" />
                  </ProtectedRoute>
                }>
                  <Route path="/staff" element={<StaffOrders />} />
                  <Route path="/staff/orders" element={<StaffOrders />} />
                  <Route path="/staff/products" element={<StaffProducts />} />
                  <Route path="/staff/inventory" element={<StaffInventory />} />
                  <Route path="/staff/pos" element={<StaffPOS />} />
                </Route>

                {/* Admin Dashboard */}
                <Route element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <DashboardLayout type="admin" />
                  </ProtectedRoute>
                }>
                  <Route path="/admin" element={<AdminOverview />} />
                  <Route path="/admin/overview" element={<AdminOverview />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                  <Route path="/admin/staff-activity" element={<AdminStaffActivity />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                </Route>

                {/* 404 Catch-all */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
