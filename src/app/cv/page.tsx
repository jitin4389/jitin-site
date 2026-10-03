import { Download } from "lucide-react";

import { CvDocument } from "@/components/profile/cv-document";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "CV",
  description: "CV of Jitin Gupta, Applied AI Architect.",
  path: "/cv",
});

export default function CvPage() {
  return (
    <main className="flex-1 bg-muted/40 px-2 py-8 sm:px-4 sm:py-12 print:bg-transparent print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end print:hidden">
        <Button asChild>
          <a href={siteConfig.cvPdf} download>
            <Download aria-hidden="true" />
            Download PDF
          </a>
        </Button>
      </div>
      <CvDocument />
    </main>
  );
}
