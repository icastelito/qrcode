import QRCode from "qrcode";
import sharp from "sharp";

export type ModuleStyle = "square" | "rounded" | "circle" | "diamond";

export interface QRStyle {
	size?: number;
	margin?: number;
	darkColor?: string;
	lightColor?: string;
	logo?: string; // Base64 da imagem do logo
	logoSize?: number; // Porcentagem do tamanho do QR (ex: 20 = 20%)
	moduleStyle?: ModuleStyle; // Estilo dos módulos do QR
}

const DEFAULT_STYLE: QRStyle = {
	size: 400,
	margin: 2,
	darkColor: "#000000",
	lightColor: "#FFFFFF",
	logoSize: 20,
	moduleStyle: "square",
};

/**
 * Gera um QR Code como buffer PNG
 */
export async function generateQR(data: string, style: QRStyle = {}): Promise<Buffer> {
	const mergedStyle = { ...DEFAULT_STYLE, ...style };

	// Se o estilo for diferente de square, usa renderização customizada
	if (mergedStyle.moduleStyle && mergedStyle.moduleStyle !== "square") {
		return await generateStyledQR(data, mergedStyle);
	}

	const qrBuffer = await QRCode.toBuffer(data, {
		type: "png",
		width: mergedStyle.size,
		margin: mergedStyle.margin,
		color: {
			dark: mergedStyle.darkColor || "#000000",
			light: mergedStyle.lightColor || "#FFFFFF",
		},
		errorCorrectionLevel: mergedStyle.logo ? "H" : "M", // Alto se tiver logo
	});

	// Se tiver logo, adiciona no centro
	if (mergedStyle.logo) {
		return await addLogo(
			qrBuffer,
			mergedStyle.logo,
			mergedStyle.size!,
			mergedStyle.logoSize!,
			mergedStyle.lightColor || "#FFFFFF"
		);
	}

	return qrBuffer;
}

/**
 * Gera QR Code com estilos customizados de módulos
 */
async function generateStyledQR(data: string, style: QRStyle): Promise<Buffer> {
	// Obtém a matriz de dados do QR
	const qrData = await QRCode.create(data, {
		errorCorrectionLevel: style.logo ? "H" : "M",
	});

	const modules = qrData.modules;
	const moduleCount = modules.size;
	const margin = style.margin || 2;
	const size = style.size || 400;
	const moduleSize = (size - margin * 2 * (size / moduleCount)) / moduleCount;
	const actualMargin = margin * moduleSize;

	const darkColor = style.darkColor || "#000000";
	const lightColor = style.lightColor || "#FFFFFF";

	// Gera SVG com o estilo customizado
	const svgContent = generateStyledSVG(
		modules,
		moduleCount,
		moduleSize,
		actualMargin,
		darkColor,
		lightColor,
		style.moduleStyle || "circle",
		size
	);

	// Converte SVG para PNG usando sharp
	let qrBuffer = await sharp(Buffer.from(svgContent)).resize(size, size).png().toBuffer();

	// Se tiver logo, adiciona no centro
	if (style.logo) {
		qrBuffer = await addLogo(qrBuffer, style.logo, size, style.logoSize || 20, lightColor);
	}

	return qrBuffer;
}

/**
 * Gera o SVG com módulos estilizados
 */
