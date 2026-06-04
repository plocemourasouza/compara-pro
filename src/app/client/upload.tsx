import { useRouter } from "next/router";
import Upload from "@/components/shared/upload";

export default function ClientUploadPage() {
	const router = useRouter();

	const handleUpload = async (file: File) => {
		const token = localStorage.getItem("token");
		if (!token) {
			router.push("/auth/login");
			return;
		}

		const reader = new FileReader();
		reader.onload = async (e) => {
			const data = e.target?.result as string;
			const base64 = data.split(",")[1];

			try {
				const response = await fetch("/api/upload", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ data: base64 }),
				});

				if (response.ok) {
					alert("Upload realizado com sucesso!");
					router.push("/dashboard");
				} else {
					const error = await response.json();
					alert(error.error);
				}
			} catch (_err) {
				alert("Ocorreu um erro ao fazer o upload.");
			}
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className="p-6">
			<h1 className="text-3xl font-bold mb-6">Upload de Lista de Produtos</h1>
			<Upload onUpload={handleUpload} label="Enviar Lista de Produtos" />
		</div>
	);
}
