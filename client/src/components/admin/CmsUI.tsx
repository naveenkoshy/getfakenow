import { ReactNode, useState } from "react";
import { HelpCircle, AlertTriangle, PackageOpen, FileX, Users, Inbox, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────
   PAGE HEADER
   Consistent title + description + actions bar
   ───────────────────────────────────────────── */
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode; // action buttons
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HELP TEXT / FIELD HELP
   Contextual help below form fields or sections
   ───────────────────────────────────────────── */
interface HelpTextProps {
  children: ReactNode;
  className?: string;
}

export function HelpText({ children, className = "" }: HelpTextProps) {
  return (
    <p className={`text-xs text-gray-400 mt-1 flex items-start gap-1 ${className}`}>
      <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/* ─────────────────────────────────────────────
   HELP BANNER
   Collapsible contextual help card for page tops
   ───────────────────────────────────────────── */
interface HelpBannerProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function HelpBanner({ title, children, defaultOpen = true }: HelpBannerProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="py-3 px-4 text-sm text-blue-800">
        <button
          type="button"
          className="w-full flex items-center justify-between font-medium"
          onClick={() => setOpen(!open)}
        >
          <span className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4" /> {title}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {open && <div className="mt-1 text-blue-700">{children}</div>}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   FORM FIELD WRAPPER
   Label + input + help text + error in one unit
   ───────────────────────────────────────────── */
interface FormFieldProps {
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, required, help, error, children, className = "" }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {help && !error && <HelpText>{help}</HelpText>}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONFIRM DIALOG
   Reusable AlertDialog for destructive actions
   ───────────────────────────────────────────── */
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            {loading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ─────────────────────────────────────────────
   STATUS BADGE
   Consistent color-coded status indicators
   ───────────────────────────────────────────── */
type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "purple";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  error: "bg-red-100 text-red-700 border-red-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ variant, children, dot = false, className = "" }: StatusBadgeProps) {
  return (
    <Badge className={`${BADGE_STYLES[variant]} font-medium text-xs ${className}`}>
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
            variant === "success" ? "bg-green-500" :
            variant === "warning" ? "bg-yellow-500" :
            variant === "error" ? "bg-red-500" :
            variant === "info" ? "bg-blue-500" :
            variant === "purple" ? "bg-purple-500" :
            "bg-gray-500"
          }`}
        />
      )}
      {children}
    </Badge>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
   Consistent empty/zero-data placeholder
   ───────────────────────────────────────────── */
type EmptyIcon = "package" | "file" | "users" | "inbox";

const EMPTY_ICONS: Record<EmptyIcon, typeof PackageOpen> = {
  package: PackageOpen,
  file: FileX,
  users: Users,
  inbox: Inbox,
};

interface EmptyStateProps {
  icon?: EmptyIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  const Icon = EMPTY_ICONS[icon];
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
      )}
      {action && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATS CARD
   Consistent metric display card
   ───────────────────────────────────────────── */
interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatsCard({ label, value, icon, trend, className = "" }: StatsCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trend.positive ? "text-green-600" : "text-red-600"}`}>
          {trend.positive ? "+" : ""}{trend.value}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TABLE WRAPPER
   Consistent table container with header styling
   ───────────────────────────────────────────── */
interface TableWrapperProps {
  children: ReactNode;
  className?: string;
}

export function TableWrapper({ children, className = "" }: TableWrapperProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION HEADER
   For sub-sections within a page
   ───────────────────────────────────────────── */
interface SectionHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function SectionHeader({ title, description, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
