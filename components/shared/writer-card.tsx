import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import type { AuthorSummary } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/** A person credited on GZ Group's work: identity first, optional details under it. */
export function WriterCard({
  member,
  prominent,
  children,
}: {
  member: AuthorSummary;
  /** The person is the subject of the page (/team), not a credit beside other content. */
  prominent?: boolean;
  children?: React.ReactNode;
}) {
  const name = cn("font-bold", prominent && "text-xl leading-8");

  return (
    <div className="flex items-start gap-4">
      <Avatar size="lg">
        {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
        <AvatarFallback className={prominent ? "text-xl font-bold" : undefined}>
          {member.displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-2">
        {member.username ? (
          <Link href={`/u/${member.username}`} className={cn(name, "hover:text-primary-ink")}>
            {member.displayName}
          </Link>
        ) : (
          <span className={name}>{member.displayName}</span>
        )}
        {member.verifications.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {member.verifications.map((provider) => (
              <VerifiedBadge key={provider} provider={provider} />
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
