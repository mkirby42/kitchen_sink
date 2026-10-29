import { PASSWORD_UPDATED_MESSAGE } from "@/lib/auth/password-reset";
import { Notice } from "@/components/ui/Notice";

/** Shown after a no-JS password update lands on the continue path (`?updated=1`). */
export function PasswordUpdatedNote() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-6">
      <Notice>{PASSWORD_UPDATED_MESSAGE}</Notice>
    </div>
  );
}
