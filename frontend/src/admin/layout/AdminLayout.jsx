import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const titles = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/contact-messages": "Contact Inbox",
  "/admin/replacements": "Replacement Requests",
  "/admin/products": "Products",
  "/admin/coupons": "Coupons",
  "/admin/promotions": "Promotions",
  "/admin/banners": "Popup Campaigns",
  "/admin/customers": "Customers",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Admin Settings",
};

const placeholders = {
  "/admin/orders": "Search orders by name, email, or order ID",
  "/admin/contact-messages": "Search by name, email, phone, or subject",
  "/admin/products": "Search products...",
  "/admin/coupons": "Search coupons",
  "/admin/promotions": "Search announcements, popup campaigns, or coupon codes",
  "/admin/banners": "Search popup campaigns by title or coupon code",
  "/admin/customers": "Search customers by name, email, or phone",
};

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const title = useMemo(() => {
    if (location.pathname.startsWith("/admin/customers/")) {
      return "Customer Profile";
    }

    if (location.pathname.startsWith("/admin/replacements/")) {
      return "Replacement Details";
    }

    if (location.pathname === "/admin/products/new") {
      return "Add Product";
    }

    if (location.pathname.startsWith("/admin/products/") && location.pathname.endsWith("/edit")) {
      return "Edit Product";
    }

    if (location.pathname === "/admin/coupons/new") {
      return "Create Coupon";
    }

    if (location.pathname.startsWith("/admin/coupons/") && location.pathname.endsWith("/edit")) {
      return "Edit Coupon";
    }

    if (location.pathname === "/admin/banners/new") {
      return "Create Popup Campaign";
    }

    if (location.pathname.startsWith("/admin/banners/") && location.pathname.endsWith("/edit")) {
      return "Edit Popup Campaign";
    }

    return titles[location.pathname] ?? "Admin";
  }, [location.pathname]);
  const placeholder = useMemo(() => {
    if (location.pathname.startsWith("/admin/customers/")) {
      return "Search customer history, orders, or contact details";
    }

    return placeholders[location.pathname] ?? "Search this page";
  }, [location.pathname]);
  const search = searchParams.get("q") ?? "";
  const searchEnabled = Boolean(placeholders[location.pathname]);

  const handleSearchChange = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          placeholder={placeholder}
          searchValue={search}
          onSearchChange={handleSearchChange}
          onOpenSidebar={() => setSidebarOpen(true)}
          searchEnabled={searchEnabled}
        />

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-6 xl:px-8">
          <Outlet context={{ search, setSearch: handleSearchChange }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
