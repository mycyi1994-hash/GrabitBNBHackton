/**
 * The verification ladder, in the two expressions the handoff specifies.
 *
 * `LadderBar` (study 1a) is the card-scale reading — six segments split by the
 * callable-verified stroke. `LadderRows` (study 1b) is the detail-scale one,
 * where every rung is named and the stop is stated outright.
 *
 * Both take the same state, so an agent can never be drawn at one rung here and
 * another rung there.
 */
import { LADDER, type LadderState } from '@/lib/verification-ladder';

function observedLabel(observedAt: string, short: boolean) {
  const iso = observedAt.slice(0, 10);
  return short ? iso.slice(5) : `observed ${iso}`;
}

/** Study 1a. `scale="card"` is the 300px card; `scale="detail"` the wide one. */
export function LadderBar({
  state,
  observedAt,
  scale = 'card',
}: {
  state: LadderState;
  observedAt: string;
  scale?: 'card' | 'detail';
}) {
  const rung = state.rung;
  // The ladder must not render without the time it was observed at.
  if (!rung) return null;

  return (
    <div className={`ladder-bar is-${scale}`}>
      <div className="ladder-bar-track" role="img" aria-label={`${state.reached} of 6 — ${rung.level}`}>
        {LADDER.map((entry, index) => (
          <span key={entry.level}>
            {index === 3 ? <i className="ladder-bar-line" aria-hidden="true" /> : null}
            <i
              className={`ladder-seg${index < state.reached ? ' is-filled' : ''}${
                state.callableVerified ? ' is-proven' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        ))}
      </div>
      <p className="ladder-bar-read">
        <b>
          {state.reached}/6 {rung.level}
        </b>
        <span>{observedLabel(observedAt, scale === 'card')}</span>
      </p>
      {scale === 'detail' ? (
        <p className="ladder-bar-note">
          {rung.shown} Nothing beyond that has been shown.
        </p>
      ) : null}
    </div>
  );
}

/** Study 1b. Every rung named, the verified line drawn as a real rule. */
export function LadderRows({
  state,
  observedAt,
  lastAttempt,
}: {
  state: LadderState;
  observedAt: string;
  lastAttempt?: string;
}) {
  // A level without an observation time is a claim, not evidence, so it does
  // not render at all.
  if (!observedAt) return null;

  return (
    <div className="ladder-rows">
      <ol>
        {LADDER.map((entry) => {
          const reached = entry.step <= state.reached;
          return (
            <li
              key={entry.level}
              className={`${reached ? 'is-reached' : ''}${entry.step === 4 ? ' is-verified-line' : ''}`}
            >
              <i aria-hidden="true" />
              <b>
                {entry.step}/6 {entry.level}
              </b>
              <p>{entry.shown}</p>
            </li>
          );
        })}
      </ol>

      {state.stoppedAt ? (
        <div className="ladder-stop">
          <span>STOPPED AT RUNG {state.stoppedAt.step}</span>
          <p>
            {state.stoppedAt.step === 4
              ? 'No completed task in its own category has been recorded under test.'
              : `${state.stoppedAt.shown.replace(/\.$/, '')} — not yet shown.`}
            {lastAttempt ? ` Last attempt ${lastAttempt}.` : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
