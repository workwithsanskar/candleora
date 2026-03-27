import PropTypes from "prop-types";

function Modal({ open, onClose, title, children, footer, size }) {
  if (!open) {
    return null;
  }

  const sizeClassName = size === "lg" ? "max-w-4xl" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className={`w-full ${sizeClassName} overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.2)]`}>
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-5">
          <h3 className="font-display text-2xl font-semibold text-brand-dark">{title}</h3>
          <button
            type="button"
            className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-muted transition hover:border-black/20 hover:text-brand-dark"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-black/8 px-6 py-5">{footer}</div> : null}
      </div>
    </div>
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["md", "lg"]),
};

Modal.defaultProps = {
  footer: null,
  size: "md",
};

export default Modal;
