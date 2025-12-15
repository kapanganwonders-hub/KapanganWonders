"use client";

import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const defaultFeatures: Feature[] = [
  {
    id: 1,
    title: "Natural    Wonders",
    description:
      "Discover breathtaking landscapes, mountains, and natural attractions that showcase the beauty of Kapangan.",
    icon: "🏔️",
  },
  {
    id: 2,
    title: "Cultural Heritage",
    description:
      "Experience the rich cultural traditions, festivals, and local customs of the Kapangan community.",
    icon: "🎭",
  },
  {
    id: 3,
    title: "Local Cuisine",
    description:
      "Taste authentic Filipino dishes and local specialties made with fresh, locally-sourced ingredients.",
    icon: "🍽️",
  },
  {
    id: 4,
    title: "Adventure Activities",
    description:
      "Enjoy hiking, trekking, and other outdoor activities in the beautiful mountain terrain.",
    icon: "🥾",
  },
];

const WhyChooseSection = () => {
  const { isAdmin, currentUser } = useAuth() || {};
  
  // Section data state
  const [features, setFeatures] = useState<Feature[]>([]);
  const [sectionTitle, setSectionTitle] = useState("Why Choose Kapangan?");
  const [sectionDescription, setSectionDescription] = useState(
    "Experience the perfect blend of natural beauty, cultural richness, and warm hospitality."
  );
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'destructive';
    title: string;
    message: string;
  } | null>(null);
  
  // Original values for cancel
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");
  const [originalFeatures, setOriginalFeatures] = useState<Feature[]>([]);

  // Firestore document reference
  const docRef = doc(db, "whyChooseSection", "main");

  // Load data from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setSectionTitle(data.title || sectionTitle);
          setSectionDescription(data.description || sectionDescription);
          setFeatures(data.features || defaultFeatures);
          
          // Set original values
          setOriginalTitle(data.title || sectionTitle);
          setOriginalDescription(data.description || sectionDescription);
          setOriginalFeatures(data.features || defaultFeatures);
        } else {
          // Create document if not found (initial setup)
          await setDoc(docRef, {
            title: sectionTitle,
            description: sectionDescription,
            features: defaultFeatures,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.email || 'system'
          });
          setFeatures(defaultFeatures);
          setOriginalFeatures(defaultFeatures);
        }
      } catch (error) {
        console.error("Error loading Why Choose section:", error);
        setFeatures(defaultFeatures);
        setOriginalFeatures(defaultFeatures);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [docRef]);
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Save data to Firestore
  const saveData = async (
    newTitle?: string,
    newDescription?: string,
    newFeatures?: Feature[]
  ) => {
    if (!isAdmin) {
      setNotification({
        type: 'destructive',
        title: 'Error',
        message: 'You do not have permission to edit this section.'
      });
      return false;
    }

    try {
      const dataToSave = {
        title: newTitle !== undefined ? newTitle : sectionTitle,
        description: newDescription !== undefined ? newDescription : sectionDescription,
        features: newFeatures || features,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'anonymous'
      };

      await setDoc(docRef, dataToSave, { merge: true });
      
      // Update local state
      if (newTitle !== undefined) setSectionTitle(newTitle);
      if (newDescription !== undefined) setSectionDescription(newDescription);
      if (newFeatures) setFeatures(newFeatures);
      
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'Why Choose section updated successfully!'
      });
      
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      setNotification({
        type: 'destructive',
        title: 'Error',
        message: 'Failed to update section. Please try again.'
      });
      return false;
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (!isEditMode) {
      // When entering edit mode, save current state
      setOriginalTitle(sectionTitle);
      setOriginalDescription(sectionDescription);
      setOriginalFeatures([...features]);
    }
    setIsEditMode(!isEditMode);
  };
  
  // Handle canceling edits
  const handleCancel = () => {
    // Revert to original values
    setSectionTitle(originalTitle);
    setSectionDescription(originalDescription);
    setFeatures([...originalFeatures]);
    setIsEditMode(false);
    
    setNotification({
      type: 'destructive',
      title: 'Changes Discarded',
      message: 'Your changes have been reverted.'
    });
  };
  
  // Handle saving all changes
  const handleSaveChanges = async () => {
    const success = await saveData(sectionTitle, sectionDescription, features);
    if (success) {
      setIsEditMode(false);
    }
  };

  /** 🔹 Inline editing logic */
  type EditingField =
    | { type: "sectionTitle" }
    | { type: "sectionDescription" }
    | { type: "feature"; id: number; field: "title" | "description" };

  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [tempValue, setTempValue] = useState("");

  const startEditing = (field: EditingField) => {
    setEditingField(field);
    switch (field.type) {
      case "sectionTitle":
        setTempValue(sectionTitle);
        break;
      case "sectionDescription":
        setTempValue(sectionDescription);
        break;
      case "feature": {
        const f = features.find((x) => x.id === field.id);
        if (f) setTempValue(f[field.field]);
        break;
      }
    }
  };

  const handleSave = async () => {
    if (!editingField) return;
    try {
      switch (editingField.type) {
        case "sectionTitle":
          await saveData(tempValue, undefined, undefined);
          setSectionTitle(tempValue);
          break;
        case "sectionDescription":
          await saveData(undefined, tempValue, undefined);
          setSectionDescription(tempValue);
          break;
        case "feature": {
          const { id, field } = editingField;
          const updated = features.map((f) =>
            f.id === id ? { ...f, [field]: tempValue } : f
          );
          await saveData(undefined, undefined, updated);
          setFeatures(updated);
          break;
        }
      }
    } catch (e) {
      console.error("Error saving changes:", e);
    } finally {
      setEditingField(null);
      setTempValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") {
      setEditingField(null);
      setTempValue("");
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 relative min-h-[600px] flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/Kapangan.jpg"
            alt="Loading Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white rounded-full mx-auto mb-3"></div>
          <p className="text-white/80">Loading content...</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-20 relative min-h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-emerald-600 rounded-full mx-auto mb-3"></div>
          <p className="text-white/80">Loading content...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 min-h-[600px] flex items-center justify-center overflow-hidden font-['Poppins']">
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 w-80">
          <Alert variant={notification.type}>
            <AlertTitle>{notification.title}</AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}
      
      {isAdmin && (
        <div className="flex justify-end mb-6 absolute top-4 right-4 z-20">
          <div className="flex space-x-3">
            <button
              onClick={isEditMode ? handleCancel : toggleEditMode}
              className={`inline-flex items-center px-6 py-2.5 border-2 ${isEditMode ? 'border-red-400 bg-red-500/90 hover:bg-red-600' : 'border-white/20 bg-white/10 hover:bg-white/20'} text-sm font-medium rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-all duration-300 hover:shadow-lg`}
            >
              {isEditMode ? (
                <>
                  <X className="-ml-1 mr-2 h-5 w-5" />
                  Cancel
                </>
              ) : (
                'Manage Why Choose Section'
              )}
            </button>
            {isEditMode && (
              <button
                onClick={handleSaveChanges}
                className="inline-flex items-center px-6 py-2.5 border-2 border-white/20 text-sm font-medium rounded-full text-white bg-green-500/90 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all duration-300 hover:shadow-lg ml-3"
              >
                <Save className="-ml-1 mr-2 h-5 w-5" />
                Save Changes
              </button>
            )}
          </div>
        </div>
      )}
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 bg-black/50">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slower"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-medium"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-white border-2 border-green-500 rounded-2xl bg-black/40 p-6 md:p-8 overflow-hidden">
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Title */}
          <div className="relative mb-6">
            {isEditMode ? (
              <input
                type="text"
                value={editingField?.type === 'sectionTitle' ? tempValue : sectionTitle}
                onChange={(e) => {
                  setTempValue(e.target.value);
                  setSectionTitle(e.target.value);
                }}
                onFocus={() => startEditing({ type: 'sectionTitle' })}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-3xl md:text-4xl font-bold text-center w-full bg-white/10 border-b-2 border-white/30 focus:outline-none focus:ring-0 px-2 py-1 rounded-md text-white"
              />
            ) : (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-100 text-center">
                {sectionTitle}
              </h2>
            )}
          </div>

          {/* Description */}
          <div className="relative max-w-3xl mx-auto mb-12">
            {isEditMode ? (
              <textarea
                value={editingField?.type === 'sectionDescription' ? tempValue : sectionDescription}
                onChange={(e) => {
                  setTempValue(e.target.value);
                  setSectionDescription(e.target.value);
                }}
                onFocus={() => startEditing({ type: 'sectionDescription' })}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-lg text-white/90 w-full bg-white/10 border border-white/20 rounded-md p-4 focus:ring-2 focus:ring-white/50 focus:border-white/30 text-center h-32 placeholder-white/50"
                placeholder="Enter section description..."
              />
            ) : (
              <p className="text-lg text-gray-200 text-center">
                {sectionDescription}
              </p>
            )}
          </div>

        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`group relative text-center p-8 bg-black/40 backdrop-blur-sm rounded-2xl border-2 border-green-500 transition-all duration-500 transform ${
                isEditMode ? '' : 'hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

              {/* Floating Border Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-20"></div>

              {/* Feature Icon */}
              <div className="text-5xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {isEditMode ? (
                  <div className="flex justify-center">
                    <select
                      value={feature.icon}
                      onChange={(e) => {
                        const updated = [...features];
                        updated[index].icon = e.target.value;
                        setFeatures(updated);
                      }}
                      className="text-4xl text-center bg-white/50 border border-emerald-300 rounded-md p-1"
                    >
                      <option value="🏔️">🏔️</option>
                      <option value="🎭">🎭</option>
                      <option value="🍽️">🍽️</option>
                      <option value="🥾">🥾</option>
                      <option value="🌿">🌿</option>
                      <option value="🏖️">🏖️</option>
                      <option value="🏕️">🏕️</option>
                      <option value="🚣">🚣</option>
                    </select>
                  </div>
                ) : (
                  feature.icon
                )}
              </div>

              {/* Title */}
              <div className="relative mb-4 min-h-[3rem] flex items-center justify-center">
                {isEditMode ? (
                  <div className="w-full">
                    <input
                      type="text"
                      value={editingField?.type === 'feature' && editingField.id === feature.id && editingField.field === 'title' ? tempValue : feature.title}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTempValue(value);
                        setFeatures(features.map(f => 
                          f.id === feature.id ? { ...f, title: value } : f
                        ));
                      }}
                      onFocus={() => startEditing({ type: 'feature', id: feature.id, field: 'title' })}
                      onBlur={handleSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSave();
                        } else if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      className="text-xl font-bold w-full bg-white/80 border-b border-emerald-500 focus:outline-none focus:ring-0 px-2 py-1 text-center"
                    />
                  </div>
                ) : (
                  <h3 className="text-xl font-semibold text-gray-100">
                    {feature.title}
                  </h3>
                )}
              </div>

              {/* Description */}
              <div className="min-h-[6rem]">
                {isEditMode ? (
                  <div className="w-full">
                    <textarea
                      value={editingField?.type === 'feature' && editingField.id === feature.id && editingField.field === 'description' ? tempValue : feature.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTempValue(value);
                        setFeatures(features.map(f => 
                          f.id === feature.id ? { ...f, description: value } : f
                        ));
                      }}
                      onFocus={() => startEditing({ type: 'feature', id: feature.id, field: 'description' })}
                      onBlur={handleSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSave();
                        } else if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      className="w-full h-24 bg-white/10 border border-white/20 rounded-md p-2 focus:ring-2 focus:ring-white/50 focus:border-white/30 text-center text-sm text-white/90 placeholder-white/50"
                      placeholder="Enter feature description..."
                    />
                  </div>
                ) : (
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                )}
              </div>

              {/* Hover Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:w-16"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.08; }
        }
        @keyframes pulse-medium {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.09; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-pulse-slower {
          animation: pulse-slower 12s ease-in-out infinite;
        }
        .animate-pulse-medium {
          animation: pulse-medium 10s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default WhyChooseSection;