'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // ✅ Use useEffect instead of useState for auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    age: '',
    barangays: [] as string[],
    spots: [] as string[],
    companions: [''],
    date: '',
    agree: false,
  });

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleCompanionChange = (index: number, value: string) => {
    const updated = [...form.companions];
    updated[index] = value;
    setForm({ ...form, companions: updated });
  };

  const addCompanion = () => setForm({ ...form, companions: [...form.companions, ''] });
  const removeCompanion = (index: number) =>
    setForm({ ...form, companions: form.companions.filter((_, i) => i !== index) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'visits'), {
        userId: user.uid,
        fullName: form.fullName,
        email: form.email,
        age: form.age,
        barangays: form.barangays,
        spots: form.spots,
        companions: form.companions.filter((c) => c.trim() !== ''),
        date: form.date,
        agree: form.agree,
        status: 'pending', // ✅ added for admin approval
        createdAt: serverTimestamp(), // ✅ more accurate than Timestamp.now()
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/dashboard/my-travels');
      }, 2000);
    } catch (error) {
      console.error('Error saving visit:', error);
      alert('Failed to save visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableSpots = form.barangays.flatMap((b) => spotsByBarangay[b] || []);

  return (
    <>
      <motion.div
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Schedule Your Visit</h1>
        <p className="text-gray-500 mb-8">
          Plan your trip to Kapangan, Benguet — choose your destinations, companions, and travel date.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <section>
            <h2 className="text-xl font-semibold text-green-700 mb-4 border-l-4 border-green-400 pl-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  className="border border-gray-300 rounded-md w-full p-2.5 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  className="border border-gray-300 rounded-md w-full p-2.5 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Age</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.age}
                  className="border border-gray-300 rounded-md w-full p-2.5 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Companions */}
          <section>
            <h2 className="text-xl font-semibold text-green-700 mb-4 border-l-4 border-green-400 pl-2">
              Companions
            </h2>
            <div className="space-y-2">
              {form.companions.map((companion, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Companion ${index + 1}`}
                    className="border border-gray-300 rounded-md w-full p-2.5 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    value={companion}
                    onChange={(e) => handleCompanionChange(index, e.target.value)}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeCompanion(index)}
                      className="text-red-500 hover:text-red-700 text-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCompanion}
              className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium"
            >
              + Add another companion
            </button>
          </section>

          {/* Destination Selection */}
          <section>
            <h2 className="text-xl font-semibold text-green-700 mb-4 border-l-4 border-green-400 pl-2">
              Destination Selection
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {Object.keys(spotsByBarangay).map((b) => (
                <label
                  key={b}
                  className="flex items-center gap-2 bg-gray-50 border rounded-md p-2 hover:bg-green-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={form.barangays.includes(b)}
                    onChange={() => handleBarangayChange(b)}
                  />
                  <span className="capitalize text-gray-700">{b.replace('-', ' ')}</span>
                </label>
              ))}
            </div>

            {availableSpots.length > 0 && (
              <div>
                <p className="text-gray-600 mb-2 font-medium">Available Tourist Spots</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableSpots.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 bg-gray-50 border rounded-md p-2 hover:bg-green-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={form.spots.includes(s)}
                        onChange={() => handleSpotChange(s)}
                      />
                      <span className="text-gray-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Visit Details */}
          <section>
            <h2 className="text-xl font-semibold text-green-700 mb-4 border-l-4 border-green-400 pl-2">
              Visit Details
            </h2>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-green-500" />
              <div className="flex-1">
                <label className="block text-gray-600 mb-1 font-medium">Select Visit Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  className="border border-gray-300 rounded-md w-full p-2.5 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-gray-700 text-sm">
              <input
                type="checkbox"
                required
                checked={form.agree}
                onChange={(e) => setForm({ ...form, agree: e.target.checked })}
              />
              <span>
                I declare that all information provided is true and that I will comply with local tourism
                guidelines during my visit.
              </span>
            </label>
          </section>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-green-700 transition font-medium disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit Schedule'}
          </motion.button>
        </form>
      </motion.div>

      {/* ✅ Success Popup Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 shadow-xl text-center w-[90%] max-w-md"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle className="text-green-600 w-16 h-16 mx-auto mb-3" />
              <h2 className="text-2xl font-semibold text-gray-800">Visit Scheduled!</h2>
              <p className="text-gray-600 mt-2">
                Your trip has been successfully scheduled. Redirecting to your travels...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
