import { About } from "@/components/profile/about";
import { Contact } from "@/components/profile/contact";
import { Experience } from "@/components/profile/experience";
import { Hero } from "@/components/profile/hero";
import { Skills } from "@/components/profile/skills";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({ path: "/" });

export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <div className="mx-auto max-w-5xl divide-y divide-border/60 px-4">
        <About />
        <Experience />
        <Skills />
        <Contact />
      </div>
    </main>
  );
}
