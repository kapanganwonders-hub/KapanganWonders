'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, CheckCircle, Loader2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Custom styles for DatePicker
const customDatePickerStyles = {
  control: (provided: any) => ({
    ...provided,
    minHeight: '48px',
    fontSize: '1rem',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    borderColor: '#d1d5db',
    '&:hover': {
      borderColor: '#9ca3af'
    },
    '&:focus': {
      borderColor: '#4f46e5',
      boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
    }
  }),
  input: (provided: any) => ({
    ...provided,
    padding: '0.5rem',
    fontSize: '1rem',
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  }),
  day: (provided: any, state: any) => ({
    ...provided,
    width: '36px',
    height: '36px',
    margin: '0.2rem',
    borderRadius: '0.375rem',
    fontSize: '0.9rem',
    lineHeight: '36px',
    color: state.isToday ? '#ffffff' : state.isSelected ? '#ffffff' : '#1f2937',
    backgroundColor: state.isToday 
      ? '#4f46e5' 
      : state.isSelected 
        ? '#6366f1' 
        : 'transparent',
    '&:hover': {
      backgroundColor: state.isSelected ? '#4f46e5' : '#f3f4f6',
      color: state.isSelected ? '#ffffff' : '#1f2937'
    }
  }),
  monthContainer: (provided: any) => ({
    ...provided,
    padding: '1rem',
  }),
  header: (provided: any) => ({
    ...provided,
    padding: '0.5rem',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem',
    margin: '-1rem -1rem 0.5rem -1rem'
  }),
  weekDay: (provided: any) => ({
    ...provided,
    color: '#6b7280',
    fontWeight: '500',
    fontSize: '0.875rem',
    width: '36px',
    margin: '0.2rem',
    lineHeight: '36px'
  })
};

