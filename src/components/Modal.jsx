export default function Modal({ open, title, children, onClose, actionLabel }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2>{title}</h2>}
        <div className="modal-body">{children}</div>
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {actionLabel || "OK"}
        </button>
      </div>
    </div>
  );
}
