"use client";

import { useEffect, useState } from "react";
import { useForm, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildZodSchemaFromFields, isFieldVisible, type FieldDef } from "@/lib/forms/formSchema";

export type RefOption = { id: string; label: string };

export type DynamicFormRendererProps = {
  fields: FieldDef[];
  defaultValues?: Record<string, string>;
  employeeOptions?: RefOption[];
  clientOptions?: RefOption[];
  signatoryOptions?: RefOption[];
  onValuesChange?: (values: Record<string, string>) => void;
};

// Daftar poin dinamis (tambah/hapus baris) - nilai gabungan disimpan sebagai
// satu string dipisah "\n" supaya tipe values tetap seragam Record<string,
// string> di seluruh alur (template props, formDataJson, dsb), tanpa perlu
// mengubah struktur data di luar komponen ini.
function TextListField({
  fieldKey,
  initialValue,
  setValue,
}: {
  fieldKey: string;
  initialValue?: string;
  setValue: UseFormSetValue<Record<string, string>>;
}) {
  const [items, setItems] = useState<string[]>(() =>
    initialValue ? initialValue.split("\n").filter((v) => v.length > 0) : [""]
  );

  useEffect(() => {
    setValue(fieldKey, items.filter((v) => v.trim().length > 0).join("\n"), {
      shouldValidate: true,
      shouldDirty: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <span className="pt-2 text-xs text-slate-400">{idx + 1}.</span>
          <textarea
            rows={2}
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              setItems(next);
            }}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => setItems(items.filter((_, i) => i !== idx))}
              className="self-start text-xs text-red-500 hover:underline"
            >
              Hapus
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, ""])}
        className="self-start text-xs text-slate-600 hover:underline"
      >
        + Tambah Poin
      </button>
    </div>
  );
}

export function DynamicFormRenderer({
  fields,
  defaultValues,
  employeeOptions = [],
  clientOptions = [],
  signatoryOptions = [],
  onValuesChange,
}: DynamicFormRendererProps) {
  const schema = buildZodSchemaFromFields(fields);
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues,
  });

  const values = watch();

  useEffect(() => {
    onValuesChange?.(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  function refOptionsFor(type: FieldDef["type"]): RefOption[] {
    if (type === "employeeRef") return employeeOptions;
    if (type === "clientRef") return clientOptions;
    if (type === "signatoryRef") return signatoryOptions;
    return [];
  }

  return (
    <form className="flex flex-col gap-4">
      {fields.map((field) => {
        if (!isFieldVisible(field, values)) return null;
        const error = errors[field.key]?.message as string | undefined;

        return (
          <div key={field.key} className="flex flex-col gap-1">
            <label htmlFor={field.key} className="text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>

            {field.type === "textList" && (
              <TextListField fieldKey={field.key} initialValue={defaultValues?.[field.key]} setValue={setValue} />
            )}

            {field.type === "textarea" && (
              <textarea
                id={field.key}
                rows={3}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register(field.key)}
              />
            )}

            {field.type === "date" && (
              <input
                id={field.key}
                type="date"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register(field.key)}
              />
            )}

            {field.type === "currency" && (
              <input
                id={field.key}
                type="number"
                min={0}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register(field.key)}
              />
            )}

            {field.type === "select" && (
              <select
                id={field.key}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register(field.key)}
              >
                <option value="">- Pilih -</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {(field.type === "employeeRef" || field.type === "clientRef" || field.type === "signatoryRef") && (
              <select
                id={field.key}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register(field.key)}
              >
                <option value="">- Pilih -</option>
                {refOptionsFor(field.type).map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "text" && (
              <input
                id={field.key}
                type="text"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register(field.key)}
              />
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      })}
    </form>
  );
}
