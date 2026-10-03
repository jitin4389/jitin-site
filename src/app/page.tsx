import { ThemeToggle } from "@/components/site/theme-toggle";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-4">
      {/* Temporary: the toggle moves into the site header in T5. */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">Jitin Gupta</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Applied AI Architect. Site coming soon.
      </p>
    </main>
  );
}
