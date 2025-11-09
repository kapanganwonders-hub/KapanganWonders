"use client";

import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

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
  const [features, setFeatures] = useState<Feature[]>([]);
  const [sectionTitle, setSectionTitle] = useState("Why Choose Kapangan?");
  const [sectionDescription, setSectionDescription] = useState(
    "Experience the perfect blend of natural beauty, cultural richness, and warm hospitality."
  );
  const [isLoading, setIsLoading] = useState(true);

  /** 🔹 Firestore document reference */
  const docRef = doc(db, "whyChooseSection", "main");

  /** 🔹 Load data safely from Firestore */
  useEffect(() => {
    const loadData = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setSectionTitle(data.title || sectionTitle);
          setSectionDescription(data.description || sectionDescription);
          setFeatures(data.features || defaultFeatures);
        } else {
          // ✅ Create document if not found (initial setup)
          await setDoc(docRef, {
            title: sectionTitle,
            description: sectionDescription,
            features: defaultFeatures,
            createdAt: new Date().toISOString(),
          });
          setFeatures(defaultFeatures);
        }
      } catch (error) {
        console.error("Error loading Why Choose section:", error);
        setFeatures(defaultFeatures);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  /** 🔹 Safe save with admin check */
  const saveData = async (
    newTitle?: string,
    newDescription?: string,
    newFeatures?: Feature[]
  ) => {
    if (!isAdmin) {
      console.warn("Write denied: user is not admin.");
      return;
    }

    try {
      await setDoc(
        docRef,
        {
          title: newTitle ?? sectionTitle,
          description: newDescription ?? sectionDescription,
          features: newFeatures ?? features,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentUser?.email || "anonymous",
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving Why Choose section:", error);
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

  return (
    <section className="relative py-20 min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/Kapangan.jpg"
          alt="Kapangan Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-green-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slower"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Title */}
          <div className="relative inline-flex items-center justify-center mb-6">
            {editingField?.type === "sectionTitle" ? (
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-4xl md:text-5xl font-bold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-6 outline-none text-center w-full max-w-2xl mx-auto placeholder-white/60 font-serif"
                placeholder="Enter section title..."
              />
            ) : (
              <h2 className="text-4xl md:text-5xl font-bold text-white font-serif">
                {sectionTitle}
              </h2>
            )}
            {isAdmin && (
              <button
                onClick={() => startEditing({ type: "sectionTitle" })}
                className="ml-4 text-white/60 hover:text-white transition-all duration-300 bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40"
              >
                <Pencil className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Description */}
          <div className="relative max-w-3xl mx-auto">
            {editingField?.type === "sectionDescription" ? (
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-xl text-white/90 w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 outline-none text-center resize-none h-24 placeholder-white/60 font-sans"
                placeholder="Enter section description..."
              />
            ) : (
              <p className="text-xl text-white/90 leading-relaxed font-sans">
                {sectionDescription}
              </p>
            )}
            {isAdmin && (
              <button
                onClick={() => startEditing({ type: "sectionDescription" })}
                className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-all duration-300 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Decorative Line */}
          <div className="w-32 h-1 bg-gradient-to-r from-white/50 to-white mx-auto mt-8 rounded-full"></div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group relative text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 hover:bg-white/15"
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              
              {/* Floating Border Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-20"></div>

              {/* Feature Icon */}
              <div className="text-5xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Title */}
              <div className="relative inline-flex items-center justify-center mb-4 min-h-[3rem]">
                {editingField?.type === "feature" &&
                editingField.id === feature.id &&
                editingField.field === "title" ? (
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="text-xl font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 outline-none text-center w-full placeholder-white/60"
                    placeholder="Enter feature title..."
                  />
                ) : (
                  <h3 className="text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                )}
                {isAdmin && (
                  <button
                    onClick={() =>
                      startEditing({
                        type: "feature",
                        id: feature.id,
                        field: "title",
                      })
                    }
                    className="ml-2 text-white/60 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="relative min-h-[6rem]">
                {editingField?.type === "feature" &&
                editingField.id === feature.id &&
                editingField.field === "description" ? (
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="text-white/80 w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 outline-none text-center resize-none h-24 placeholder-white/60 font-sans"
                    placeholder="Enter feature description..."
                  />
                ) : (
                  <p className="text-white/80 leading-relaxed font-sans">
                    {feature.description}
                  </p>
                )}
                {isAdmin && (
                  <button
                    onClick={() =>
                      startEditing({
                        type: "feature",
                        id: feature.id,
                        field: "description",
                      })
                    }
                    className="absolute -right-8 top-0 text-white/60 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Hover Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:w-16"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-pulse-slower {
          animation: pulse-slower 12s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default WhyChooseSection;