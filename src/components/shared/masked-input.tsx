import type * as React from "react";
import { Input } from "@/components/ui/input";
import { masks } from "@/lib/utils/masks";

export type MaskKind = "cnpj" | "cpf" | "cep" | "phone";

interface MaskedInputProps
	extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
	mask: MaskKind;
	value?: string;
	/** Recebe o valor já mascarado. Compatível com field.onChange do react-hook-form. */
	onChange?: (value: string) => void;
}

/**
 * Input que sempre formata o valor exibido (ao carregar e ao digitar) conforme a
 * máscara escolhida. Como `masks.*` limpam e reformatam, funciona tanto para
 * dígitos crus vindos do banco quanto para strings já mascaradas.
 */
export function MaskedInput({
	mask,
	value,
	onChange,
	inputMode,
	...props
}: MaskedInputProps) {
	const apply = masks[mask];
	return (
		<Input
			inputMode={inputMode ?? "numeric"}
			value={value ? apply(value) : ""}
			onChange={(e) => onChange?.(apply(e.target.value))}
			{...props}
		/>
	);
}
