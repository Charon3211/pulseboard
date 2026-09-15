export function ProgressRing({ value, label }: { value: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return <div className="progress-ring-wrap"><svg className="progress-ring" viewBox="0 0 100 100" aria-label={`${value}% ${label}`}><circle className="ring-track" cx="50" cy="50" r={radius} /><circle className="ring-value" cx="50" cy="50" r={radius} style={{ strokeDasharray: circumference, strokeDashoffset: circumference - (circumference * value) / 100 }} /></svg><div className="ring-copy"><strong>{value}%</strong><span>{label}</span></div></div>;
}
