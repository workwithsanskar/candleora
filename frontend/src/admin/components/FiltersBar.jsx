import PropTypes from "prop-types";

function FiltersBar({ title, description, actions, children }) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-brand-dark">{title}</h3>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>

      {children ? <div className="mt-5 flex flex-wrap items-end gap-3">{children}</div> : null}
    </section>
  );
}

FiltersBar.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node,
};

FiltersBar.defaultProps = {
  description: "",
  actions: null,
  children: null,
};

export default FiltersBar;
