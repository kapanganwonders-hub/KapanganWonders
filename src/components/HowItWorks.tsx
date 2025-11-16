"use client";

import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const defaultSteps: Step[] = [
  {
    id: 1,
    title: "Create       Account",
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
  const { isAdmin, currentUser } = useAuth() || {};
  const [steps, setSteps] = useState<Step[]>(defaultSteps);
  const [sectionTitle, setSectionTitle] = useState("How It Works");
  const [sectionDescription, setSectionDescription] = useState(
    "Planning your trip to Kapangan is quick and easy with these simple steps."
  );
  const [isLoading, setIsLoading] = useState(true);

  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<
    "sectionTitle" | "sectionDescription" | "title" | "description" | null
  >(null);
  const [tempValue, setTempValue] = useState("");

  const docRef = doc(db, "howItWorksSection", "main");

  /** 🔹 Load data from Firestore */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setSectionTitle(data.title || "How It Works");
          setSectionDescription(
            data.description ||
              "Planning your trip to Kapangan is quick and easy with these simple steps."
          );
          setSteps(data.steps || defaultSteps);
        } else {
          // Create default document if not existing
          await setDoc(docRef, {
            title: "How It Works",
            description:
              "Planning your trip to Kapangan is quick and easy with these simple steps.",
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
  }, []);

  /** 🔹 Save changes to Firestore */
  const saveData = async (
    newTitle?: string,
    newDescription?: string,
    newSteps?: Step[]
  ) => {
    if (!isAdmin) return; // Respect Firestore rule
    try {
      await setDoc(
        docRef,
        {
          title: newTitle ?? sectionTitle,
          description: newDescription ?? sectionDescription,
          steps: newSteps ?? steps,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentUser?.email || "anonymous",
        },
        { merge: true }
      );
    } catch (err) {
      console.error("❌ Error saving HowItWorks section:", err);
    }
  };

  /** 🔹 Editing Handlers */
  const handleStartEditing = (
    stepId: number,
    field: "title" | "description",
    value: string
  ) => {
    setEditingStep(stepId);
    setEditingField(field);
    setTempValue(value);
  };

  const startEditingSection = (
    field: "sectionTitle" | "sectionDescription",
    value: string
  ) => {
    setEditingField(field);
    setTempValue(value);
  };

  const handleSave = async (id?: number) => {
    if (editingField === "sectionTitle") {
      setSectionTitle(tempValue);
      await saveData(tempValue, undefined, undefined);
    } else if (editingField === "sectionDescription") {
      setSectionDescription(tempValue);
      await saveData(undefined, tempValue, undefined);
    } else if (editingField && id !== undefined) {
      const updated = steps.map((step) =>
        step.id === id ? { ...step, [editingField]: tempValue } : step
      );
      setSteps(updated);
      await saveData(undefined, undefined, updated);
    }

    setEditingStep(null);
    setEditingField(null);
    setTempValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id?: number) => {
    if (e.key === "Enter") handleSave(id);
    else if (e.key === "Escape") {
      setEditingStep(null);
      setEditingField(null);
      setTempValue("");
    }
  };

  /** 🔹 Loading UI */
  if (isLoading) {
    return (
      <section className="relative py-20 min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 to-blue-50/40"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-green-500 rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background Design */}
      <div className="absolute inset-0 z-0">   
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-1x0.5 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/10 rounded-full mix-blend-multiply filter blur-1xl animate-pulse delay-1500"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0, 0, 0, 0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0, 0, 0, 0.01)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block relative">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 relative z-10 font-serif">
              <span className="relative inline-block">
                {editingField === "sectionTitle" ? (
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleSave()}
                    onKeyDown={(e) => handleKeyDown(e)}
                    className="text-4xl md:text-5xl font-bold text-gray-900 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4 outline-none text-center w-full max-w-xl mx-auto placeholder-gray-400"
                    autoFocus
                    placeholder="Enter section title..."
                  />
                ) : (
                  <span>
                    {sectionTitle}
                    <span className="absolute bottom-2 left-0 w-full h-3 bg-green-100 -z-10 transform translate-y-1 rounded-full"></span>
                  </span>
                )}
              </span>
            </h2>
            {isAdmin && editingField !== "sectionTitle" && (
              <button
                className="ml-4 p-2 text-gray-500 hover:text-gray-700 transition-all duration-300 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full border border-gray-200 hover:border-gray-300"
                onClick={() => startEditingSection("sectionTitle", sectionTitle)}
                aria-label="Edit section title"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto my-6 rounded-full"></div>
          
          <div className="relative max-w-2xl mx-auto">
            {editingField === "sectionDescription" ? (
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave()}
                onKeyDown={(e) => handleKeyDown(e)}
                className="text-lg text-gray-600 w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-6 py-4 outline-none text-center resize-none h-20 placeholder-gray-400 font-sans"
                autoFocus
                placeholder="Enter section description..."
              />
            ) : (
              <p className="text-lg text-gray-600 font-sans">{sectionDescription}</p>
            )}
            {isAdmin && editingField !== "sectionDescription" && (
              <button
                className="absolute -right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-all duration-300 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full border border-gray-200 hover:border-gray-300"
                onClick={() =>
                  startEditingSection("sectionDescription", sectionDescription)
                }
                aria-label="Edit section description"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="group relative"
            >
              {/* Connecting Line  */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-green-200 to-blue-200 transform translate-x-1/2 -z-10 group-hover:from-green-300 group-hover:to-blue-300 transition-all duration-300"></div>
              )}
              
              <div className="relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-100 hover:border-green-200 group-hover:bg-white">
                {/* Step Number */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold flex items-center justify-center text-sm shadow-lg">
                  {step.id}
                </div>

                {/* Step Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center text-3xl mb-6 mx-auto transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-green-100">
                  {step.icon}
                </div>

                {/* Step Title */}
                <div className="relative mb-4 min-h-[3rem] flex items-center justify-center">
                  {editingStep === step.id && editingField === "title" ? (
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={() => handleSave(step.id)}
                      onKeyDown={(e) => handleKeyDown(e, step.id)}
                      className="text-xl font-semibold text-gray-900 w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2 outline-none text-center placeholder-gray-400"
                      autoFocus
                      placeholder="Enter step title..."
                    />
                  ) : (
                    <h3 className="text-xl font-semibold text-gray-900 text-center">
                      {step.title}
                    </h3>
                  )}
                  {isAdmin && editingStep !== step.id && editingField !== "title" && (
                    <button
                      className="absolute -right-2 -top-2 p-1.5 text-gray-400 hover:text-gray-600 transition-all duration-300 opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full border border-gray-200 hover:border-gray-300"
                      onClick={() =>
                        handleStartEditing(step.id, "title", step.title)
                      }
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Step Description */}
                <div className="relative min-h-[5rem]">
                  {editingStep === step.id && editingField === "description" ? (
                    <textarea
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={() => handleSave(step.id)}
                      onKeyDown={(e) => handleKeyDown(e, step.id)}
                      className="text-gray-600 w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 outline-none text-center resize-none h-20 placeholder-gray-400 font-sans text-sm"
                      autoFocus
                      placeholder="Enter step description..."
                    />
                  ) : (
                    <p className="text-gray-600 text-sm leading-relaxed text-center font-sans">
                      {step.description}
                    </p>
                  )}
                  {isAdmin && editingStep !== step.id && editingField !== "description" && (
                    <button
                      className="absolute -right-2 -top-2 p-1.5 text-gray-400 hover:text-gray-600 transition-all duration-300 opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full border border-gray-200 hover:border-gray-300"
                      onClick={() =>
                        handleStartEditing(step.id, "description", step.description)
                      }
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;