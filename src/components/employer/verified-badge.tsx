import { Check, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function VerifiedBadge({ status = "verified" }: { status?: "pending" | "verified" | "rejected" }) {
  if (status === "pending")
    return (
      <Badge variant="accent">
        <Clock strokeWidth={3} aria-hidden="true" /> Em verificação
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="destructive">
        <X strokeWidth={3} aria-hidden="true" /> Não aprovada
      </Badge>
    );
  return (
    <Badge variant="success">
      <Check strokeWidth={3.6} aria-hidden="true" /> Empresa Comprometida
    </Badge>
  );
}
