'use client';
import { useState } from 'react';

const spotsByBarangay: Record<string, string[]> = {
  balakbak: ['Mt. Kalukasog', 'Pey-og Falls', 'Manahongkong Falls'],
  cuba: ['Longog Cave', 'Mt. Dakiwagan'],
  'beleng-belis': ['Badi Falls'],
  'taba-ao': ['Dumanay Cave', 'Mt. Dakiwagan'],
  toplac: ['Toplac Rice Terraces'],
  labueg: ['Puga Coffin Cave'],
  payapay: ['Dangwa Cave'],
  pudtong: ['Amburayan River'],
};

export default function ScheduleVisitPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    age: '',
    barangays: [] as string[],
    spots: [] as string[],
    date: '',
    agree: false,
  });

  const handleBarangayChange = (barangay: string) => {
    const newBarangays = form.barangays.includes(barangay)
      ? form.barangays.filter((b) => b !== barangay)
      : [...form.barangays, barangay];

    setForm({ ...form, barangays: newBarangays, spots: [] });
  };

  const handleSpotChange = (spot: string) => {
    const newSpots = form.spots.includes(spot)
      ? form.spots.filter((s) => s !== spot)
      : [...form.spots, spot];
    setForm({ ...form, spots: newSpots });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Visit scheduled successfully!');
  };

  const availableSpots = form.barangays.flatMap((b) => spotsByBarangay[b] || []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Schedule a Visit</h1>

      {/* Personal Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-600 mb-1">Full Name</label>
          <input type="text" required className="border rounded-md w-full p-2"
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Email</label>
          <input type="email" required className="border rounded-md w-full p-2"
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Age</label>
          <input type="number" min="1" required className="border rounded-md w-full p-2"
            onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </div>
      </div>

      {/* Destination Selection */}
      <div>
        <label className="block text-gray-600 mb-2 font-semibold">Select Barangay(s)</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.keys(spotsByBarangay).map((b) => (
            <label key={b} className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={form.barangays.includes(b)}
                onChange={() => handleBarangayChange(b)}
              />
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {availableSpots.length > 0 && (
        <div>
          <label className="block text-gray-600 mb-2 font-semibold">Select Tourist Spots</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableSpots.map((s) => (
              <label key={s} className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={form.spots.includes(s)}
                  onChange={() => handleSpotChange(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Date & Declaration */}
      <div>
        <label className="block text-gray-600 mb-1 font-semibold">Select Date</label>
        <input
          type="date"
          required
          className="border rounded-md w-full p-2"
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          required
          checked={form.agree}
          onChange={(e) => setForm({ ...form, agree: e.target.checked })}
        />
        <p className="text-gray-700 text-sm">
          I declare that the information provided is true and accurate.
        </p>
      </div>

      <button
        type="submit"
        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
      >
        Submit
      </button>
    </form>
  );
}
