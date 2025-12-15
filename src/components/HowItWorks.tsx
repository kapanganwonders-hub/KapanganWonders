"use client";

import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const defaultSteps: Step[] = [
  {
    id: 1,
    title: "Create Account",
    description: "Sign up for a free account to start planning your trip to Kapangan.",
    icon: "👤",
  },
  {
    id: 2,
    title: "Choose Your Destination",
    description: "Browse and select from our list of beautiful tourist spots in Kapangan.",
    icon: "📍",
  },
  {
    id: 3,
    title: "Book Your Visit",
    description: "Select your preferred date and time for your visit.",
    icon: "📅",
  },
  {
    id: 4,
    title: "Enjoy Your Trip",
    description: "Experience the beauty and culture of Kapangan!",
    icon: "😊",
  },
];

const HowItWorks = () => {
  // State management
  const { isAdmin, currentUser } = useAuth() || {};
  
  // Section data state
  const [steps, setSteps] = useState<Step[]>(defaultSteps);
  const [sectionTitle, setSectionTitle] = useState("How It Works");
  const [sectionDescription, setSectionDescription] = useState(
    "Planning your trip to Kapangan is quick and easy with these simple steps."
  );
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'destructive';
    title: string;
    message: string;
  } | null>(null);
  
  // Editing state
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<
    "sectionTitle" | "sectionDescription" | "title" | "description" | null
  >(null);
  const [tempValue, setTempValue] = useState("");
  
  // Create a stable reference to the Firestore document
  const docRef = doc(db, "howItWorksSection", "main");
  
  // Save data to Firestore
  const saveData = async (
    newTitle?: string,
    newDescription?: string,
    newSteps?: Step[]
  ): Promise<boolean> => {
    if (!isAdmin) return false;
    
    try {
      const dataToSave = {
        title: newTitle !== undefined ? newTitle : sectionTitle,
        description: newDescription !== undefined ? newDescription : sectionDescription,
        steps: newSteps || steps,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || "anonymous"
      };

      await setDoc(docRef, dataToSave, { merge: true });
      
      // Update local state
      if (newTitle !== undefined) setSectionTitle(newTitle);
      if (newDescription !== undefined) setSectionDescription(newDescription);
      if (newSteps) setSteps(newSteps);
      
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'How It Works Section updated successfully!'
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
    } finally {
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Load data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as {
            title?: string;
            description?: string;
            steps?: Step[];
          };
          setSectionTitle(data.title || "How It Works");
          setSectionDescription(
            data.description || "Planning your trip to Kapangan is quick and easy with these simple steps."
          );
          setSteps(data.steps || defaultSteps);
        } else {
          // Create default document if not existing
          await setDoc(docRef, {
            title: "How It Works",
            description: "Planning your trip to Kapangan is quick and easy with these simple steps.",
            steps: defaultSteps,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("❌ Error loading HowItWorks section:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [docRef]);

  // Handle starting to edit a field
  const handleStartEditing = (
    stepId: number,
    field: "title" | "description",
    value: string
  ) => {
    if (isEditMode) {
      setEditingStep(stepId);
      setEditingField(field);
      setTempValue(value);
    }
  };

  // Handle starting to edit a section field
  const startEditingSection = (
    field: "sectionTitle" | "sectionDescription",
    value: string
  ) => {
    if (isEditMode) {
      setEditingField(field);
      setTempValue(value);
    }
  };

  // Handle saving changes
  const handleSave = async (id?: number) => {
    if (editingField === "sectionTitle") {
      await saveData(tempValue, undefined, undefined);
    } else if (editingField === "sectionDescription") {
      await saveData(undefined, tempValue, undefined);
    } else if (editingField && id !== undefined) {
      const updated = steps.map((step) =>
        step.id === id ? { ...step, [editingField]: tempValue } : step
      );
      await saveData(undefined, undefined, updated);
    }

    setEditingStep(null);
    setEditingField(null);
    setTempValue("");
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent, id?: number) => {
    if (e.key === "Enter") handleSave(id);
    else if (e.key === "Escape") {
      setEditingStep(null);
      setEditingField(null);
      setTempValue("");
    }
  };

  // Handle saving all changes
  const handleSaveChanges = async () => {
    const success = await saveData(sectionTitle, sectionDescription, steps);
    if (success) {
      setIsEditMode(false);
      setEditingField(null);
      setEditingStep(null);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // When entering edit mode, set initial values for editing
      setTempValue('');
      setEditingField(null);
      setEditingStep(null);
    }
  };

  // Handle canceling edits
  const handleCancel = () => {
    // Reload data from Firestore to discard changes
    const reloadData = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as {
            title?: string;
            description?: string;
            steps?: Step[];
          };
          setSectionTitle(data.title || "How It Works");
          setSectionDescription(
            data.description || "Planning your trip to Kapangan is quick and easy with these simple steps."
          );
          setSteps(data.steps || defaultSteps);
        }
      } catch (error) {
        console.error("Error reloading data:", error);
      }
    };
    
    reloadData();
    setIsEditMode(false);
    setEditingField(null);
    setEditingStep(null);
  };

  /** 🔹 Loading UI */
  if (isLoading) {
    return (
      <section className="relative py-20 min-h-[600px] flex items-center justify-center overflow-hidden font-['Poppins']">
        <div className="absolute inset-0 z-0 bg-black/50">
          <div className="absolute top-0 left-0 w-72 h-72 bg-green-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slower"></div>
          <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-medium"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white rounded-full mx-auto mb-3"></div>
          <p className="text-gray-200">Loading content...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 min-h-[600px] flex items-center justify-center overflow-hidden font-['Poppins']">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 bg-black/50">
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slower"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-medium"></div>
      </div>
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
              onClick={isEditMode ? handleCancel : () => setIsEditMode(true)}
              className={`inline-flex items-center px-6 py-2.5 border-2 ${isEditMode ? 'border-red-400 bg-red-500/90 hover:bg-red-600' : 'border-white/20 bg-white/10 hover:bg-white/20'} text-sm font-medium rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-all duration-300 hover:shadow-lg`}
            >
              {isEditMode ? (
                <>
                  <X className="-ml-1 mr-2 h-5 w-5" />
                  Cancel
                </>
              ) : (
                <>
                  Manage How It Works Section
                </>
              )}
            </button>
            {isEditMode && (
              <button
                onClick={handleSaveChanges}
                className="inline-flex items-center px-6 py-2.5 border-2 border-green-500 text-sm font-medium rounded-full text-gray-100 bg-green-900 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 hover:shadow-lg ml-3"
              >
                <Save className="-ml-1 mr-2 h-5 w-5" />
                Save Changes
              </button>
            )}
          </div>
        </div>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-white border-2 border-green-500 rounded-2xl bg-black/40 p-6 md:p-8 overflow-hidden">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block relative w-full">
            <div className="mb-6">
              {isEditMode ? (
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="text-3xl md:text-4xl font-bold text-center w-full bg-white/10 backdrop-blur-sm border-b-2 border-white/30 focus:outline-none focus:ring-0 px-2 py-1 rounded-md text-white"
                />
              ) : (
                <h2 className="text-3xl md:text-4xl font-bold text-gray-100 text-center">
                  {sectionTitle}
                </h2>
              )}
            </div>
          
          <div className="relative max-w-2xl mx-auto">
            {editingField === "sectionDescription" ? (
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave()}
                onKeyDown={(e) => handleKeyDown(e)}
                className="text-lg text-white/90 w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 outline-none text-center resize-none h-20 placeholder-white/50 font-['Poppins']"
                autoFocus
                placeholder="Enter section description..."
              />
            ) : (
              <div className="relative max-w-2xl mx-auto">
                {isEditMode ? (
                  <textarea
                    value={sectionDescription}
                    onChange={(e) => setSectionDescription(e.target.value)}
                    className="w-full h-24 p-2 border border-emerald-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
                  />
                ) : (
                  <p className="text-lg text-gray-200 text-center mb-12">{sectionDescription}</p>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="group relative text-center p-8 bg-black/40 backdrop-blur-sm rounded-2xl border-2 border-green-500 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Connecting Line  */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-green-200 to-blue-200 transform translate-x-1/2 -z-10 group-hover:from-green-300 group-hover:to-blue-300 transition-all duration-300"></div>
              )}
              
              <div className="relative bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center text-sm shadow-lg ring-2 ring-white/20">
                  {step.id}
                </div>

                {/* Step Icon */}
                <div className="text-5xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {isEditMode ? (
                    <div className="flex justify-center">
                      <select
                        value={step.icon}
                        onChange={(e) => {
                          const updated = [...steps];
                          updated[index].icon = e.target.value;
                          setSteps(updated);
                        }}
                        className="text-4xl text-center bg-white/50 border border-emerald-300 rounded-md p-1"
                      >
                        <option value="👤">👤</option>
                        <option value="📍">📍</option>
                        <option value="📅">📅</option>
                        <option value="😊">😊</option>
                        <option value="🏞️">🏞️</option>
                        <option value="🏨">🏨</option>
                        <option value="🍽️">🍽️</option>
                        <option value="🚗">🚗</option>
                        <option value="📷">📷</option>
                        <option value="🎭">🎭</option>
                        <option value="🛍️">🛍️</option>
                        <option value="🌄">🌄</option>
                      </select>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto border border-white/20 group-hover:border-white/30 transition-colors">
                      {step.icon}
                    </div>
                  )}
                </div>

                {/* Step Title */}
                <div className="relative mb-4 min-h-[3rem] flex items-center justify-center">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editingField === 'title' && editingStep === step.id ? tempValue : step.title}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTempValue(value);
                        setSteps(steps.map(s => 
                          s.id === step.id ? { ...s, title: value } : s
                        ));
                      }}
                      onFocus={() => {
                        setEditingStep(step.id);
                        setEditingField('title');
                        setTempValue(step.title);
                      }}
                      onBlur={() => handleSave(step.id)}
                      onKeyDown={(e) => handleKeyDown(e, step.id)}
                      className="text-xl font-semibold text-white w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none text-center focus:ring-2 focus:ring-white/50 focus:border-white/30"
                      placeholder="Enter step title..."
                    />
                  ) : (
                    <h3 className="text-xl font-semibold text-gray-100 text-center">
                      {step.title}
                    </h3>
                  )}
                </div>

                {/* Step Description */}
                <div className="relative">
                  {isEditMode ? (
                    <textarea
                      value={editingField === 'description' && editingStep === step.id ? tempValue : step.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTempValue(value);
                        setSteps(steps.map(s => 
                          s.id === step.id ? { ...s, description: value } : s
                        ));
                      }}
                      onFocus={() => {
                        setEditingStep(step.id);
                        setEditingField('description');
                        setTempValue(step.description);
                      }}
                      onBlur={() => handleSave(step.id)}
                      onKeyDown={(e) => handleKeyDown(e, step.id)}
                      className="w-full h-24 p-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/30 bg-white/10 resize-none text-white/90 placeholder-white/50"  placeholder="Enter step description..."
                    />
                  ) : (
                    <div className="relative">
                      <p className="text-gray-200">{step.description}</p>
                    </div>
                  )}
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-600 rounded-2xl opacity-0 group-hover:opacity-10 blur-lg transition duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;