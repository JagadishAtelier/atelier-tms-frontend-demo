import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    className?: string;
    disablePastDates?: boolean;
}

export function DateTimePicker({
    date,
    setDate,
    className,
    disablePastDates = true,
}: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);

    // Sync internal state with prop
    React.useEffect(() => {
        setSelectedDate(date);
    }, [date]);

    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            if (!selectedDate) {
                // Default to 6:00 PM for new selection
                newDate.setHours(18, 0, 0, 0);
            } else {
                // Preserve existing time
                newDate.setHours(selectedDate.getHours());
                newDate.setMinutes(selectedDate.getMinutes());
            }
            setSelectedDate(newDate);
            setDate(newDate);
        } else {
            setSelectedDate(undefined);
            setDate(undefined);
        }
    };

    // Helper to generate time options
    const hours12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1, 2, ..., 12
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ...

    const handleTimeChange = (type: "hour" | "minute" | "ampm", value: string) => {
        if (!selectedDate) return;
        const newDate = new Date(selectedDate);

        if (type === "hour") {
            const currentHours = newDate.getHours();
            const isPM = currentHours >= 12;
            let newHour = parseInt(value);
            if (newHour === 12) newHour = 0; // 12 AM/PM logic base
            if (isPM) newHour += 12; // Maintain PM
            newDate.setHours(newHour);
        } else if (type === "minute") {
            newDate.setMinutes(parseInt(value));
        } else if (type === "ampm") {
            const currentHours = newDate.getHours();
            if (value === "PM" && currentHours < 12) {
                newDate.setHours(currentHours + 12);
            } else if (value === "AM" && currentHours >= 12) {
                newDate.setHours(currentHours - 12);
            }
        }

        setSelectedDate(newDate);
        setDate(newDate);
    };

    // derived values for UI
    const get12Hour = (date: Date) => {
        const h = date.getHours();
        if (h === 0) return 12;
        if (h > 12) return h - 12;
        return h;
    };

    const getAmPm = (date: Date) => {
        return date.getHours() >= 12 ? "PM" : "AM";
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-xs text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP p") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    disabled={disablePastDates ? (date) => date < new Date(new Date().setHours(0, 0, 0, 0)) : undefined}
                />
                <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={selectedDate ? get12Hour(selectedDate).toString() : "12"}
                            onValueChange={(val) => handleTimeChange("hour", val)}
                            disabled={!selectedDate}
                        >
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                                {hours12.map((h) => (
                                    <SelectItem key={h} value={h.toString()}>
                                        {h.toString().padStart(2, "0")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span>:</span>
                        <Select
                            value={selectedDate ? (Math.floor(selectedDate.getMinutes() / 5) * 5).toString() : "0"}
                            onValueChange={(val) => handleTimeChange("minute", val)}
                            disabled={!selectedDate}
                        >
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                                {minutes.map((m) => (
                                    <SelectItem key={m} value={m.toString()}>
                                        {m.toString().padStart(2, "0")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={selectedDate ? getAmPm(selectedDate) : "AM"}
                            onValueChange={(val) => handleTimeChange("ampm", val)}
                            disabled={!selectedDate}
                        >
                            <SelectTrigger className="w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AM">AM</SelectItem>
                                <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
