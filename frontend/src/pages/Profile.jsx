import ordersIcon from "../assets/profile-orders.svg";
import addressesIcon from "../assets/profile-addresses.svg";
import accountIcon from "../assets/profile-account.svg";
import logoutIcon from "../assets/profile-logout.svg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProfileIcon({ src, alt }) {
  return (
    <img src={src} alt={alt} className="h-full w-full object-contain opacity-20" />
  );
}

function OverviewCard({ as: Component = Link, to, onClick, icon, title }) {
  const sharedClassName =
    "flex min-h-[146px] flex-col items-center justify-center rounded-[14px] border border-black/10 bg-white px-6 py-7 text-center transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]";

  if (Component === "button") {
    return (
      <button type="button" onClick={onClick} className={sharedClassName}>
        <span className="mb-4 inline-flex h-[60px] w-[60px] items-center justify-center">{icon}</span>
        <h2 className="text-[18px] font-semibold uppercase tracking-[0.01em] text-black">
          {title}
        </h2>
      </button>
    );
  }

  return (
    <Component to={to} onClick={onClick} className={sharedClassName}>
      <span className="mb-4 inline-flex h-[60px] w-[60px] items-center justify-center">{icon}</span>
      <h2 className="text-[18px] font-semibold uppercase tracking-[0.01em] text-black">
        {title}
      </h2>
    </Component>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <section className="container-shell py-16 sm:py-20">
      <div className="space-y-4">
        <h1 className="text-heading-lg font-semibold uppercase tracking-[-0.02em] text-black">My Account</h1>
        <p className="max-w-[980px] text-body leading-8 text-black/62">
          Welcome back{user?.name ? `, ${user.name}!` : "!"} Manage your orders, saved delivery details, and account information from one clear overview.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
