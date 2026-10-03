"use client";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";

// The dialog (cmdk + Radix) loads only after the first open, keeping it out of the initial bundle.
const CommandMenuDialog = dynamic(
  () => import("@/components/site/command-menu-dialog"),
  {
    ssr: false,
  },
);

const noopSubscribe = () => () => {};
const getShortcutLabel = () =>
  /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Radix only restores focus to its own <DialogTrigger>, so remember and restore it ourselves.
  const returnFocusTo = useRef<HTMLElement | null>(null);
  // Server renders "⌘K"; the client swaps in the platform's label after hydration.
  const shortcut = useSyncExternalStore(
    noopSubscribe,
    getShortcutLabel,
    () => "⌘K",
  );

  const handleOpenChange = useCallback((next: boolean) => {
    if (next) {
      returnFocusTo.current = document.activeElement as HTMLElement | null;
      setLoaded(true);
    } else {
      requestAnimationFrame(() => returnFocusTo.current?.focus());
    }
    setOpen(next);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleOpenChange]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-label="Open command menu"
        aria-keyshortcuts="Meta+K Control+K"
        className="text-muted-foreground"
        onClick={() => handleOpenChange(true)}
      >
        <Search aria-hidden="true" />
        <kbd className="hidden font-sans text-xs sm:inline">{shortcut}</kbd>
      </Button>
      {loaded && (
        <CommandMenuDialog open={open} onOpenChange={handleOpenChange} />
      )}
    </>
  );
}
