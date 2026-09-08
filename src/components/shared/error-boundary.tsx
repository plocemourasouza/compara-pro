"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback: ReactNode;
	/** Quando este valor muda, um erro capturado anteriormente é limpo. */
	resetKey?: unknown;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

/**
 * Boundary de erro em React puro (getDerivedStateFromError/componentDidCatch
 * exigem classe — não há equivalente em hooks) para isolar componentes
 * client-side arriscados sem derrubar o restante da página. Complementa os
 * error.tsx de rota, que só capturam erros de render em Server Components.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// console.error é o uso correto e esperado num error boundary.
		console.error(error, errorInfo);
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps): void {
		if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
			this.setState({ hasError: false });
		}
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}
