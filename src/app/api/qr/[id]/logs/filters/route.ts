import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	const { id: qrId } = await params;
	const { searchParams } = new URL(request.url);
	const region = searchParams.get("region") || undefined;

	const qrCode = await prisma.qrCode.findUnique({ where: { id: qrId }, select: { id: true } });
	if (!qrCode) {
		return NextResponse.json({ error: "QR Code não encontrado" }, { status: 404 });
	}

	// Busca estados disponíveis
	const regionsRaw = await prisma.qrAccessLog.findMany({
		where: { qrId, region: { not: null } },
		select: { region: true },
		distinct: ["region"],
		orderBy: { region: "asc" },
	});
	const regions = regionsRaw.map((r) => r.region as string).filter(Boolean);

	// Busca cidades disponíveis, filtradas pelo estado se fornecido
	const citiesRaw = await prisma.qrAccessLog.findMany({
		where: {
			qrId,
			city: { not: null },
			...(region ? { region } : {}),
		},
		select: { city: true },
		distinct: ["city"],
		orderBy: { city: "asc" },
	});
	const cities = citiesRaw.map((c) => c.city as string).filter(Boolean);

	return NextResponse.json({ regions, cities });
}