export default function ScheduleVisitPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    
    // Fetch tourist spots from Firestore
    const fetchSpots = async () => {
      try {
        setIsLoadingSpots(true);
        const spotsRef = collection(db, 'touristSpots');
        
        // First try with the indexed query
        try {
          const q = query(spotsRef, orderBy('barangay'), orderBy('name'));
          const querySnapshot = await getDocs(q);
          
          const spotsData: Record<string, Spot[]> = {};
          
          querySnapshot.forEach((doc) => {
            const spotData = doc.data();
            const barangay = spotData.barangay || 'Other';
            
            if (!spotsData[barangay]) {
              spotsData[barangay] = [];
            }
            
            spotsData[barangay].push({
              id: doc.id,
              name: spotData.name || 'Unnamed Spot',
              businessId: spotData.businessId || null
            });
          });
          
          // Sort spots by name within each barangay (as a fallback)
          Object.values(spotsData).forEach(spots => {
            spots.sort((a, b) => a.name.localeCompare(b.name));
          });
          
          setSpotsByBarangay(spotsData);
        } catch (indexError) {
          console.warn('Indexed query failed, falling back to client-side sorting:', indexError);
          
          // Fallback query without ordering (client-side sort)
          const querySnapshot = await getDocs(spotsRef);
          const spotsData: Record<string, Spot[]> = {};
          
          querySnapshot.forEach((doc) => {
            const spotData = doc.data();
            const barangay = spotData.barangay || 'Other';
            
            if (!spotsData[barangay]) {
              spotsData[barangay] = [];
            }
            
            spotsData[barangay].push({
              id: doc.id,
              name: spotData.name || 'Unnamed Spot',
              businessId: spotData.businessId || null
            });
          });
          
          // Sort barangays and spots by name
          const sortedData = Object.entries(spotsData)
            .sort(([a], [b]) => a.localeCompare(b))
            .reduce((acc, [barangay, spots]) => {
              acc[barangay] = [...spots].sort((a, b) => a.name.localeCompare(b.name));
              return acc;
            }, {} as Record<string, Spot[]>);
          
          setSpotsByBarangay(sortedData);
        }
      } catch (error) {
        console.error('Error fetching spots:', error);
        // Fallback to empty object if there's an error
        setSpotsByBarangay({});
      } finally {
        setIsLoadingSpots(false);
      }
    };
    
    fetchSpots();
    return () => unsubscribe();
  }, []);

  interface FormData {
    fullName: string;
    email: string;
    age: string;
    visitorType: string;
    barangays: string[];
    spots: Spot[];
    date: Date | null;
    agree: boolean;
    contactNumber: string;
  }

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    age: '',
    visitorType: '',
    barangays: [],
    spots: [],
    date: null,
    agree: false,
    contactNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  interface Spot {
    id: string;
    name: string;
    businessId?: string | null;
  }

  const [spotsByBarangay, setSpotsByBarangay] = useState<Record<string, Spot[]>>({});
  const [isLoadingSpots, setIsLoadingSpots] = useState(true);

  // replace existing handler that allowed multiple barangays
  const handleBarangayChange = (barangay: string) => {
    // If clicked the already selected barangay, clear selection
    if (form.barangays[0] === barangay) {
      setForm({ ...form, barangays: [], spots: [] });
    } else {
      // Select only this barangay and clear any selected spots
      setForm({ ...form, barangays: [barangay], spots: [] });
    }
  };

  // replace existing handler that allowed multiple spots
  const handleSpotChange = (spotId: string, spotName: string, isChecked: boolean, businessId: string | null = null) => {
    if (isChecked) {
      // Select only this spot
      setForm(prev => ({
        ...prev,
        spots: [{ id: spotId, name: spotName, businessId }]
      }));
    } else {
      // Clear spot selection
      setForm(prev => ({ ...prev, spots: [] }));
    }
  };

  // Add age category helper
  const getAgeCategory = (ageStr: string) => {
    const age = parseInt(ageStr, 10);
    if (Number.isNaN(age)) return '';
    if (age < 18) return 'Child';
    if (age >= 60) return 'Senior Citizen';
    return 'Adult';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first.');
      return;
    }

    if (!form.date) {
      alert('Please select a date for your visit.');
      return;
    }

    // Validate age is numeric and within 1..99
    const ageNum = parseInt(form.age, 10);
    if (Number.isNaN(ageNum) || ageNum < 1 || ageNum > 99) {
      alert('Please enter a valid age between 1 and 99.');
      return;
    }

    setLoading(true);
    try {
      const formattedDate = form.date.toISOString().split('T')[0];

      // Separate private and public spots
      const privateSpots = form.spots.filter(spot => spot.businessId);
      const publicSpots = form.spots.filter(spot => !spot.businessId);

      // Group private spots by businessId
      const privateSpotsByBusiness = privateSpots.reduce<Record<string, Spot[]>>((acc, spot) => {
        if (!spot.businessId) return acc;
        if (!acc[spot.businessId]) acc[spot.businessId] = [];
        acc[spot.businessId].push(spot);
        return acc;
      }, {});

      // Public visit
      if (publicSpots.length > 0) {
        await addDoc(collection(db, 'visits'), {
          userId: user.uid,
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
          age: form.age,
          visitorType: form.visitorType,
          barangays: form.barangays,
          spots: publicSpots.map(spot => spot.name),
          companions: [], // companions removed from form, keep empty array for schema
          date: formattedDate,
          agree: form.agree,
          status: 'pending',
          isPrivate: false,
          createdAt: serverTimestamp(),
        });
      }

      // Private visits
      for (const [businessId, spots] of Object.entries(privateSpotsByBusiness)) {
        if (spots.length === 0) continue;

        await addDoc(collection(db, 'visits'), {
          userId: user.uid,
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
          age: form.age,
          visitorType: form.visitorType,
          barangays: form.barangays,
          spots: spots.map(spot => spot.name),
          companions: [], // companions removed from form
          date: formattedDate,
          agree: form.agree,
          status: 'pending',
          isPrivate: true,
          businessId: businessId,
          businessName: spots[0].businessId || '',
          createdAt: serverTimestamp(),
        });
      }

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

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-gray-600 mb-1">Visitor Type</label>
                  <select
                    required
                    value={form.visitorType}
                    className="border border-gray-300 rounded-md w-full p-2.5 bg-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    onChange={(e) => setForm({ ...form, visitorType: e.target.value })}
                  >
                    <option value="">Select type</option>
                    <option value="domestic">Domestic</option>
                    <option value="foreign">Foreign</option>
                  </select>
                </div>
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
                  min={1}
                  max={99}
                  required
                  value={form.age}
                  className="border border-gray-300 rounded-md w-full p-2.5 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setForm({ ...form, age: '' });
                      return;
                    }
                    // allow only digits and clamp to 1..99
                    const digits = raw.replace(/\D/g, '');
                    const num = Math.max(1, Math.min(99, parseInt(digits || '0', 10) || 1));
                    setForm({ ...form, age: String(num) });
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {form.age ? `${getAgeCategory(form.age)} (${form.age} years old)` : 'Enter an age between 1 and 99.'}
                </p>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Contact Number</label>
                <input
                  type="tel"
                  required
                  value={form.contactNumber}
                  className="border border-gray-300 rounded-md w-full p-2.5 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Destination Selection */}
          <section>
            <h2 className="text-xl font-semibold text-green-700 mb-4 border-l-4 border-green-400 pl-2">
              Destination Selection
            </h2>
            {isLoadingSpots ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin h-6 w-6 text-green-600 mr-2" />
                <span>Loading destinations...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {Object.entries(spotsByBarangay).map(([barangay, spots]) => (
                  <label
                    key={barangay}
                    className="flex items-center gap-2 bg-gray-50 border rounded-md p-2 hover:bg-green-50 transition"
                  >
                    <input
                      type="checkbox"
                      // show as checked only if this barangay is the single selected one
                      checked={form.barangays[0] === barangay}
                      onChange={() => handleBarangayChange(barangay)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium">
                      {barangay.replace(/([A-Z])/g, ' $1').trim()} 
                      <span className="text-gray-500 text-xs block">
                        ({spots.length} {spots.length === 1 ? 'spot' : 'spots'})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {form.barangays.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Select specific spots (optional):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {form.barangays.flatMap((barangay) => {
                    const list = spotsByBarangay[barangay] || [];
                    return list.map((spot) => (
                      <div key={spot.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`spot-${spot.id}`}
                          // checked only if this spot is the single selected one
                          checked={form.spots.length > 0 && form.spots[0].id === spot.id}
                          onChange={(e) => handleSpotChange(spot.id, spot.name, e.target.checked, spot.businessId || null)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`spot-${spot.id}`} className="text-sm text-gray-700">
                          {spot.name}
                        </label>
                      </div>
                    ));
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Visit Details */}
          <section>
            <h2 className="text-xl font-semibold text-green-700 mb-4 border-l-4 border-green-400 pl-2">
              Visit Details
            </h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-1 font-medium">Select Visit Date</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-green-500" />
                </div>
                <DatePicker
                  wrapperClassName="w-full"
                  selected={form.date}
                  onChange={(date: Date | null) => date && setForm({ ...form, date })}
                  minDate={new Date()}
                  maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                  placeholderText="Select a date"
                  dateFormat="MMMM d, yyyy"
                  className="w-full pl-10 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  showPopperArrow={false}
                  calendarClassName="font-sans shadow-lg rounded-lg border border-gray-200 rounded-xl overflow-hidden"
                  dayClassName={(date: Date) => {
                    const selectedDate = form.date;
                    if (!selectedDate) return '';
                    return date.getDate() === selectedDate.getDate() && 
                           date.getMonth() === selectedDate.getMonth() && 
                           date.getFullYear() === selectedDate.getFullYear()
                      ? 'bg-green-500 text-white rounded-full'
                      : 'hover:bg-gray-100';
                  }}
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                      <button
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        type="button"
                        className={`p-1 rounded-full ${prevMonthButtonDisabled ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="text-lg font-semibold text-gray-700">
                        {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
                      </div>
                      <button
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        type="button"
                        className={`p-1 rounded-full ${nextMonthButtonDisabled ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
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
