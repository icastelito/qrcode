import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
	params: Promise<{ id: string; logId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	const { id: qrId, logId } = await params;

	const log = await prisma.qrAccessLog.findUnique({
		where: { id: logId },
	});

	if (!log || log.qrId !== qrId) {
		return NextResponse.json({ error: "Acesso não encontrado" }, { status: 404 });
	}

	// Outros acessos do mesmo dispositivo (mesmo ipHash)
	const relatedLogs = await prisma.qrAccessLog.findMany({
		where: {
			qrId,
			ipHash: log.ipHash,
			id: { not: logId },
		},
		orderBy: { timestamp: "desc" },
		take: 20,
		select: {
			id: true,
			timestamp: true,
			device: true,
			browser: true,
			city: true,
			country: true,
			region: true,
			latitude: true,
			longitude: true,
			isUniqueVisitor: true,
			isMobile: true,
			platform: true,
		},
	});

	return NextResponse.json({ log, relatedLogs });
}
