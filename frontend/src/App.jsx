import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import CandleFixes from "./pages/CandleFixes";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import FAQ from "./pages/FAQ";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import OccasionPicks from "./pages/OccasionPicks";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import Shop from "./pages/Shop";
import Signup from "./pages/Signup";
import StylingGuideDetail from "./pages/StylingGuideDetail";
import StylingGuides from "./pages/StylingGuides";

function App() {
  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="absolute inset-0 bg-soft-radial opacity-80" />
        <Navbar />

        <main className="relative flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/occasion-picks" element={<OccasionPicks />} />
            <Route path="/styling-guides" element={<StylingGuides />} />
            <Route path="/styling-guides/:slug" element={<StylingGuideDetail />} />
            <Route path="/candle-fixes" element={<CandleFixes />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
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
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route path="/track" element={<Navigate replace to="/orders" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
