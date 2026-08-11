"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Clock, CalendarBlank, Plus, Trash, CheckCircle, WarningCircle,
  FloppyDisk, ArrowLeft, Info, Sun, ToggleLeft, ToggleRight
} from "@phosphor-icons/react";
import Link from "next/link";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MIN_OPTIONS = [0, 30];

function formatTime(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${m === 0 ? "00" : m} ${period}`;
}

export default function AvailabilitySettingsPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [holidayMode, setHolidayMode] = useState<boolean>(false);
  const [holidayUntil, setHolidayUntil] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "MENTOR" && user.role !== "ADMIN") {
      setLoading(false);
      return;
    }
    
    Promise.all([
      fetch("/api/mentors/availability").then(res => res.json()),
      fetch("/api/mentors/profile").then(res => res.json())
    ])
      .then(([availData, profData]) => {
        if (availData.success) setSlots(availData.slots || []);
        if (profData.profile) {
          setHolidayMode(Boolean(profData.profile.holidayMode));
          if (profData.profile.holidayUntil) {
            setHolidayUntil(new Date(profData.profile.holidayUntil).toISOString().split("T")[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const addSlot = (dayOfWeek: number) => {
    setSlots(prev => [...prev, { dayOfWeek, startHour: 9, startMin: 0, endHour: 10, endMin: 0 }]);
  };

  const removeSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: number) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const updateTime = (index: number, type: "start" | "end", timeString: string) => {
    if (!timeString) return;
    const [h, m] = timeString.split(":").map(Number);
    setSlots(prev => prev.map((s, i) => {
      if (i === index) {
        return {
          ...s,
          [`${type}Hour`]: h,
          [`${type}Min`]: m
        };
      }
      return s;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Client-side validation
    for (const slot of slots) {
      if (slot.startHour > slot.endHour || (slot.startHour === slot.endHour && slot.startMin >= slot.endMin)) {
        setMessage({ type: "error", text: `End time must be after start time for ${DAYS[slot.dayOfWeek]}.` });
        setSaving(false);
        return;
      }
    }

    try {
      const [availRes, profRes] = await Promise.all([
        fetch("/api/mentors/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots }),
        }),
        fetch("/api/mentors/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holidayMode,
            holidayUntil: holidayMode && holidayUntil ? new Date(holidayUntil).toISOString() : null,
          }),
        })
      ]);

      const availData = await availRes.json();
      const profData = await profRes.json();
      if (!availRes.ok) throw new Error(availData.error || "Save availability failed");
      if (!profRes.ok) throw new Error(profData.error || "Save profile settings failed");

      setMessage({ type: "success", text: `Availability and Holiday Mode settings saved successfully!` });
      setSlots(availData.slots || []);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/mentor-dashboard"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <ArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Availability Schedule</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Set your weekly available hours — students can only book during these times</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex sm:inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shrink-0"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><FloppyDisk weight="fill" className="text-base" /> Save Schedule</>
            )}
          </button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4">
          <Info weight="fill" className="text-indigo-500 text-xl shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
            Students will only see and be able to select time slots that fall within your availability windows. Slots outside your schedule are hard-blocked on the booking page.
          </p>
        </div>

        {/* Holiday Mode Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                <Sun weight="fill" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Holiday Mode</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Temporarily pause call bookings while on vacation or leave.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHolidayMode(!holidayMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                holidayMode
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {holidayMode ? (
                <>
                  <ToggleRight weight="fill" className="text-xl" />
                  Active
                </>
              ) : (
                <>
                  <ToggleLeft weight="fill" className="text-xl" />
                  Disabled
                </>
              )}
            </button>
          </div>

          {holidayMode && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pause bookings until:
              </label>
              <input
                type="date"
                value={holidayUntil}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setHolidayUntil(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                {holidayUntil ? `Bookings auto-resume after ${new Date(holidayUntil).toLocaleDateString()}` : "Select a return date (optional)"}
              </span>
            </div>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className={`flex items-center gap-3 rounded-2xl p-4 border font-semibold text-sm ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"}`}>
            {message.type === "success" ? <CheckCircle weight="fill" className="text-xl shrink-0" /> : <WarningCircle weight="fill" className="text-xl shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Weekly Schedule Grid */}
        <div className="space-y-4">
          {DAYS.map((day, dayIndex) => {
            const daySlots = slots.map((s, i) => ({ ...s, idx: i })).filter(s => s.dayOfWeek === dayIndex);
            return (
              <div key={day} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-black">
                      {DAY_SHORT[dayIndex]}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{day}</h3>
                    {daySlots.length === 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-600 font-medium">No availability set</span>
                    )}
                  </div>
                  <button
                    onClick={() => addSlot(dayIndex)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  >
                    <Plus weight="bold" className="text-sm" /> Add Slot
                  </button>
                </div>

                {daySlots.length > 0 && (
                  <div className="p-4 space-y-3">
                    {daySlots.map((slot) => (
                      <div key={slot.idx} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                        <Clock weight="duotone" className="text-indigo-500 text-xl shrink-0" />
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">From</label>
                          <input
                            type="time"
                            value={`${slot.startHour.toString().padStart(2, "0")}:${slot.startMin.toString().padStart(2, "0")}`}
                            onChange={(e) => updateTime(slot.idx, "start", e.target.value)}
                            className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">To</label>
                          <input
                            type="time"
                            value={`${slot.endHour.toString().padStart(2, "0")}:${slot.endMin.toString().padStart(2, "0")}`}
                            onChange={(e) => updateTime(slot.idx, "end", e.target.value)}
                            className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <CalendarBlank className="text-sm" />
                          {formatTime(slot.startHour, slot.startMin)} – {formatTime(slot.endHour, slot.endMin)}
                        </span>
                        <button
                          onClick={() => removeSlot(slot.idx)}
                          className="ml-auto p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash className="text-base" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Save Action */}
        <div className="pt-4 pb-16">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {saving ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving availability...</>
            ) : (
              <><FloppyDisk weight="fill" className="text-xl" /> Save Availability Schedule</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
