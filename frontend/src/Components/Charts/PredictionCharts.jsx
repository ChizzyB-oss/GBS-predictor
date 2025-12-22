import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const data = [
  { day: "Mon", predictions: 8 },
  { day: "Tue", predictions: 11 },
  { day: "Wed", predictions: 5 },
  { day: "Thu", predictions: 10 },
  { day: "Fri", predictions: 14 },
];

export default function PredictionsChart() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">
        Predictions Per Day
      </h3>
      <BarChart width={430} height={220} data={data}>
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
        <XAxis dataKey="day" stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip />
        <Bar dataKey="predictions" fill="#38bdf8" radius={[6, 6, 0, 0]} />
      </BarChart>
    </div>
  );
}
