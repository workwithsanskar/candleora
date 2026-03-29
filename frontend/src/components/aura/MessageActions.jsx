import PropTypes from "prop-types";

function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href ?? ""));
}

function MessageActions({ actions }) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2.5">
      {actions.map((action) => (
        <a
          key={`${action.label}-${action.href}`}
          href={action.href}
          target={isExternalHref(action.href) ? "_blank" : undefined}
          rel={isExternalHref(action.href) ? "noreferrer" : undefined}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/14 bg-white/8 px-3.5 py-2 text-xs font-semibold text-white/86 transition hover:bg-white/14"
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}

MessageActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      href: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
};

export default MessageActions;
