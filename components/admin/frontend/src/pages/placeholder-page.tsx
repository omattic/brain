import { Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

const copy: Record<string, { title: string; description: string }> = {
  integrations: {
    title: "Integrations Hub",
    description: "The real integrations inventory will be wired after the backend exposes a normalized admin API.",
  },
  "brain-rules": {
    title: "Brain Rules",
    description: "Rule management will be backed by the Instagram response profile tables in D1.",
  },
  security: {
    title: "Security & Access",
    description: "Security inventory and audit views need a dedicated backend surface before they become editable.",
  },
  settings: {
    title: "Platform Settings",
    description: "Global settings are intentionally hidden until there is a durable platform settings model.",
  },
};

export function PlaceholderPage({ section }: { section: keyof typeof copy }) {
  const content = copy[section];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Planned" title={content.title} description={content.description} />
      <Card className="flex min-h-[280px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Construction className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h2 className="text-xl font-semibold">Backend contract required</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          This section is present in the dashboard navigation so the shell matches the template, but it is not using mock data in production.
        </p>
      </Card>
    </div>
  );
}
