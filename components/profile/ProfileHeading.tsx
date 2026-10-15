import { profileSectionHeadingClass } from "@/components/ui/styles";

export function ProfileHeading({ children }: { children: string }) {
  return <h2 className={profileSectionHeadingClass}>{children}</h2>;
}
