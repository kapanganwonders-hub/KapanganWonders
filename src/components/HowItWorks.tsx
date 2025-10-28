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
    title: "Create an Account",
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
      <section className="py-16 bg-gray-50 text-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-green-500 rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">Loading content...</p>
      </section>
    );
  }

  /** 🔹 Render */
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 relative group">
          {editingField === "sectionTitle" ? (
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => handleSave()}
              onKeyDown={(e) => handleKeyDown(e)}
              className="text-3xl font-bold text-gray-900 mb-4 bg-transparent border-b border-gray-300 outline-none text-center w-full max-w-xl mx-auto"
              autoFocus
            />
          ) : (
            <div className="relative inline-flex items-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {sectionTitle}
              </h2>
              {isAdmin && (
                <button
                  className="ml-2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => startEditingSection("sectionTitle", sectionTitle)}
                  aria-label="Edit section title"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="relative max-w-2xl mx-auto">
            {editingField === "sectionDescription" ? (
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave()}
                onKeyDown={(e) => handleKeyDown(e)}
                className="text-lg text-gray-600 w-full bg-transparent border-b border-gray-300 outline-none text-center resize-none h-12"
                autoFocus
              />
            ) : (
              <p className="text-lg text-gray-600">{sectionDescription}</p>
            )}
            {isAdmin && editingField !== "sectionDescription" && (
              <button
                className="absolute -right-4 top-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="relative group">
              <div className="relative bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-3xl mb-4">
                  {step.icon}
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold flex items-center justify-center -mt-10 mb-2">
                  {step.id}
                </div>

                {/* Step Title */}
                <div className="relative group w-full">
                  {editingStep === step.id && editingField === "title" ? (
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={() => handleSave(step.id)}
                      onKeyDown={(e) => handleKeyDown(e, step.id)}
                      className="text-xl font-semibold text-gray-900 mb-2 w-full bg-transparent border-b border-gray-300 outline-none text-center"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                  )}
                  {isAdmin && editingField !== "title" && (
                    <button
                      className="absolute -right-8 top-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() =>
                        handleStartEditing(step.id, "title", step.title)
                      }
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Step Description */}
                <div className="relative group w-full">
                  {editingStep === step.id && editingField === "description" ? (
                    <textarea
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={() => handleSave(step.id)}
                      onKeyDown={(e) => handleKeyDown(e, step.id)}
                      className="text-gray-600 w-full bg-transparent border-b border-gray-300 outline-none text-center resize-none h-16"
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-600">{step.description}</p>
                  )}
                  {isAdmin && editingField !== "description" && (
                    <button
                      className="absolute -right-8 top-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() =>
                        handleStartEditing(step.id, "description", step.description)
                      }
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
