import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	const { id: qrId } = await params;
	const { searchParams } = new URL(request.url);

	const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
	const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
	const device = searchParams.get("device") || undefined;
	const country = searchParams.get("country") || undefined;
	const dateFrom = searchParams.get("dateFrom") || undefined;
	const dateTo = searchParams.get("dateTo") || undefined;

	// Verifica se o QR code existe
	const qrCode = await prisma.qrCode.findUnique({ where: { id: qrId }, select: { id: true } });
	if (!qrCode) {
		return NextResponse.json({ error: "QR Code não encontrado" }, { status: 404 });
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const where: any = { qrId };

	if (device) where.device = device;
	if (country) where.country = country;

	if (dateFrom || dateTo) {
		where.timestamp = {};
		if (dateFrom) where.timestamp.gte = new Date(dateFrom + "T00:00:00.000Z");
		if (dateTo) where.timestamp.lte = new Date(dateTo + "T23:59:59.999Z");
	}

	const [total, logs] = await Promise.all([
		prisma.qrAccessLog.count({ where }),
		prisma.qrAccessLog.findMany({
			where,
			orderBy: { timestamp: "desc" },
			skip: (page - 1) * limit,
			take: limit,
			select: {
				id: true,
				timestamp: true,
				device: true,
				browser: true,
				browserVersion: true,
				platform: true,
				osVersion: true,
				country: true,
				region: true,
				city: true,
				timezone: true,
				latitude: true,
				longitude: true,
				isUniqueVisitor: true,
				isMobile: true,
				language: true,
				scanMethod: true,
				screenWidth: true,
				screenHeight: true,
				referer: true,
				utmSource: true,
				utmMedium: true,
				utmCampaign: true,
				utmTerm: true,
				utmContent: true,
				responseTime: true,
				isBot: true,
			},
		}),
	]);

	return NextResponse.json({
		logs,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	});
}
