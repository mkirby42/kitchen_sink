import { softTagClass } from "@/components/ui/styles";
import { NOT_ACCEPTING_CLIENTS_LABEL } from "@/lib/therapists/listing";

/** Closed practices only. An open practice renders nothing. */
export function NotAcceptingClients({
  open,
  className,
}: {
  open: boolean | null | undefined;
  className?: string;
}) {
  if (open !== false) return null;

  return (
    <p className={className} data-accepting-clients="closed">
      <span className={softTagClass} role="status">
        {NOT_ACCEPTING_CLIENTS_LABEL}
      </span>
    </p>
  );
}
