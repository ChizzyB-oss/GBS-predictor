import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const data = [
  { day: "Mon", patients: 4 },
  { day: "Tue", patients: 7 },
  { day: "Wed", patients: 3 },
  { day: "Thu", patients: 6 },
  { day: "Fri", patients: 9 },
];

export default function PatientsChart() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">
        Patients Seen Per Day
      </h3>
      <LineChart width={430} height={220} data={data}>
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
        <XAxis dataKey="day" stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip />
        <Line type="monotone" dataKey="patients" stroke="#2563eb" strokeWidth={3} />
      </LineChart>
    </div>
  );
}
