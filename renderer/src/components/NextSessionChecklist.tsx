function NextSessionChecklist() {
  return (
    <article className="dashboard-card next">
      <header>
        <h3>Próxima sessão</h3>
      </header>
      <div className="checklist">
        <label>
          <input type="checkbox" /> Revisar encontros
        </label>
        <label>
          <input type="checkbox" /> Preparar mapa
        </label>
        <label>
          <input type="checkbox" /> Atualizar NPCs
        </label>
        <label>
          <input type="checkbox" /> Separar trilha sonora
        </label>
      </div>
    </article>
  )
}

export default NextSessionChecklist
