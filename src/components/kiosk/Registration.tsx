import { useState, type KeyboardEvent } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { ArrowRight, Check, Mail, Phone, User, type LucideIcon } from "lucide-react";
import { BrandLockup } from "@/components/brand/Brand";
import { playTap } from "@/lib/sound";
import { useApp, useThemeName } from "@/state/AppProvider";

export interface FormData {
  name: string;
  email: string;
  phone: string;
  acceptedTerms: boolean;
}

export const EMPTY_FORM: FormData = { name: "", email: "", phone: "", acceptedTerms: false };

type Errors = Partial<Record<keyof FormData, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validate(form: FormData): Errors {
  const e: Errors = {};
  if (form.name.trim().length < 3) e.name = "Escribe tu nombre para continuar";
  if (!form.email.trim()) e.email = "Escribe tu correo para continuar";
  else if (!EMAIL_RE.test(form.email.trim())) e.email = "Falta el @ o el dominio. Ejemplo: nombre@correo.com";
  const digits = form.phone.replace(/\D/g, "");
  if (!digits) e.phone = "Escribe tu teléfono para continuar";
  else if (digits.length < 10 || digits.length > 13) e.phone = "Revisa tu teléfono: deben ser 10 dígitos";
  if (!form.acceptedTerms) e.acceptedTerms = "Marca la casilla para poder participar";
  return e;
}

export default function Registration({
  form,
  onChange,
  onSubmit,
}: {
  form: FormData;
  onChange: (f: FormData) => void;
  onSubmit: () => void;
}) {
  const { state } = useApp();
  const theme = useThemeName();
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    onChange({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const submit = () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      if (state.gameConfig.enableSounds) playTap();
      (document.activeElement as HTMLElement | null)?.blur();
      onSubmit();
    }
  };

  const onEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex h-full flex-col items-center px-[84px] pt-[96px] pb-[64px]">
      <BrandLockup size={104} tone={theme === "light" ? "dark" : "light"} className="h-[104px]" />

      <div className="flex w-full flex-1 flex-col justify-center">
        <h1 className="text-balance text-center text-[72px] font-extrabold leading-[1.06] tracking-[-0.03em] text-k-text">
          {state.messages.welcome}
        </h1>
        <p className="mt-[22px] text-center text-[30px] leading-[1.45] text-k-muted">{state.messages.formSubtitle}</p>

        <div className="ut-panel mt-[64px] w-full p-[60px]">
          <div className="flex flex-col gap-[36px]">
            <Field
              id="name"
              icon={User}
              label="Nombre completo"
              placeholder="Escribe tu nombre"
              value={form.name}
              error={errors.name}
              autoComplete="name"
              onChange={(v) => set("name", v)}
              onKeyDown={onEnter}
            />
            <Field
              id="email"
              icon={Mail}
              label="Correo electrónico"
              type="email"
              inputMode="email"
              placeholder="nombre@correo.com"
              value={form.email}
              error={errors.email}
              autoComplete="email"
              onChange={(v) => set("email", v)}
              onKeyDown={onEnter}
            />
            <Field
              id="phone"
              icon={Phone}
              label="Teléfono / WhatsApp"
              type="tel"
              inputMode="tel"
              placeholder="449 000 0000"
              value={form.phone}
              error={errors.phone}
              autoComplete="tel"
              maxLength={20}
              onChange={(v) => set("phone", v)}
              onKeyDown={onEnter}
            />

            <div className="mt-[4px]">
              <label
                htmlFor="terms"
                className="flex cursor-pointer items-start gap-[24px] rounded-[var(--ut-radius-sm)] bg-k-surface-deep p-[28px] ring-1 ring-inset"
                style={{ ["--tw-ring-color" as string]: errors.acceptedTerms ? "var(--ut-danger)" : "var(--ut-line)" }}
              >
                <Checkbox.Root
                  id="terms"
                  checked={form.acceptedTerms}
                  onCheckedChange={(v) => set("acceptedTerms", v === true)}
                  aria-invalid={errors.acceptedTerms ? true : undefined}
                  className="mt-[2px] flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] border-2 border-k-line bg-transparent transition-colors duration-150 data-[state=checked]:border-ut-copper data-[state=checked]:bg-ut-copper"
                >
                  <Checkbox.Indicator>
                    <Check className="h-[30px] w-[30px] text-ut-ink" strokeWidth={3.25} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-[22px] leading-[1.45] text-k-muted">{state.messages.termsText}</span>
              </label>
              <FieldError>{errors.acceptedTerms}</FieldError>
            </div>

            <button
              type="button"
              onClick={submit}
              className="ut-press ut-cta mt-[8px] flex h-[128px] w-full items-center justify-center gap-[20px] rounded-[var(--ut-radius-sm)] text-[34px] font-extrabold tracking-[-0.01em] text-ut-ink"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${state.brand.primaryColor} 70%, white), ${state.brand.primaryColor} 45%, color-mix(in srgb, ${state.brand.primaryColor} 78%, black))`,
                boxShadow: "var(--ut-elev-2)",
              }}
            >
              Participar y girar la ruleta
              <ArrowRight className="h-[36px] w-[36px]" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldError({ children }: { children?: string }) {
  return (
    <p
      className="mt-[12px] h-[30px] text-[21px] font-medium leading-[30px] text-k-danger"
      role={children ? "alert" : undefined}
    >
      {children}
    </p>
  );
}

function Field({
  id,
  icon: Icon,
  label,
  error,
  onChange,
  ...input
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  type?: string;
  inputMode?: "email" | "tel" | "text";
  autoComplete?: string;
  maxLength?: number;
  onChange: (v: string) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-[16px] flex items-center gap-[12px] text-[21px] font-semibold uppercase tracking-[0.14em] text-k-muted"
      >
        <Icon className="h-[24px] w-[24px] text-ut-copper" strokeWidth={1.9} />
        {label}
      </label>
      <input
        id={id}
        {...input}
        spellCheck={false}
        autoCapitalize={id === "name" ? "words" : "off"}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-[96px] w-full rounded-[var(--ut-radius-sm)] border-0 bg-k-surface-deep px-[28px] text-[28px] text-k-text outline-none transition-[box-shadow] duration-150 placeholder:text-k-placeholder focus-visible:outline-none"
        style={{
          boxShadow: error
            ? "inset 0 0 0 2px var(--ut-danger)"
            : focused
              ? "inset 0 0 0 2px var(--ut-copper)"
              : "inset 0 0 0 1px var(--ut-line)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span id={`${id}-error`}>
        <FieldError>{error}</FieldError>
      </span>
    </div>
  );
}
