import { NextRequest, NextResponse } from "next/server";
import { generateQR, QRStyle, ModuleStyle } from "@/lib/qr-generator";

// POST - Gera preview do QR Code sem salvar no banco
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const style: QRStyle = {
			size: body.size || 400,
			margin: body.margin || 2,
			darkColor: body.darkColor || "#000000",
			lightColor: body.lightColor || "#FFFFFF",
			logo: body.logo || undefined,
			logoSize: body.logoSize || 20,
			moduleStyle: (body.moduleStyle as ModuleStyle) || "square",
		};

		// URL de exemplo para preview
		const previewUrl = body.previewUrl || "https://exemplo.com";

		// Gera o QR Code
		const qrBuffer = await generateQR(previewUrl, style);

		// Retorna o PNG
		return new NextResponse(new Uint8Array(qrBuffer), {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "no-cache, no-store, must-revalidate",
			},
		});
	} catch (error) {
		console.error("Erro ao gerar preview:", error);
		return NextResponse.json({ error: "Erro ao gerar preview do QR Code" }, { status: 500 });
	}
}
