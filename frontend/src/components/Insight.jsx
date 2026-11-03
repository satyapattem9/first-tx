// "What just happened" card shown after each verified step.
export default function Insight({ title, why, words = [], warn = false, children }) {
  return (
    <div className={warn ? 'insight warn' : 'insight'}>
      <div className="insight-icon" aria-hidden="true">{warn ? '!' : 'i'}</div>
      <div>
        <div className="insight-kicker">WHAT JUST HAPPENED</div>
        <h3>{title}</h3>
        {children}
        <p className="insight-why">Why it matters: {why}</p>
        {words.length > 0 && (
          <span className="insight-term">
            New word{words.length > 1 ? 's' : ''}: {words.join(' · ')}
          </span>
        )}
      </div>
    </div>
  );
}