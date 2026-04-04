import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const titles = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/contact-messages": "Contact inbox",
  "/admin/replacements": "Replacements",
  "/admin/products": "Products",
  "/admin/coupons": "Coupons",
  "/admin/banners": "Festive banners",
  "/admin/customers": "Customers",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

const placeholders = {
  "/admin/orders": "Search orders by ID, customer, or email",
  "/admin/contact-messages": "Search messages by name, email, phone, or subject",
  "/admin/products": "Search products by name, SKU, slug, or description",
  "/admin/coupons": "Search coupons by code or campaign status",
  "/admin/banners": "Search banners by title or linked coupon",
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
      return "Customer profile";
    }

    if (location.pathname.startsWith("/admin/replacements/")) {
      return "Review replacement";
    }

    if (location.pathname === "/admin/products/new") {
      return "Add product";
    }

    if (location.pathname.startsWith("/admin/products/") && location.pathname.endsWith("/edit")) {
      return "Edit product";
    }

    if (location.pathname === "/admin/coupons/new") {
      return "Create coupon";
    }

    if (location.pathname.startsWith("/admin/coupons/") && location.pathname.endsWith("/edit")) {
      return "Edit coupon";
    }

    if (location.pathname === "/admin/banners/new") {
      return "Create festive banner";
    }

    if (location.pathname.startsWith("/admin/banners/") && location.pathname.endsWith("/edit")) {
      return "Edit festive banner";
    }

    return titles[location.pathname] ?? "Admin";
  }, [location.pathname]);
  const placeholder = useMemo(() => {
    if (location.pathname.startsWith("/admin/customers/")) {
      return "Search customer history, orders, or contact details";
    }

    return placeholders[location.pathname] ?? "Search this workspace";
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
          <Outlet context={{ search }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
