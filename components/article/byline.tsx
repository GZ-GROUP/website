import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import type { AuthorSummary } from "@/lib/content/types";

// Article authorship: each person with their verified identities (ADR 0002).
export function Byline({ author, coAuthors }: { author: AuthorSummary; coAuthors: AuthorSummary[] }) {
  const t = useTranslations("ArticlePage");
  const people = [author, ...coAuthors];

  return (
    <section aria-label={t("authors")}>
      <ul className="flex flex-col gap-4">
        {people.map((person) => (
          <li key={person.username} className="flex items-center gap-3">
            <Avatar size="lg">
              {person.avatarUrl && <AvatarImage src={person.avatarUrl} alt="" />}
              <AvatarFallback>{person.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {person.username ? (
                <Link href={`/u/${person.username}`} className="font-bold hover:text-primary-ink">
                  {person.displayName}
                </Link>
              ) : (
                <span className="font-bold">{person.displayName}</span>
              )}
              {person.verifications.map((provider) => (
                <VerifiedBadge key={provider} provider={provider} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
