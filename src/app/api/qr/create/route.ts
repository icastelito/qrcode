import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQR, QRStyle, ModuleStyle } from "@/lib/qr-generator";
import { Prisma } from "@prisma/client";

interface CreateQRRequest {
	name: string;
	targetUrl: string;
	style?: QRStyle;
}

export async function POST(request: NextRequest) {
	try {
		const body: CreateQRRequest = await request.json();

		// Validações
		if (!body.name || typeof body.name !== "string") {
			return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
		}

		if (!body.targetUrl || typeof body.targetUrl !== "string") {
			return NextResponse.json({ error: "URL de destino é obrigatória" }, { status: 400 });
		}

		// Valida URL
		try {
			new URL(body.targetUrl);
		} catch {
			return NextResponse.json({ error: "URL de destino inválida" }, { status: 400 });
		}

		// Cria o registro no banco
		const qrCode = await prisma.qrCode.create({
			data: {
				name: body.name.trim(),
				targetUrl: body.targetUrl.trim(),
				style: (body.style || {}) as Prisma.InputJsonValue,
			},
		});

		// Monta a URL de rastreamento
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
		const trackingUrl = `${baseUrl}/r/${qrCode.id}`;

		// Gera o QR Code
		const qrBuffer = await generateQR(trackingUrl, body.style);

		// Retorna o PNG
		return new NextResponse(new Uint8Array(qrBuffer), {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Content-Disposition": `inline; filename="qr-${qrCode.id}.png"`,
				"X-QR-ID": qrCode.id,
				"X-Tracking-URL": trackingUrl,
			},
		});
	} catch (error) {
		console.error("Erro ao criar QR Code:", error);
		return NextResponse.json({ error: "Erro interno ao criar QR Code" }, { status: 500 });
	}
}

// GET para criar QR via query params (mais simples)
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const name = searchParams.get("name");
		const targetUrl = searchParams.get("url");

		if (!name || !targetUrl) {
			return NextResponse.json({ error: "Parâmetros name e url são obrigatórios" }, { status: 400 });
		}

		// Valida URL
		try {
			new URL(targetUrl);
		} catch {
			return NextResponse.json({ error: "URL de destino inválida" }, { status: 400 });
		}

		// Pega estilo dos query params
		const style: QRStyle = {
			size: parseInt(searchParams.get("size") || "400"),
			margin: parseInt(searchParams.get("margin") || "2"),
			darkColor: searchParams.get("darkColor") || "#000000",
			lightColor: searchParams.get("lightColor") || "#FFFFFF",
		};

		// Cria o registro no banco
		const qrCode = await prisma.qrCode.create({
			data: {
				name: name.trim(),
				targetUrl: targetUrl.trim(),
				style: style as Prisma.InputJsonValue,
			},
		});

		// Monta a URL de rastreamento
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
		const trackingUrl = `${baseUrl}/r/${qrCode.id}`;

		// Gera o QR Code
		const qrBuffer = await generateQR(trackingUrl, style);

		// Retorna o PNG
		return new NextResponse(new Uint8Array(qrBuffer), {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Content-Disposition": `inline; filename="qr-${qrCode.id}.png"`,
				"X-QR-ID": qrCode.id,
				"X-Tracking-URL": trackingUrl,
			},
		});
	} catch (error) {
		console.error("Erro ao criar QR Code:", error);
		return NextResponse.json({ error: "Erro interno ao criar QR Code" }, { status: 500 });
	}
}
