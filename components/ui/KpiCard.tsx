interface Props {
  label: string;
  value: string | number;
  color?: string;
}

export default function KpiCard({ label, value, color = "text-red-500" }: Props) {
  return (
    <div className="glass-panel border-white/10 rounded-3xl p-6">
      <p className="text-gray-400 mb-2">{label}</p>
      <h2 className={`text-4xl font-black ${color}`}>{value}</h2>
    </div>
  );
}
