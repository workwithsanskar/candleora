import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import AdminRoute from "./admin/components/AdminRoute";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteLoader from "./components/RouteLoader";
import ScrollToTop from "./components/ScrollToTop";
import { destroySmoothScroll, initSmoothScroll, resizeSmoothScroll } from "./utils/smoothScroll";

const AboutUs = lazy(() => import("./pages/AboutUs"));
const AccountDetails = lazy(() => import("./pages/AccountDetails"));
const AuraChatbot = lazy(() => import("./components/AuraChatbot"));
const AdminLayout = lazy(() => import("./admin/layout/AdminLayout"));
const AdminAnalytics = lazy(() => import("./admin/pages/Analytics"));
const AdminCustomers = lazy(() => import("./admin/pages/Customers"));
const AdminCustomerDetail = lazy(() => import("./admin/pages/CustomerDetail"));
const AdminDashboard = lazy(() => import("./admin/pages/Dashboard"));
const AdminOrders = lazy(() => import("./admin/pages/Orders"));
const AdminProducts = lazy(() => import("./admin/pages/Products"));
const AdminCoupons = lazy(() => import("./admin/pages/Coupons"));
const AdminSettings = lazy(() => import("./admin/pages/Settings"));
const CandleFixes = lazy(() => import("./pages/CandleFixes"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OccasionPicks = lazy(() => import("./pages/OccasionPicks"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Orders = lazy(() => import("./pages/Orders"));
const PhonePeReturn = lazy(() => import("./pages/PhonePeReturn"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Shop = lazy(() => import("./pages/Shop"));
const Signup = lazy(() => import("./pages/Signup"));
const StylingGuideDetail = lazy(() => import("./pages/StylingGuideDetail"));
const StylingGuides = lazy(() => import("./pages/StylingGuides"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const UnderConstruction = lazy(() => import("./pages/UnderConstruction"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));

function AppShell() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    initSmoothScroll();
    return () => destroySmoothScroll();
  }, []);

  useEffect(() => {
    resizeSmoothScroll();
  }, [location.pathname, location.search]);

  const pageMotion = prefersReducedMotion
    ? {
        initial: false,
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <>
      <ScrollToTop />
      <div className={isAdminRoute ? "min-h-screen bg-white text-brand-dark" : "flex min-h-screen flex-col bg-white text-brand-dark"}>
        {!isAdminRoute ? <Navbar /> : null}

        <AnimatePresence mode="wait" initial={false}>
          <m.main key={location.pathname} className={isAdminRoute ? "min-h-screen" : "flex-1"} {...pageMotion}>
            <Suspense fallback={<RouteLoader />}>
              <Routes location={location}>
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="customers/:customerId" element={<AdminCustomerDetail />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/occasion-picks" element={<OccasionPicks />} />
                <Route path="/styling-guides" element={<StylingGuides />} />
                <Route path="/styling-guides/:slug" element={<StylingGuideDetail />} />
                <Route path="/under-construction" element={<UnderConstruction />} />
                <Route path="/under-construction/:featureSlug" element={<UnderConstruction />} />
                <Route path="/candle-fixes" element={<CandleFixes />} />
                <Route path="/fixes" element={<CandleFixes />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/phonepe-return"
                  element={
                    <ProtectedRoute>
                      <PhonePeReturn />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/details"
                  element={
                    <ProtectedRoute>
                      <AccountDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/track"
                  element={
                    <ProtectedRoute>
                      <TrackOrder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-confirmation/:orderId"
                  element={
                    <ProtectedRoute>
                      <OrderConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </m.main>
        </AnimatePresence>

        {!isAdminRoute ? (
          <Suspense fallback={null}>
            <AuraChatbot />
          </Suspense>
        ) : null}

        {!isAdminRoute ? <Footer /> : null}
      </div>
    </>
  );
}

function App() {
  return (
    <LazyMotion features={domAnimation}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </LazyMotion>
  );
}

export default App;
