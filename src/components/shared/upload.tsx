import { Upload as UploadIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface UploadProps {
	onUpload: (file: File) => void;
	label: string;
}

export default function Upload({ onUpload, label }: UploadProps) {
	const [dragging, setDragging] = useState(false);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(true);
	};

	const handleDragLeave = () => {
		setDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);

		const file = e.dataTransfer.files[0];
		if (file) {
			onUpload(file);
		}
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onUpload(file);
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop upload zone; file input provides keyboard access
		<div
			className={`border-2 border-dashed rounded-lg p-8 text-center ${
				dragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
			}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
			<p className="mt-2 text-sm text-gray-600">
				Arraste e solte um arquivo Excel aqui, ou clique para selecionar
			</p>
			<p className="text-xs text-gray-500">Tamanho máximo: 10MB</p>
			<input
				type="file"
				accept=".xlsx,.xls"
				onChange={handleFileInput}
				className="hidden"
				id="file-upload"
			/>
			<label htmlFor="file-upload">
				<Button className="mt-4" asChild>
					<span>{label}</span>
				</Button>
			</label>
		</div>
	);
}
