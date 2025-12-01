import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
	params: Promise<{ id: string }>;
}

// DELETE - Remove um QR Code
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	const { id } = await params;

	try {
		// Verifica se o QR Code existe
		const qrCode = await prisma.qrCode.findUnique({
			where: { id },
		});

		if (!qrCode) {
			return NextResponse.json({ error: "QR Code não encontrado" }, { status: 404 });
		}

		// Deleta o QR Code (os logs são deletados em cascata pelo Prisma)
		await prisma.qrCode.delete({
			where: { id },
		});

		return NextResponse.json({ success: true, message: "QR Code deletado com sucesso" });
	} catch (error) {
		console.error("Erro ao deletar QR Code:", error);
		return NextResponse.json({ error: "Erro interno ao deletar QR Code" }, { status: 500 });
	}
}
