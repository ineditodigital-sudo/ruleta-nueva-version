/**
 * Componentes base del panel (estilo shadcn/ui sobre Radix + Tailwind).
 */
import { forwardRef, type ComponentProps, type HTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertPrimitive from "@radix-ui/react-alert-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* --- Button --------------------------------------------------------------- */

const buttonVariants = cva(
  "ut-press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ut-ink text-ut-paper hover:bg-ut-ink-soft",
        copper: "ut-copper text-ut-ink shadow-sm hover:brightness-105",
        blue: "bg-ut-blue text-white hover:bg-[#00548c]",
        outline: "border border-border bg-white text-foreground hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#e3e9f1]",
        ghost: "text-foreground hover:bg-secondary",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        "ghost-destructive": "text-destructive hover:bg-destructive/10",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

/* --- Card ----------------------------------------------------------------- */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-white/10 bg-card text-card-foreground shadow-[0_20px_50px_rgba(2,8,16,0.35)]",
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 px-6 pt-6", className)} {...props} />;
}
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-bold leading-tight tracking-tight", className)} {...props} />;
}
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

/* --- Form controls -------------------------------------------------------- */

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full min-w-0 rounded-lg border border-input bg-input-background px-3 py-1 text-sm text-foreground outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ut-blue-bright focus-visible:ring-[3px] focus-visible:ring-ut-blue-bright/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
      type === "color" && "h-10 cursor-pointer p-1",
      type === "file" &&
        "h-auto cursor-pointer py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-ut-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full resize-y rounded-lg border border-input bg-input-background px-3 py-2 text-sm text-foreground outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ut-blue-bright focus-visible:ring-[3px] focus-visible:ring-ut-blue-bright/20",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("flex select-none items-center gap-2 text-sm font-semibold leading-none text-foreground", className)}
      {...props}
    />
  );
}

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ut-blue-bright/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-ut-blue data-[state=unchecked]:bg-[#c6cfdb]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 rounded-full bg-white shadow-md ring-0 transition-transform data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5" />
    </SwitchPrimitive.Root>
  );
}

/** Fila de ajuste: título + ayuda a la izquierda, interruptor a la derecha. */
export function SwitchRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[#fafbfd] p-4">
      <div className="min-w-0">
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/* --- Badge ---------------------------------------------------------------- */

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ut-ink text-white",
        copper: "border-transparent bg-ut-copper text-ut-ink",
        blue: "border-transparent bg-ut-blue/10 text-ut-blue",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* --- Table ---------------------------------------------------------------- */

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}
export const TableHeader = ({ className, ...p }: ComponentProps<"thead">) => (
  <thead className={cn("[&_tr]:border-b", className)} {...p} />
);
export const TableBody = ({ className, ...p }: ComponentProps<"tbody">) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...p} />
);
export const TableRow = ({ className, ...p }: ComponentProps<"tr">) => (
  <tr className={cn("border-b border-border transition-colors hover:bg-[#f6f8fb]", className)} {...p} />
);
export const TableHead = ({ className, ...p }: ComponentProps<"th">) => (
  <th
    className={cn(
      "h-10 whitespace-nowrap px-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground",
      className,
    )}
    {...p}
  />
);
export const TableCell = ({ className, ...p }: ComponentProps<"td">) => (
  <td className={cn("px-3 py-2.5 align-middle", className)} {...p} />
);

/* --- Dialog --------------------------------------------------------------- */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

const overlay =
  "fixed inset-0 z-50 bg-ut-ink-deep/60 backdrop-blur-[2px] data-[state=open]:animate-[ut-fade_150ms_ease-out]";
const panel =
  "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border bg-white p-6 text-foreground shadow-2xl data-[state=open]:animate-[ut-fade_180ms_ease-out]";

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlay} />
      <DialogPrimitive.Content className={cn(panel, className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-80 transition-opacity hover:opacity-100">
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export const DialogHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 pr-6", className)} {...p} />
);
export const DialogFooter = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...p} />
);
export const DialogTitle = ({ className, ...p }: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title className={cn("text-lg font-bold", className)} {...p} />
);
export const DialogDescription = ({ className, ...p }: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...p} />
);

/** Menú lateral (móvil) construido con el mismo Dialog. */
export function SheetContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlay} />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-[300px] flex-col shadow-2xl data-[state=open]:animate-[ut-slide-in_220ms_cubic-bezier(0.16,1,0.3,1)]",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100">
          <X className="size-5" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* --- Confirmación --------------------------------------------------------- */

/** Diálogo de confirmación para acciones que no se pueden deshacer. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertPrimitive.Portal>
        <AlertPrimitive.Overlay className={overlay} />
        <AlertPrimitive.Content className={panel}>
          <div className="flex flex-col gap-1.5">
            <AlertPrimitive.Title className="text-lg font-bold">{title}</AlertPrimitive.Title>
            <AlertPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertPrimitive.Cancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertPrimitive.Cancel>
            <AlertPrimitive.Action asChild>
              <Button variant={destructive ? "destructive" : "copper"} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertPrimitive.Action>
          </div>
        </AlertPrimitive.Content>
      </AlertPrimitive.Portal>
    </AlertPrimitive.Root>
  );
}
