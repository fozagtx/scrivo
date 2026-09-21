import { cn } from "@/lib/utils";
import { toolLogo } from "@/lib/tool-logos";

export function ToolMark({
  slug,
  mark,
  name,
  className,
}: {
  slug?: string | null;
  mark?: string | null;
  name: string;
  className?: string;
}) {
  const logo = toolLogo(slug);
  if (!logo) return <>{mark ?? name[0]}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={`${name} logo`}
      className={cn("size-5 object-contain", className)}
    />
  );
}
