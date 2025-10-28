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
    title: "Natural Wonders",
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
      <section className="py-16 bg-gray-50 text-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">Loading content...</p>
      </section>
    );
  }

  /** 🔹 Render section */
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-flex items-center">
            {editingField?.type === "sectionTitle" ? (
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-3xl font-bold text-gray-900 mb-4 bg-transparent border-b border-gray-300 outline-none text-center w-full max-w-xl mx-auto"
              />
            ) : (
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {sectionTitle}
              </h2>
            )}
            {isAdmin && (
              <button
                onClick={() => startEditing({ type: "sectionTitle" })}
                className="ml-2 text-gray-400 hover:text-blue-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative max-w-3xl mx-auto">
            {editingField?.type === "sectionDescription" ? (
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-xl text-gray-600 w-full bg-transparent border-b border-gray-300 outline-none text-center resize-none h-16"
              />
            ) : (
              <p className="text-xl text-gray-600">{sectionDescription}</p>
            )}
            {isAdmin && (
              <button
                onClick={() => startEditing({ type: "sectionDescription" })}
                className="absolute -right-6 top-0 text-gray-400 hover:text-blue-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group relative text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>

              {/* Title */}
              <div className="relative inline-flex items-center mb-2">
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
                    className="text-xl font-semibold text-gray-900 bg-transparent border-b border-gray-300 outline-none text-center w-full"
                  />
                ) : (
                  <h3 className="text-xl font-semibold text-gray-900">
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
                    className="ml-1 text-gray-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="relative">
                {editingField?.type === "feature" &&
                editingField.id === feature.id &&
                editingField.field === "description" ? (
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="text-gray-600 w-full bg-transparent border-b border-gray-300 outline-none text-center resize-none h-16"
                  />
                ) : (
                  <p className="text-gray-600">{feature.description}</p>
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
                    className="absolute -right-4 top-0 text-gray-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
