'use client';

import { useState } from 'react';
import type { Exercise, PersonalRecord, SetLog, WeightUnit } from '../lib/types';
import { Icon } from './shared/Icon';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseIndex: number;
  setLogs: SetLog[];
  weightUnit: WeightUnit;
  previousPerformance: { bestWeight: number; bestReps: number; lastLog: string } | null;
  personalRecord: PersonalRecord | null;
  savedNote?: string;
  onUpdateSet: (setIndex: number, patch: Partial<SetLog>) => void;
  onToggleSet: (setIndex: number) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onSaveNote: (note: string) => void;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  setLogs,
  weightUnit,
  previousPerformance,
  personalRecord,
  savedNote = '',
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onRemoveSet,
  onSaveNote,
}: ExerciseCardProps) {
  const [showNotes, setShowNotes] = useState(Boolean(savedNote));
  const [noteText, setNoteText] = useState(savedNote);

  const completedCount = setLogs.filter(s => s.completed).length;
  const allDone = completedCount >= exercise.sets && setLogs.length > 0;

  function adjustWeight(setIdx: number, delta: number) {
    const current = setLogs[setIdx]?.weight || 0;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    onUpdateSet(setIdx, { weight: next });
  }

  function adjustReps(setIdx: number, delta: number) {
    const current = setLogs[setIdx]?.reps || 0;
    const next = Math.max(0, current + delta);
    onUpdateSet(setIdx, { reps: next });
  }

  return (
    <article className={`exercise-card ${allDone ? 'all-done' : ''}`} aria-label={exercise.name}>
      <div className="exercise-top">
        <div>
          <div className="exercise-info">
            <span className="exercise-number">{String(exerciseIndex + 1).padStart(2, '0')}</span>
            <span className="exercise-name">{exercise.name}</span>
          </div>
          <div className="exercise-submeta">
            <span className="badge muscle">{exercise.muscle}</span>
            {' · '}
            <span>{exercise.equipment}</span>
            {' · '}
            <span>
              Target: {exercise.sets} × {exercise.reps}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          {personalRecord && (
            <span className="badge pr" title={`PR: ${personalRecord.maxWeight} ${weightUnit} × ${personalRecord.repsAtMax} reps`}>
              PR: {personalRecord.maxWeight} {weightUnit}
            </span>
          )}
          {previousPerformance && (
            <span className="exercise-prev" title="Previous session's best set">
              Prev: {previousPerformance.lastLog}
            </span>
          )}
        </div>
      </div>

      <div className="set-table">
        <div className="set-table-head">
          <span style={{ textAlign: 'center' }}>Set</span>
          <span style={{ textAlign: 'center' }}>Weight ({weightUnit})</span>
          <span style={{ textAlign: 'center' }}>Reps</span>
          <span style={{ textAlign: 'center' }}>Done</span>
        </div>

        {setLogs.map((set, sIdx) => (
          <div className={`set-row ${set.completed ? 'completed' : ''}`} key={sIdx}>
            <span className="set-idx">{sIdx + 1}</span>

            {/* Weight Stepper */}
            <div className="stepper-input">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => adjustWeight(sIdx, -2.5)}
                aria-label="Decrease weight"
              >
                −
              </button>
              <input
                type="number"
                step="0.5"
                min="0"
                className="stepper-val"
                value={set.weight === 0 ? '' : set.weight}
                placeholder={previousPerformance ? String(previousPerformance.bestWeight) : '0'}
                onChange={e => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  if (Number.isFinite(val) && val >= 0) {
                    onUpdateSet(sIdx, { weight: val });
                  }
                }}
              />
              <button
                type="button"
                className="stepper-btn"
                onClick={() => adjustWeight(sIdx, 2.5)}
                aria-label="Increase weight"
              >
                +
              </button>
            </div>

            {/* Reps Stepper */}
            <div className="stepper-input">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => adjustReps(sIdx, -1)}
                aria-label="Decrease reps"
              >
                −
              </button>
              <input
                type="number"
                step="1"
                min="0"
                className="stepper-val"
                value={set.reps === 0 ? '' : set.reps}
                placeholder={previousPerformance ? String(previousPerformance.bestReps) : '10'}
                onChange={e => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  if (Number.isFinite(val) && val >= 0) {
                    onUpdateSet(sIdx, { reps: Math.round(val) });
                  }
                }}
              />
              <button
                type="button"
                className="stepper-btn"
                onClick={() => adjustReps(sIdx, 1)}
                aria-label="Increase reps"
              >
                +
              </button>
            </div>

            {/* Checkmark Completion Button */}
            <button
              type="button"
              className={`set-check-btn ${set.completed ? 'checked' : ''}`}
              onClick={() => onToggleSet(sIdx)}
              aria-label={`Mark set ${sIdx + 1} as ${set.completed ? 'incomplete' : 'complete'}`}
              aria-pressed={set.completed}
            >
              <Icon name="check" size={17} />
            </button>
          </div>
        ))}
      </div>

      <div className="exercise-footer">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="text-button" onClick={onAddSet}>
            <Icon name="plus" size={13} /> Add Set
          </button>
          {setLogs.length > 1 && (
            <button
              type="button"
              className="text-button"
              style={{ color: 'var(--muted)' }}
              onClick={onRemoveSet}
            >
              Remove Set
            </button>
          )}
        </div>

        <button
          type="button"
          className="text-button"
          onClick={() => setShowNotes(!showNotes)}
        >
          {showNotes ? 'Hide notes' : savedNote ? 'View note' : '+ Add note'}
        </button>
      </div>

      {showNotes && (
        <input
          type="text"
          className="notes-input"
          placeholder="Form cue, seat height, machine pin number…"
          value={noteText}
          onChange={e => {
            setNoteText(e.target.value);
            onSaveNote(e.target.value);
          }}
        />
      )}
    </article>
  );
}
