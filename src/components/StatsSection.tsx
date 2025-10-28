"use client";

import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface StatItem {
  id: number;
  number: string;
  label: string;
}

const DEFAULT_STATS: StatItem[] = [
  { id: 1, number: "50+", label: "Tourist Spots" },
  { id: 2, number: "25+", label: "Accommodations" },
  { id: 3, number: "15+", label: "Restaurants" },
  { id: 4, number: "1000+", label: "Happy Visitors" },
];

const StatsSection: React.FC = () => {
  const { isAdmin, currentUser } = useAuth() || {};
  const [stats, setStats] = useState<StatItem[]>(DEFAULT_STATS);
  const [editingStat, setEditingStat] = useState<{ id: number; field: "number" | "label" } | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [loading, setLoading] = useState(true);

  const docRef = doc(db, "statsSection", "main");

  /** 🔹 Load stats from Firestore */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setStats(data.stats || DEFAULT_STATS);
        } else {
          // Create default if missing
          await setDoc(docRef, {
            stats: DEFAULT_STATS,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Error loading stats section:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  /** 🔹 Save updated stats to Firestore */
  const saveStats = async (updatedStats: StatItem[]) => {
    if (!isAdmin) {
      console.warn("Write denied: not admin");
      return;
    }
    try {
      await setDoc(
        docRef,
        {
          stats: updatedStats,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentUser?.email || "anonymous",
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error saving stats:", err);
    }
  };

  /** 🔹 Handle text changes */
  const handleStatChange = (id: number, field: "number" | "label", value: string) => {
    const updated = stats.map((stat) => (stat.id === id ? { ...stat, [field]: value } : stat));
    setStats(updated);
    saveStats(updated);
  };

  /** 🔹 Editing Handlers */
  const startEditing = (id: number, field: "number" | "label", value: string) => {
    setEditingStat({ id, field });
    setTempValue(value);
  };

  const saveEdit = () => {
    if (!editingStat) return;
    handleStatChange(editingStat.id, editingStat.field, tempValue);
    setEditingStat(null);
    setTempValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    else if (e.key === "Escape") {
      setEditingStat(null);
      setTempValue("");
    }
  };

  if (loading) {
    return (
      <section className="py-16 text-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-500 rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">Loading stats...</p>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.id} className="p-6 bg-white rounded-lg shadow-md group relative">
              {/* Number */}
              <div className="text-3xl font-bold text-indigo-600 mb-2 relative inline-flex items-center">
                {editingStat?.id === stat.id && editingStat.field === "number" ? (
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    className="w-full text-center bg-transparent border-b border-gray-300 outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="mr-1">{stat.number}</span>
                )}
                {isAdmin && (!editingStat || editingStat.id !== stat.id || editingStat.field !== "number") && (
                  <button
                    onClick={() => startEditing(stat.id, "number", stat.number)}
                    className="p-0.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Edit number"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Label */}
              <div className="mt-2 text-sm font-medium text-gray-500 relative">
                {editingStat?.id === stat.id && editingStat.field === "label" ? (
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    className="w-full text-center bg-transparent border-b border-gray-300 outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    onClick={() => isAdmin && startEditing(stat.id, "label", stat.label)}
                  >
                    {stat.label}
                  </span>
                )}
                {isAdmin && (!editingStat || editingStat.id !== stat.id || editingStat.field !== "label") && (
                  <button
                    onClick={() => startEditing(stat.id, "label", stat.label)}
                    className="ml-1 p-0.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Edit label"
                  >
                    <Pencil className="w-3 h-3" />
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

export default StatsSection;
