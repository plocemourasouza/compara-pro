import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Compara Pró - Comparação de Preços",
	description:
		"Plataforma de comparação de preços entre fornecedores e clientes",
};

// Browser wallet extensions (e.g. MetaMask) inject `inpage.js` into every page
// and can emit "Failed to connect to MetaMask". This app does not use web3, so
// we silence errors that originate from a browser extension before Next.js'
// global error overlay picks them up. App errors (non-extension) are untouched.
const suppressExtensionErrors = `(function () {
  function fromExtension(stack, filename) {
    return (
      (typeof filename === "string" && filename.indexOf("chrome-extension://") === 0) ||
      (typeof stack === "string" && (stack.indexOf("chrome-extension://") !== -1 || stack.indexOf("moz-extension://") !== -1))
    );
  }
  window.addEventListener("error", function (event) {
    var stack = (event.error && event.error.stack) || "";
    if (fromExtension(stack, event.filename || "")) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason || {};
    var stack = reason.stack || "";
    var message = (typeof reason === "string" ? reason : reason.message) || "";
    if (fromExtension(stack, "") || /MetaMask/i.test(message)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
})();`;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<Script
					id="suppress-extension-errors"
					strategy="beforeInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static, app-authored script (no user input) registered before hydration
					dangerouslySetInnerHTML={{ __html: suppressExtensionErrors }}
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				suppressHydrationWarning={true}
			>
				{children}
				<Toaster position="top-right" />
			</body>
		</html>
	);
}
