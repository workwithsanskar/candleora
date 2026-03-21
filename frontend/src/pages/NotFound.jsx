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
            className="mt-6 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
          >
            Back to home
          </Link>
        }
      />
    </section>
  );
}

export default NotFound;
