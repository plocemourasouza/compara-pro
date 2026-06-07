"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
	userId: string;
}

export default function RepresentativeSuppliers({ userId }: Props) {
	const [all, setAll] = useState<{ id: string; name: string }[]>([]);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const load = useCallback(() => {
		setLoading(true);
		fetch(`/api/admin/representatives/${userId}/suppliers`)
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => {
				setAll(d.all ?? []);
				setSelected(new Set<string>(d.linked ?? []));
			})
			.catch(() => toast.error("Não foi possível carregar os fornecedores."))
			.finally(() => setLoading(false));
	}, [userId]);

	useEffect(() => {
		load();
	}, [load]);

	const toggle = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const save = async () => {
		setSaving(true);
		const res = await fetch(`/api/admin/representatives/${userId}/suppliers`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ supplierCompanyIds: [...selected] }),
		});
		setSaving(false);
		if (res.ok) {
			toast.success("Fornecedores do representante atualizados.");
		} else {
			toast.error("Não foi possível salvar.");
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Fornecedores representados</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{loading ? (
					<p className="text-muted-foreground text-sm">Carregando…</p>
				) : all.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Nenhuma empresa fornecedora cadastrada.
					</p>
				) : (
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{all.map((c) => (
							<Label
								key={c.id}
								className="flex items-center gap-2 rounded-md border p-3 font-normal"
							>
								<Checkbox
									checked={selected.has(c.id)}
									onCheckedChange={() => toggle(c.id)}
								/>
								{c.name}
							</Label>
						))}
					</div>
				)}
				<Button onClick={save} disabled={saving || loading}>
					{saving ? "Salvando..." : "Salvar fornecedores"}
				</Button>
			</CardContent>
		</Card>
	);
}
