export function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          rows={3}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
