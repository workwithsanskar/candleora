import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Dashboard", to: "/admin" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Products", to: "/admin/products" },
  { label: "Coupons", to: "/admin/coupons" },
  { label: "Customers", to: "/admin/customers" },
  { label: "Analytics", to: "/admin/analytics" },
  { label: "Settings", to: "/admin/settings" },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/35 transition md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-black/10 bg-[#17120f] px-5 py-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#c8a96f]">CandleOra</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-white">Admin</h1>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/70 md:hidden"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#f3b33d] text-[#17120f]"
                    : "text-white/72 hover:bg-white/8 hover:text-white"
                }`
              }
            >
              <span>{item.label}</span>
              <span className="text-[10px] uppercase tracking-[0.22em]">Open</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Access</p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            This dashboard is only exposed to authenticated admin accounts. Direct URL access still requires a valid admin role.
          </p>
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;
