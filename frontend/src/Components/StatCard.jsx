export default function StatCard({ title, value, color }) {
  return (
    <div className={`p-6 rounded-xl shadow-card bg-${color}-50 border border-${color}-200`}>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-4xl font-bold mt-2 text-${color}-700">{value}</p>
    </div>
  );
}
