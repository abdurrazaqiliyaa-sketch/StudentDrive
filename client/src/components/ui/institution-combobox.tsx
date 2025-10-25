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
import type { Institution } from "@shared/schema";

interface InstitutionComboboxProps {
  institutions: Institution[] | undefined;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function InstitutionCombobox({
  institutions,
  value,
  onValueChange,
  placeholder = "Select your institution",
  disabled = false,
}: InstitutionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedInstitution = institutions?.find((i) => i.id === value);
  const selectedLabel = selectedInstitution?.name || "No institution";

  const filteredInstitutions = institutions?.filter((institution) =>
    institution.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const shouldShowResults = searchTerm.length >= 3 || searchTerm.length === 0;

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
          {value
            ? selectedLabel
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type at least 3 letters to search..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {!shouldShowResults && searchTerm.length > 0 && searchTerm.length < 3 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 3 letters to search
              </div>
            )}
            {shouldShowResults && filteredInstitutions && filteredInstitutions.length === 0 && (
              <CommandEmpty>No institution found.</CommandEmpty>
            )}
            {shouldShowResults && filteredInstitutions && filteredInstitutions.length > 0 && (
              <CommandGroup>
                <CommandItem
                  value="no-institution"
                  onSelect={() => {
                    onValueChange("no-institution");
                    setOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "no-institution" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  No institution
                </CommandItem>
                {filteredInstitutions.map((institution) => (
                  <CommandItem
                    key={institution.id}
                    value={institution.id}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === institution.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {institution.name}
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
