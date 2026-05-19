import React from "react";

export default function Sidebar({ stats, notificationTime, onChangeNotification }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>MedFlow</h1>
        <p>Controle diário do medicamento</p>
      </div>

      <section className="panel">
        <h2>Notificações</h2>
        <label htmlFor="notification-time">Horário diário</label>
        <input
          id="notification-time"
          type="time"
          value={notificationTime}
          onChange={(e) => onChangeNotification(e.target.value)}
        />
      </section>

      <section className="panel">
        <h2>Resumo</h2>
        <p><strong>Aderência:</strong> {stats.aderencia_percentual}%</p>
        <p><strong>Dias tomados:</strong> {stats.tomados}</p>
        <p><strong>Dias não tomados:</strong> {stats.nao_tomados}</p>
        <p><strong>Streak atual:</strong> {stats.streak_atual} dias</p>
        <p><strong>Melhor streak:</strong> {stats.melhor_streak} dias</p>
      </section>

      <section className="legend">
        <h2>Status</h2>
        <div><span className="dot dot-taken" /> Tomado</div>
        <div><span className="dot dot-missed" /> Não tomado</div>
        <div><span className="dot dot-neutral" /> Neutro</div>
      </section>
    </aside>
  );
}

