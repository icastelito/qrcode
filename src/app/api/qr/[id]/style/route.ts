import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQR, QRStyle, ModuleStyle } from "@/lib/qr-generator";
import { Prisma } from "@prisma/client";

interface RouteParams {
	params: Promise<{ id: string }>;
}

// PATCH - Atualiza apenas o estilo do QR Code (não permite alterar nome ou URL)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const { id } = await params;

	try {
		// Verifica se o QR Code existe
		const qrCode = await prisma.qrCode.findUnique({
			where: { id },
		});

		if (!qrCode) {
			return NextResponse.json({ error: "QR Code não encontrado" }, { status: 404 });
		}

		const body = await request.json();

		// Valida que apenas campos de estilo podem ser alterados
		const allowedFields = ["size", "margin", "darkColor", "lightColor", "logo", "logoSize", "moduleStyle"];
		const updateData: QRStyle = {};

		for (const field of allowedFields) {
			if (body[field] !== undefined) {
				(updateData as Record<string, unknown>)[field] = body[field];
			}
		}

		// Merge com o estilo existente
		const existingStyle = (qrCode.style as Record<string, unknown>) || {};
		const newStyle = { ...existingStyle, ...updateData };

		// Atualiza no banco
		await prisma.qrCode.update({
			where: { id },
			data: {
				style: newStyle as Prisma.InputJsonValue,
			},
		});

		// Regenera o QR Code com o novo estilo
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
		const trackingUrl = `${baseUrl}/r/${qrCode.id}`;
		const qrBuffer = await generateQR(trackingUrl, newStyle as QRStyle);

		// Retorna o novo PNG
		return new NextResponse(new Uint8Array(qrBuffer), {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Content-Disposition": `inline; filename="qr-${qrCode.id}.png"`,
			},
		});
	} catch (error) {
		console.error("Erro ao atualizar QR Code:", error);
		return NextResponse.json({ error: "Erro interno ao atualizar QR Code" }, { status: 500 });
	}
}

// GET - Retorna os dados do estilo atual
export async function GET(request: NextRequest, { params }: RouteParams) {
	const { id } = await params;

	try {
		const qrCode = await prisma.qrCode.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				targetUrl: true,
				style: true,
				createdAt: true,
			},
		});

		if (!qrCode) {
			return NextResponse.json({ error: "QR Code não encontrado" }, { status: 404 });
		}

		return NextResponse.json(qrCode);
	} catch (error) {
		console.error("Erro ao buscar QR Code:", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
