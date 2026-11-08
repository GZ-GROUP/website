type SettingsSectionProps = {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

// A settings row: what the section is about on the left, its panel on the right.
export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  const headingId = `${id}-title`;
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-6 py-10 first:pt-0 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12"
    >
      <div>
        <h2 id={headingId} className="text-xl font-bold">
          {title}
        </h2>
        <p className="mt-2 text-base leading-7 text-muted-foreground">{description}</p>
      </div>
      <div className="bg-card p-6 md:p-8">{children}</div>
    </section>
  );
}
