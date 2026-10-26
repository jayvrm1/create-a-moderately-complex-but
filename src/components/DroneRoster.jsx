import { DRONE_STATUS_LABEL } from '../lib/simulation.js';

export default function DroneRoster({ drones, onSelectDrone, selectedDroneId, compact = false }) {
  return (
    <div className={`roster${compact ? ' roster--compact' : ''}`}>
      <div className="roster-head" aria-hidden="true">
        <span>CALL SIGN</span>
        <span>TASK</span>
        <span>LINK</span>
        <span>BAT</span>
      </div>
      <ul>
        {drones.map((drone) => {
          const active = drone.status === 'active';
          const batteryTone = drone.battery > 45 ? 'ok' : drone.battery > 20 ? 'warn' : 'critical';
          return (
            <li key={drone.id}>
              <button
                type="button"
                className={`roster-row st-${drone.status}${selectedDroneId === drone.id ? ' is-selected' : ''}`}
                onClick={() => onSelectDrone?.(drone.id)}
                aria-label={`${drone.callsign}: ${DRONE_STATUS_LABEL[drone.status]}, task ${drone.task}, ${
                  active ? (drone.connected ? 'linked to gateway' : 'no gateway path') : 'not relaying'
                }, battery ${Math.round(drone.battery)} percent${drone.charging ? ', recovering at staging' : ''}.`}
              >
                <span className="roster-id">
                  <span className={`roster-dot st-${drone.status}`} aria-hidden="true" />
                  {drone.callsign}
                </span>
                <span className="roster-task">{active ? drone.task : DRONE_STATUS_LABEL[drone.status]}</span>
                <span className={`roster-link ${active ? (drone.connected ? 'is-ok' : 'is-none') : 'is-idle'}`}>
                  {active ? (drone.connected ? 'LINKED' : 'NO PATH') : '—'}
                </span>
                <span className="roster-bat">
                  <span className="bat-track" aria-hidden="true">
                    <span className={`bat-fill bat--${batteryTone}`} style={{ width: `${drone.battery}%` }} />
                  </span>
                  <span className="bat-value">{active ? `${Math.round(drone.battery)}%` : '—'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="roster-foot">
        Simulated positions on predefined routes. Battery drains while flying and recovers at the staging pad. Not real
        flight, radio, satellite or phone service.
      </p>
    </div>
  );
}
