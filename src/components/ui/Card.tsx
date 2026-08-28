import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "gradient";
  hover?: boolean;
}

export function Card({ children, variant = "default", hover = false, className, ...props }: CardProps) {
  const variants = {
    default: "bg-white shadow-sm",
    elevated: "bg-white shadow-lg",
    bordered: "bg-white border border-gray-200",
    gradient: "bg-gradient-to-br from-white to-gray-50 shadow-md",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-5 transition-all duration-200",
        variants[variant],
        hover && "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "brand";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm", className, ...props }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    brand: "bg-bangladesh-green/10 text-bangladesh-green",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn("inline-flex items-center font-medium rounded-full", variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", sizes[size])}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-bangladesh-green text-white flex items-center justify-center font-semibold",
        sizes[size]
      )}
    >
      {initials}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("bg-gray-200 rounded h-4", className)}
          style={{ width: `${100 - Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}

interface DataStatusBadgeProps {
  status: "LIVE" | "ESTIMATED" | "VERIFIED" | "LAST_UPDATED";
}

export function DataStatusBadge({ status }: DataStatusBadgeProps) {
  const config = {
    LIVE: { label: "LIVE", className: "bg-green-500 text-white" },
    ESTIMATED: { label: "ESTIMATED", className: "bg-yellow-500 text-white" },
    VERIFIED: { label: "VERIFIED", className: "bg-blue-500 text-white" },
    LAST_UPDATED: { label: "LAST UPDATED", className: "bg-gray-500 text-white" },
  };

  const { label, className } = config[status];

  return (
    <span className={cn("px-1.5 py-0.5 text-[10px] font-bold rounded", className)}>
      {label}
    </span>
  );
}
