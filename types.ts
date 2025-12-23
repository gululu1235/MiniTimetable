
export interface TimetableEvent {
  id: string;
  title: string;
  startTime: number; // minutes from midnight
  duration: number; // in minutes
  color: string;
  emoji: string;
  usageCount: number;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  startHour: number; // 0-23
  endHour: number; // 0-23
  events: TimetableEvent[];
}

export type DurationOption = 15 | 30 | 60 | 90 | 120;

export const DURATION_LABELS: Record<DurationOption, string> = {
  15: "15m",
  30: "30m",
  60: "1h",
  90: "1.5h",
  120: "2h"
};

export const PASTEL_COLORS = [
  "#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF", "#BDB2FF", "#FFC6FF"
];
