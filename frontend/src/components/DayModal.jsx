import React from "react";

const LABEL_BY_STATUS = {
  taken: "Tomei o remédio",
  missed: "Não tomei",
  neutral: "Limpar registro"
};

export default function DayModal({ open, date, currentStatus, onClose, onSelect }) {
  if (!open || !date) return null;
  const dayLabel = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card" onClick={(evt) => evt.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{dayLabel}</h3>
        <p>Status atual: <strong>{LABEL_BY_STATUS[currentStatus || "neutral"]}</strong></p>
        <div className="modal-actions">
          <button className="btn btn-taken" onClick={() => onSelect("taken")}>
            Tomei o remédio
          </button>
          <button className="btn btn-missed" onClick={() => onSelect("missed")}>
            Não tomei
          </button>
          <button className="btn btn-neutral" onClick={() => onSelect("neutral")}>
            Limpar registro
          </button>
        </div>
      </div>
    </div>
  );
}

