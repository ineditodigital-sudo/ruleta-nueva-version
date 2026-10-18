import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/ui";
import type { Messages } from "@/lib/types";
import { useApp } from "@/state/AppProvider";
import { RestoreFooter } from "../shared";

const FIELDS: Array<{ key: keyof Messages; label: string; hint: string; long?: boolean }> = [
  { key: "welcome", label: "Título de bienvenida", hint: "Encabezado del formulario de registro." },
  { key: "formSubtitle", label: "Subtítulo del formulario", hint: "Debajo del título de bienvenida." },
  { key: "beforeSpin", label: "Texto bajo el botón de girar", hint: "Pantalla de la ruleta." },
  { key: "congratulations", label: "Título cuando gana", hint: "Pantalla de resultado con premio." },
  { key: "prizeMessage", label: "Mensaje cuando gana", hint: "Indica dónde recoger el premio.", long: true },
  { key: "loseTitle", label: "Título cuando no gana", hint: "Pantalla de resultado sin premio." },
  { key: "loseMessage", label: "Mensaje cuando no gana", hint: "Cierre amable para quien no ganó.", long: true },
  { key: "termsText", label: "Texto de términos y privacidad", hint: "Casilla obligatoria del registro.", long: true },
];

export default function MessagesSection() {
  const { state, updateMessages } = useApp();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Textos del tótem</CardTitle>
        <CardDescription>Lo que lee cada participante en cada paso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {FIELDS.map(({ key, label, hint, long }) => (
            <div key={key} className={long ? "space-y-2 lg:col-span-2" : "space-y-2"}>
              <Label htmlFor={`m-${key}`}>{label}</Label>
              {long ? (
                <Textarea id={`m-${key}`} rows={2} value={state.messages[key]} onChange={(e) => updateMessages({ [key]: e.target.value })} />
              ) : (
                <Input id={`m-${key}`} value={state.messages[key]} onChange={(e) => updateMessages({ [key]: e.target.value })} />
              )}
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
        <RestoreFooter section="messages" label="los mensajes" />
      </CardContent>
    </Card>
  );
}
