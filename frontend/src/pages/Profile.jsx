import ordersIcon from "../assets/profile-orders.svg";
import addressesIcon from "../assets/profile-addresses.svg";
import accountIcon from "../assets/profile-account.svg";
import logoutIcon from "../assets/profile-logout.svg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProfileIcon({ src, alt }) {
  return (
    <img src={src} alt={alt} className="h-full w-full object-contain opacity-90" />
  );
}

function AdminPanelIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full text-black/85" fill="none" aria-hidden="true">
      <rect x="8" y="10" width="32" height="28" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 19H32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 27H23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 26L31 29L36 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OverviewCard({ as: Component = Link, to, onClick, icon, title }) {
  const sharedClassName =
    "flex min-h-[146px] flex-col items-center justify-center rounded-[14px] border border-black/10 bg-white px-5 py-7 text-center transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]";

  const content = (
    <>
      <span className="mb-4 inline-flex h-[60px] w-[60px] items-center justify-center">{icon}</span>
      <h2 className="whitespace-nowrap text-[17px] font-semibold uppercase tracking-[0.01em] text-black xl:text-[18px]">
        {title}
      </h2>
    </>
  );

  if (Component === "button") {
    return (
      <button type="button" onClick={onClick} className={sharedClassName}>
        {content}
      </button>
    );
  }

  return (
    <Component to={to} onClick={onClick} className={sharedClassName}>
      {content}
    </Component>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const introCopy = isAdmin
    ? "Welcome back, CandleOra Admin! Review orders, manage account settings, and jump into the admin panel from one clear overview."
    : `Welcome back${user?.name ? `, ${user.name}!` : "!"} Manage your orders, saved addresses, and account details from one clear overview.`;

  return (
    <section className="container-shell py-16 sm:py-20">
      <div className="space-y-4">
        <h1 className="text-heading-lg font-semibold uppercase tracking-[-0.02em] text-black">My Account</h1>
        <p className="max-w-[980px] text-body leading-8 text-black/62">{introCopy}</p>
      </div>

      <div
        data-testid="profile-overview-grid"
        className={`mt-12 grid gap-4 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
      >
        <OverviewCard
          to="/orders"
          icon={<ProfileIcon src={ordersIcon} alt="" />}
          title="Orders"
        />
        <OverviewCard
          to="/profile/details#addresses"
          icon={<ProfileIcon src={addressesIcon} alt="" />}
          title="Addresses"
        />
        <OverviewCard
          to="/profile/details"
          icon={<ProfileIcon src={accountIcon} alt="" />}
          title="Account Details"
        />
        {isAdmin ? (
          <OverviewCard
            to="/admin"
            icon={<AdminPanelIcon />}
            title="Admin Panel"
          />
        ) : null}
        <OverviewCard
          as="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          icon={<ProfileIcon src={logoutIcon} alt="" />}
          title="Logout"
        />
      </div>
    </section>
  );
}

export default Profile;
