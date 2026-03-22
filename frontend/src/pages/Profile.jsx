import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OrdersIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-[#d9d9d9]" fill="none" stroke="currentColor" strokeWidth="2.7">
      <path d="M20 14H36L46 24V50H20V14Z" strokeLinejoin="round" />
      <path d="M36 14V24H46" strokeLinejoin="round" />
      <path d="M26 31H40" strokeLinecap="round" />
      <path d="M26 38H40" strokeLinecap="round" />
      <path d="M26 45H35" strokeLinecap="round" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-[#d9d9d9]" fill="none" stroke="currentColor" strokeWidth="2.7">
      <path d="M32 53C32 53 18 40.6 18 29C18 20.2 24.3 14 32 14C39.7 14 46 20.2 46 29C46 40.6 32 53 32 53Z" />
      <circle cx="32" cy="29" r="5.6" />
      <path d="M22 52C24.8 49.5 28.2 48.2 32 48.2C35.8 48.2 39.2 49.5 42 52" strokeLinecap="round" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-[#d9d9d9]" fill="none" stroke="currentColor" strokeWidth="2.7">
      <circle cx="32" cy="23" r="10" />
      <path d="M15 51C18.7 43.9 24.5 40.5 32 40.5C39.5 40.5 45.3 43.9 49 51" strokeLinecap="round" />
      <circle cx="32" cy="32" r="21" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-[#d9d9d9]" fill="none" stroke="currentColor" strokeWidth="2.7">
      <path d="M28 18H16V46H28" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 32H49" strokeLinecap="round" />
      <path d="M41 24L49 32L41 40" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OverviewCard({ as: Component = Link, to, onClick, icon, title, description }) {
  const sharedClassName =
    "flex min-h-[210px] flex-col items-center justify-center rounded-[18px] border border-[#dddddd] bg-white px-6 py-8 text-center transition hover:border-[#cfc7be] hover:shadow-[0_16px_40px_rgba(25,18,14,0.08)]";

  if (Component === "button") {
    return (
      <button type="button" onClick={onClick} className={sharedClassName}>
        <span className="mb-6 inline-flex">{icon}</span>
        <h2 className="text-[1.06rem] font-semibold uppercase tracking-[0.01em] text-brand-dark">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-[220px] text-sm leading-6 text-brand-dark/55">{description}</p>
        ) : null}
      </button>
    );
  }

  return (
    <Component
      to={to}
      onClick={onClick}
      className={sharedClassName}
    >
      <span className="mb-6 inline-flex">{icon}</span>
      <h2 className="text-[1.06rem] font-semibold uppercase tracking-[0.01em] text-brand-dark">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-[220px] text-sm leading-6 text-brand-dark/55">{description}</p>
      ) : null}
    </Component>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <section className="container-shell py-12 sm:py-14">
      <div className="space-y-5">
        <h1 className="text-[3.1rem] font-semibold tracking-[-0.04em] text-brand-dark">
          MY ACCOUNT
        </h1>
        <p className="max-w-6xl text-base leading-8 text-brand-dark/62">
          Welcome back{user?.name ? `, ${user.name}` : ""}. Manage your orders, saved delivery details, and account information from one clear overview.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          to="/orders"
          icon={<OrdersIcon />}
          title="Orders"
          description="View your past purchases and current order status."
        />
        <OverviewCard
          to="/profile/details#addresses"
          icon={<AddressIcon />}
          title="Addresses"
          description="Update delivery addresses and saved location details."
        />
        <OverviewCard
          to="/profile/details"
          icon={<AccountIcon />}
          title="Account Details"
          description="Edit your profile, contact information, and preferences."
        />
        <OverviewCard
          as="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          icon={<LogoutIcon />}
          title="Logout"
          description="Sign out of your CandleOra account securely."
        />
      </div>
    </section>
  );
}

export default Profile;
