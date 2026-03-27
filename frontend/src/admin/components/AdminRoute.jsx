import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import RouteLoader from "../../components/RouteLoader";
import { useAuth } from "../../context/AuthContext";

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (!user) {
    return <RouteLoader />;
  }

  if (String(user.role ?? "").toUpperCase() !== "ADMIN") {
    return <Navigate replace to="/" />;
  }

  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminRoute;
