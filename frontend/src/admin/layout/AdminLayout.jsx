import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const titles = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/customers": "Customers",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

const placeholders = {
  "/admin/orders": "Search orders by ID, customer, or email",
  "/admin/products": "Search products by name, slug, or description",
  "/admin/customers": "Search customers by name, email, or phone",
};

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const title = useMemo(() => titles[location.pathname] ?? "Admin", [location.pathname]);
  const placeholder = useMemo(
    () => placeholders[location.pathname] ?? "Search this workspace",
    [location.pathname],
  );
  const search = searchParams.get("q") ?? "";

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
    <div className="min-h-screen md:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          title={title}
          placeholder={placeholder}
          searchValue={search}
          onSearchChange={handleSearchChange}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <Outlet context={{ search }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
