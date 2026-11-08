import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Section } from "@/components/marketing/section";
import type { AuthorSummary } from "@/lib/content/types";

export function FeaturedMembers({ members }: { members: AuthorSummary[] }) {
  const t = useTranslations("Home.members");

  return (
    <Section id="members" title={t("title")} aside>
      <p className="reveal max-w-2xl text-base leading-7 text-muted-foreground md:text-xl md:leading-8">{t("body")}</p>

      {/* A labelled sample of the byline UI — not a real person. */}
      <figure className="reveal mt-12 bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar size="lg" aria-hidden>
            <AvatarFallback>{t("exampleName").charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xl font-bold">{t("exampleName")}</span>
          <VerifiedBadge provider="GITHUB" />
          <VerifiedBadge provider="LINKEDIN" />
        </div>
        <figcaption className="mt-4 text-sm text-muted-foreground">{t("exampleCaption")}</figcaption>
      </figure>

      {members.length === 0 ? (
        <p className="mt-10 text-base leading-7 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {members.map((member) => (
            <li key={member.username} className="flex items-center gap-4">
              <Avatar size="lg">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
                <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Link href={`/u/${member.username}`} className="font-bold hover:text-primary-ink">
                  {member.displayName}
                </Link>
                <div className="flex flex-wrap gap-2">
                  {member.verifications.map((provider) => (
                    <VerifiedBadge key={provider} provider={provider} />
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