function generateStyledSVG(
	modules: { get: (row: number, col: number) => number; size: number },
	moduleCount: number,
	moduleSize: number,
	margin: number,
	darkColor: string,
	lightColor: string,
	moduleStyle: ModuleStyle,
	totalSize: number
): string {
	let paths = "";

	for (let row = 0; row < moduleCount; row++) {
		for (let col = 0; col < moduleCount; col++) {
			if (modules.get(row, col)) {
				const x = margin + col * moduleSize;
				const y = margin + row * moduleSize;

				// Verifica se é um finder pattern (olhos do QR)
				const isFinderPattern = isPartOfFinderPattern(row, col, moduleCount);

				if (isFinderPattern) {
					// Finder patterns sempre quadrados para garantir leitura
					paths += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}" />`;
				} else {
					// Aplica o estilo aos outros módulos
					paths += generateModuleShape(x, y, moduleSize, darkColor, moduleStyle);
				}
			}
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">
	<rect width="100%" height="100%" fill="${lightColor}" />
	${paths}
</svg>`;
}

/**
 * Verifica se a posição faz parte de um finder pattern (olhos do QR)
 */
function isPartOfFinderPattern(row: number, col: number, moduleCount: number): boolean {
	const finderSize = 7;

	// Canto superior esquerdo
	if (row < finderSize && col < finderSize) return true;

	// Canto superior direito
	if (row < finderSize && col >= moduleCount - finderSize) return true;

	// Canto inferior esquerdo
	if (row >= moduleCount - finderSize && col < finderSize) return true;

	return false;
}

/**
 * Gera a forma SVG para um módulo baseado no estilo
 */
function generateModuleShape(x: number, y: number, size: number, color: string, style: ModuleStyle): string {
	const halfSize = size / 2;
	const centerX = x + halfSize;
	const centerY = y + halfSize;
	const gap = size * 0.1; // Pequeno gap para separação visual

	switch (style) {
		case "circle":
			// Círculo/Bolinha
			const radius = (size - gap * 2) / 2;
			return `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}" />`;

		case "rounded":
			// Quadrado com bordas arredondadas
			const cornerRadius = size * 0.3;
			return `<rect x="${x + gap}" y="${y + gap}" width="${size - gap * 2}" height="${
				size - gap * 2
			}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${color}" />`;

		case "diamond":
			// Losango/Diamante
			const diamondSize = (size - gap * 2) / 2;
			return `<polygon points="${centerX},${centerY - diamondSize} ${
				centerX + diamondSize
			},${centerY} ${centerX},${centerY + diamondSize} ${centerX - diamondSize},${centerY}" fill="${color}" />`;

		case "square":
		default:
			return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" />`;
	}
}

/**
 * Converte cor hex para RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: { r: 255, g: 255, b: 255 };
}

/**
 * Adiciona um logo no centro do QR Code
 */
export async function addLogo(
	qrBuffer: Buffer,
	logoBase64: string,
	qrSize: number,
	logoSizePercent: number,
	backgroundColor: string = "#FFFFFF"
): Promise<Buffer> {
	try {
		// Converte a cor de fundo para RGB
		const bgColor = hexToRgb(backgroundColor);

		// Remove o prefixo data:image se existir
		const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
		const logoBuffer = Buffer.from(base64Data, "base64");

		// Calcula o tamanho do logo
		const logoSize = Math.floor(qrSize * (logoSizePercent / 100));

		// Redimensiona o logo
		const resizedLogo = await sharp(logoBuffer)
			.resize(logoSize, logoSize, {
				fit: "contain",
				background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: 1 },
			})
			.png()
			.toBuffer();

		// Cria um fundo com a cor escolhida para o logo (padding)
		const padding = Math.floor(logoSize * 0.1);
		const backgroundSize = logoSize + padding * 2;

		const logoWithBackground = await sharp({
			create: {
				width: backgroundSize,
				height: backgroundSize,
				channels: 4,
				background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: 1 },
			},
		})
			.composite([
				{
					input: resizedLogo,
					top: padding,
					left: padding,
				},
			])
			.png()
			.toBuffer();

		// Calcula a posição central
		const position = Math.floor((qrSize - backgroundSize) / 2);

		// Combina QR + Logo
		const finalQR = await sharp(qrBuffer)
			.composite([
				{
					input: logoWithBackground,
					top: position,
					left: position,
				},
			])
			.png()
			.toBuffer();

		return finalQR;
	} catch (error) {
		console.error("Erro ao adicionar logo:", error);
		// Retorna o QR sem logo em caso de erro
		return qrBuffer;
	}
}
