export interface AvailabilitySlotInput {
  dayOfWeek: number;
  startHour: number;
  startMin?: number;
  endHour: number;
  endMin?: number;
  isActive?: boolean;
}

/**
 * Parses any day string/number into dayOfWeek (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function parseDayOfWeek(day: string | number): number | null {
  if (typeof day === "number" && day >= 0 && day <= 6) return day;
  const d = String(day).trim().toLowerCase();
  if (d.startsWith("sun") || d === "0") return 0;
  if (d.startsWith("mon") || d === "1") return 1;
  if (d.startsWith("tue") || d === "2") return 2;
  if (d.startsWith("wed") || d === "3") return 3;
  if (d.startsWith("thu") || d === "4") return 4;
  if (d.startsWith("fri") || d === "5") return 5;
  if (d.startsWith("sat") || d === "6") return 6;
  return null;
}

/**
 * Parses "HH:mm" or "H:m" into { hour: number, minute: number }
 */
export function parseTimeStr(timeStr: string, defaultHour: number, defaultMin: number = 0) {
  if (!timeStr || typeof timeStr !== "string") {
    return { hour: defaultHour, minute: defaultMin };
  }
  const parts = timeStr.split(":").map(p => parseInt(p.trim(), 10));
  const hour = !isNaN(parts[0]) ? Math.max(0, Math.min(23, parts[0])) : defaultHour;
  const minute = !isNaN(parts[1]) ? Math.max(0, Math.min(59, parts[1])) : defaultMin;
  return { hour, minute };
}

/**
 * Converts various availability formats (e.g. onboarding { days: [...], from: "09:00", to: "18:00" }
 * or slot arrays) into standard AvailabilitySlotInput array.
 */
export function parseAvailabilityToSlots(availability: any): AvailabilitySlotInput[] {
  if (!availability) return [];

  // If already an array of slots
  if (Array.isArray(availability)) {
    const slots: AvailabilitySlotInput[] = [];
    for (const item of availability) {
      const day = parseDayOfWeek(item.dayOfWeek ?? item.day);
      if (day === null) continue;
      const startHour = Number(item.startHour ?? 9);
      const startMin = Number(item.startMin ?? 0);
      const endHour = Number(item.endHour ?? 18);
      const endMin = Number(item.endMin ?? 0);

      if (
        startHour >= 0 && startHour <= 23 &&
        endHour >= 0 && endHour <= 23 &&
        (startHour < endHour || (startHour === endHour && startMin < endMin))
      ) {
        slots.push({
          dayOfWeek: day,
          startHour,
          startMin,
          endHour,
          endMin,
          isActive: item.isActive !== false,
        });
      }
    }
    return slots;
  }

  // If object with days array: { days: ["Mon", "Tue"], from: "09:00", to: "18:00" }
  if (typeof availability === "object") {
    const days = Array.isArray(availability.days) ? availability.days : [];
    const from = parseTimeStr(availability.from, 9, 0);
    const to = parseTimeStr(availability.to, 18, 0);

    const slots: AvailabilitySlotInput[] = [];
    for (const dayItem of days) {
      const day = parseDayOfWeek(dayItem);
      if (day === null) continue;

      if (from.hour < to.hour || (from.hour === to.hour && from.minute < to.minute)) {
        slots.push({
          dayOfWeek: day,
          startHour: from.hour,
          startMin: from.minute,
          endHour: to.hour,
          endMin: to.minute,
          isActive: true,
        });
      }
    }
    return slots;
  }

  return [];
}

/**
 * Synchronizes mentor_availability table with the given slots or availability JSON.
 */
export async function syncMentorAvailability(
  db: any,
  mentorProfileId: string,
  availabilityData: any
) {
  const slots = parseAvailabilityToSlots(availabilityData);

  // Replace existing slots atomically
  await db.mentorAvailability.deleteMany({
    where: { mentorId: mentorProfileId },
  });

  if (slots.length > 0) {
    await db.mentorAvailability.createMany({
      data: slots.map((s) => ({
        mentorId: mentorProfileId,
        dayOfWeek: s.dayOfWeek,
        startHour: s.startHour,
        startMin: s.startMin ?? 0,
        endHour: s.endHour,
        endMin: s.endMin ?? 0,
        isActive: s.isActive !== false,
      })),
    });
  }

  return slots;
}

/**
 * Fetches mentor availability slots. If no records exist in mentor_availability table,
 * automatically generates them from mentorProfile.availability JSON and persists them.
 */
export async function getOrSyncMentorAvailability(
  db: any,
  mentorProfile: { id: string; availability?: any }
) {
  let slots = await db.mentorAvailability.findMany({
    where: { mentorId: mentorProfile.id, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }, { startMin: "asc" }],
  });

  // If table is empty but JSON availability exists on mentor profile, auto-sync and persist
  if (slots.length === 0 && mentorProfile.availability) {
    const parsedSlots = parseAvailabilityToSlots(mentorProfile.availability);
    if (parsedSlots.length > 0) {
      await db.mentorAvailability.createMany({
        data: parsedSlots.map((s) => ({
          mentorId: mentorProfile.id,
          dayOfWeek: s.dayOfWeek,
          startHour: s.startHour,
          startMin: s.startMin ?? 0,
          endHour: s.endHour,
          endMin: s.endMin ?? 0,
          isActive: true,
        })),
      });

      slots = await db.mentorAvailability.findMany({
        where: { mentorId: mentorProfile.id, isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }, { startMin: "asc" }],
      });
    }
  }

  return slots;
}
