import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Listar QR Codes
export async function GET() {
	try {
		const qrCodes = await prisma.qrCode.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				targetUrl: true,
			},
		});

		return NextResponse.json(qrCodes);
	} catch (error) {
		console.error("Erro ao listar QR Codes:", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
