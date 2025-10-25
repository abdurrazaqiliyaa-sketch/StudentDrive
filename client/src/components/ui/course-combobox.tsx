import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Course } from "@shared/schema";

interface CourseComboboxProps {
  courses: Course[] | undefined;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CourseCombobox({
  courses,
  value,
  onValueChange,
  placeholder = "Select a course",
  disabled = false,
}: CourseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedCourse = courses?.find((c) => c.id === value);
  const selectedLabel = selectedCourse ? `${selectedCourse.code ? `${selectedCourse.code} - ` : ''}${selectedCourse.title}` : "";

  const filteredCourses = courses?.filter((course) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      course.title.toLowerCase().includes(searchLower) ||
      (course.code && course.code.toLowerCase().includes(searchLower)) ||
      (course.description && course.description.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? selectedLabel : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search courses..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {filteredCourses && filteredCourses.length === 0 && (
              <CommandEmpty>No course found.</CommandEmpty>
            )}
            {filteredCourses && filteredCourses.length > 0 && (
              <CommandGroup>
                <CommandItem
                  value=""
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  None (optional)
                </CommandItem>
                {filteredCourses.map((course) => (
                  <CommandItem
                    key={course.id}
                    value={course.id}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === course.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {course.code && `${course.code} - `}{course.title}
                      </span>
                      {course.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {course.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
