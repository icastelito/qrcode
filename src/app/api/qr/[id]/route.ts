import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQR, QRStyle } from "@/lib/qr-generator";

interface RouteParams {
	params: Promise<{ id: string }>;
}

// GET - Retorna o QR Code como imagem PNG
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;

		// Busca o QR Code no banco
		const qrCode = await prisma.qrCode.findUnique({
			where: { id },
		});

		if (!qrCode) {
			return NextResponse.json({ error: "QR Code não encontrado" }, { status: 404 });
		}

		// Monta a URL de rastreamento
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
		const trackingUrl = `${baseUrl}/r/${qrCode.id}`;

		// Gera o QR Code
		const style = qrCode.style as QRStyle | null;
		const qrBuffer = await generateQR(trackingUrl, style || {});

		// Usa updatedAt como ETag para cache inteligente
		const etag = `"${qrCode.updatedAt.getTime()}"`;

		// Retorna o PNG com cache que respeita atualizações
		return new NextResponse(new Uint8Array(qrBuffer), {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Content-Disposition": `inline; filename="qr-${qrCode.id}.png"`,
				"Cache-Control": "no-cache, must-revalidate",
				"ETag": etag,
			},
		});
	} catch (error) {
		console.error("Erro ao buscar QR Code:", error);
		return NextResponse.json({ error: "Erro interno ao buscar QR Code" }, { status: 500 });
	}
}

// DELETE - Remove um QR Code
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;

		await prisma.qrCode.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Erro ao deletar QR Code:", error);
		return NextResponse.json({ error: "Erro interno ao deletar QR Code" }, { status: 500 });
	}
}
