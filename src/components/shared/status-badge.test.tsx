/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/react";
import { STATUS_LABELS, StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
	describe("status ausente (default ??)", () => {
		it("sem prop status → renderiza como ACTIVE", () => {
			render(<StatusBadge />);
			const badge = screen.getByText(STATUS_LABELS.ACTIVE);
			expect(badge).toBeInTheDocument();
			expect(badge).toHaveClass("bg-success/10", "text-success");
		});
	});

	describe("mapeamento status → label e estilo", () => {
		it("ACTIVE → label e classe corretas", () => {
			render(<StatusBadge status="ACTIVE" />);
			const badge = screen.getByText("Ativo");
			expect(badge).toHaveClass("bg-success/10", "text-success");
		});

		it("BLOCKED → label e classe corretas", () => {
			render(<StatusBadge status="BLOCKED" />);
			const badge = screen.getByText("Bloqueado");
			expect(badge).toHaveClass("bg-amber-500/10", "text-amber-600");
		});

		it("INACTIVE → label e classe corretas", () => {
			render(<StatusBadge status="INACTIVE" />);
			const badge = screen.getByText("Inativo");
			expect(badge).toHaveClass("bg-muted", "text-muted-foreground");
		});
	});
});
