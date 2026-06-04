import * as XLSX from "xlsx";

export interface ProductData {
	code?: string;
	sku?: string;
	name: string;
	price?: number;
}

export const parseExcelFile = (buffer: Buffer): ProductData[] => {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const sheetName = workbook.SheetNames[0];
	const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;
	if (!worksheet) {
		return [];
	}
	const data: ProductData[] = XLSX.utils.sheet_to_json(worksheet);

	// Remover duplicatas
	const uniqueData = data.filter(
		(item, index, self) =>
			index ===
			self.findIndex((t) => t.sku === item.sku && t.code === item.code),
	);

	return uniqueData;
};
