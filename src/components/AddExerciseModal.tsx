'use client';

import { useState } from 'react';
import { MUSCLE_GROUPS, PROGRAM } from '../lib/program';
import type { Exercise } from '../lib/types';
import { Icon } from './shared/Icon';

interface AddExerciseModalProps {
  initialDay: number;
  onClose: () => void;
  onAdd: (dayIndex: number, exercise: Exercise) => void;
}

export function AddExerciseModal({ initialDay, onClose, onAdd }: AddExerciseModalProps) {
  const [day, setDay] = useState(initialDay);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<string>('Chest');
  const [equipment, setEquipment] = useState('Dumbbell');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8–12');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(day, {
      name: name.trim(),
      muscle,
      equipment,
      sets: Math.max(1, Math.min(20, sets)),
      reps: reps.trim() || '8–12',
    });
    onClose();
  }

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Add exercise">
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eyebrow">CUSTOM EXERCISE</div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', padding: '4px' }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <h2>Add exercise to split</h2>

        <form className="form" onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div className="field">
            <label htmlFor="target-day">Workout day</label>
            <select
              id="target-day"
              value={day}
              onChange={e => setDay(Number(e.target.value))}
            >
              {PROGRAM.map((p, idx) => (
                <option value={idx} key={p.dow}>
                  {p.long} ({p.type})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="exercise-name">Exercise name</label>
            <input
              id="exercise-name"
              autoFocus
              type="text"
              required
              placeholder="e.g. Romanian Deadlift, Lateral Raise"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="field">
              <label htmlFor="muscle-group">Target muscle</label>
              <select
                id="muscle-group"
                value={muscle}
                onChange={e => setMuscle(e.target.value)}
              >
                {MUSCLE_GROUPS.map(m => (
                  <option value={m} key={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="equipment-type">Equipment</label>
              <select
                id="equipment-type"
                value={equipment}
                onChange={e => setEquipment(e.target.value)}
              >
                <option value="Dumbbell">Dumbbell</option>
                <option value="Barbell">Barbell</option>
                <option value="Cable">Cable</option>
                <option value="Machine">Machine</option>
                <option value="Bodyweight">Bodyweight</option>
                <option value="Treadmill">Treadmill</option>
                <option value="Kettlebell">Kettlebell</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="field">
              <label htmlFor="target-sets">Target sets</label>
              <input
                id="target-sets"
                type="number"
                min="1"
                max="20"
                value={sets}
                onChange={e => setSets(Number(e.target.value))}
              />
            </div>

            <div className="field">
              <label htmlFor="target-reps">Target reps</label>
              <input
                id="target-reps"
                type="text"
                placeholder="e.g. 8–12, 10-15"
                value={reps}
                onChange={e => setReps(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" className="button" style={{ flex: 1 }}>
              Add to session
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
