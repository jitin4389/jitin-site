"use client";

import { FileText, SunMoon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getEnabledNav } from "@/config/site";

type CommandMenuDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CommandMenuDialog({
  open,
  onOpenChange,
}: CommandMenuDialogProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command menu"
      description="Jump to a page or change the theme"
    >
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            {getEnabledNav().map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => run(() => router.push(item.href))}
              >
                <FileText aria-hidden="true" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Preferences">
            <CommandItem
              onSelect={() =>
                run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
              }
            >
              <SunMoon aria-hidden="true" />
              Toggle theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
