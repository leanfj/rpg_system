import DiceRoller from './DiceRoller'

function DiceRollerPanel() {
  return (
    <article className="dashboard-card dice">
      <header>
        <h3>Rolador de dados</h3>
      </header>
      <DiceRoller />
    </article>
  )
}

export default DiceRollerPanel
