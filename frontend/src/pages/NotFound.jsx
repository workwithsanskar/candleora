import { Link } from "react-router-dom";
import StatusView from "../components/StatusView";

function NotFound() {
  return (
    <section className="container-shell py-16">
      <StatusView
        title="This page does not exist"
        message="The route you requested is not part of the CandleOra storefront."
        action={
          <Link
            to="/"
            className="btn btn-primary mt-6"
          >
            Back to home
          </Link>
        }
      />
    </section>
  );
}

export default NotFound;
