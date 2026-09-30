"use client";

import { cn } from "@/lib/utils";

interface ItemCalendarProps {
  rentals: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
    customerName: string;
  }[];
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const formatDayOfMonth = new Intl.DateTimeFormat("pl-PL", { day: "numeric" }).format;
const formatMonthShort = new Intl.DateTimeFormat("pl-PL", { month: "short" }).format;
const formatFullDate = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format;

export function ItemCalendar({ rentals }: ItemCalendarProps) {
  const today = startOfDay(new Date());
  
  // Find previous week's Monday
  const dayOfWeek = today.getDay(); // 0 is Sunday
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisWeekMonday = new Date(today);
  thisWeekMonday.setDate(today.getDate() - daysToMonday);

  const startDate = new Date(thisWeekMonday);
  startDate.setDate(thisWeekMonday.getDate() - 7); // 1 week back

  const days: Date[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  const weeks = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(days.slice(i * 7, i * 7 + 7));
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="font-semibold text-lg">Dostępność w najbliższym czasie</h3>
        <p className="text-sm text-muted-foreground">
          {formatFullDate(startDate)} - {formatFullDate(days[27])}
        </p>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header Row */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"].map((day) => (
              <div key={day} className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          {/* Weeks Grid */}
          <div className="grid grid-cols-1 gap-2">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 gap-2">
                {week.map((day, dIdx) => {
                  const isTodayStr = isSameDay(day, today);
                  const dayStart = startOfDay(day);
                  const dayEnd = endOfDay(day);
                  
                  // Find if any rental overlaps with this day
                  const activeRental = rentals.find(r => {
                    const rStart = new Date(r.startDate);
                    const rEnd = new Date(r.endDate);
                    return rStart <= dayEnd && rEnd >= dayStart && r.status !== "CANCELLED";
                  });

                  return (
                    <div 
                      key={dIdx} 
                      className={cn(
                        "relative flex flex-col items-center justify-center p-2 rounded-md border min-h-[80px] transition-colors",
                        isTodayStr ? "ring-2 ring-primary ring-offset-1 bg-primary/5" : "bg-card",
                        activeRental ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900" : "border-border hover:bg-muted/50"
                      )}
                      title={activeRental ? `Wypożyczone: ${activeRental.customerName}` : "Dostępne"}
                    >
                      <span className={cn(
                        "text-sm font-semibold",
                        activeRental ? "text-red-700 dark:text-red-400" : "text-foreground",
                        isTodayStr && !activeRental && "text-primary"
                      )}>
                        {formatDayOfMonth(day)}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {formatMonthShort(day)}
                      </span>
                      {activeRental && (
                        <div className="absolute bottom-2 left-1 right-1 text-[9px] font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 rounded px-1 truncate text-center" title={activeRental.customerName}>
                          {activeRental.customerName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 p-4 border-t bg-muted/10 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border bg-card"></div>
          <span>Dostępne</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"></div>
          <span>Wypożyczone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm ring-2 ring-primary ring-offset-1 bg-primary/5"></div>
          <span>Dzisiaj</span>
        </div>
      </div>
    </div>
  );
}