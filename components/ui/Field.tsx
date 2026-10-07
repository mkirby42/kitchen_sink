import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cx, fieldClass, fieldLabelClass, selectClass, textareaClass } from "./styles";

function FieldFrame({
  id,
  label,
  hint,
  control,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  control: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className={fieldLabelClass}>{label}</span>
      {control}
      {hint ? <span className="mt-2 block text-sm text-mute">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  hint,
  className,
  id,
  ...props
}: {
  label: string;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      control={
        <input id={fieldId} className={cx(fieldClass, "mt-2", className)} {...props} />
      }
    />
  );
}

export function SelectField({
  label,
  hint,
  className,
  id,
  children,
  ...props
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      control={
        <select id={fieldId} className={cx(selectClass, "mt-2", className)} {...props}>
          {children}
        </select>
      }
    />
  );
}

export function TextArea({
  label,
  hint,
  className,
  id,
  ...props
}: {
  label: string;
  hint?: ReactNode;
  children?: never;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      control={
        <textarea
          id={fieldId}
          className={cx(textareaClass, "mt-2", className)}
          {...props}
        />
      }
    />
  );
}
