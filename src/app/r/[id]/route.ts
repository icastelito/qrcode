import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectTrackingData } from "@/lib/tracking-utils";
import { getGeoFromIPAsync } from "@/lib/geoip";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	const startTime = Date.now();
	const { id } = await params;

	try {
		// 1. Busca o QR Code no banco
		const qrCode = await prisma.qrCode.findUnique({
			where: { id },
		});

		// Se não encontrar, redireciona para página de erro ou home
		if (!qrCode) {
			return NextResponse.redirect(new URL("/404", request.url));
		}

		// 2. Coleta TODOS os dados de tracking
		const trackingData = collectTrackingData(request);

		// 3. Tenta resolver geolocalização via IP (fallback se Cloudflare não estiver disponível)
		let geoData = {
			country: trackingData.country,
			region: trackingData.region,
			city: trackingData.city,
			timezone: trackingData.timezone,
			latitude: trackingData.latitude,
			longitude: trackingData.longitude,
		};

		// Se não tiver dados do Cloudflare, tenta via serviço de GeoIP
		if (!geoData.country) {
			const headers = request.headers;
			const forwarded = headers.get("x-forwarded-for");
			const ip = forwarded ? forwarded.split(",")[0].trim() : headers.get("x-real-ip") || "0.0.0.0";
			const geo = await getGeoFromIPAsync(ip);
			geoData = {
				country: geo.country,
				region: geo.region || null,
				city: geo.city,
				timezone: geo.timezone || null,
				latitude: geo.latitude || null,
				longitude: geo.longitude || null,
			};
		}

		// 4. Verifica se é visitante único (baseado no ipHash + qrId)
		const existingVisit = await prisma.qrAccessLog.findFirst({
			where: {
				qrId: qrCode.id,
				ipHash: trackingData.ipHash,
			},
			select: { id: true },
		});
		const isUniqueVisitor = !existingVisit;

		// 5. Calcula tempo de resposta
		const responseTime = Date.now() - startTime;

		// 6. Salva o log de acesso completo (não bloqueia o redirect)
		prisma.qrAccessLog
			.create({
				data: {
					qrId: qrCode.id,

					// Identificação
					ipHash: trackingData.ipHash,
					sessionId: trackingData.sessionId,
					isUniqueVisitor,

					// User Agent e Dispositivo
					userAgent: trackingData.userAgent?.substring(0, 500) || null,
					device: trackingData.device,
					isMobile: trackingData.isMobile,
					browser: trackingData.browser,
					browserVersion: trackingData.browserVersion,
					platform: trackingData.platform,
					osVersion: trackingData.osVersion,

					// Geolocalização
					country: geoData.country,
					region: geoData.region,
					city: geoData.city,
					timezone: geoData.timezone,
					latitude: geoData.latitude,
					longitude: geoData.longitude,

					// Origem e Campanha
					referer: trackingData.referer?.substring(0, 500) || null,
					utmSource: trackingData.utmSource,
					utmMedium: trackingData.utmMedium,
					utmCampaign: trackingData.utmCampaign,
					utmTerm: trackingData.utmTerm,
					utmContent: trackingData.utmContent,

					// Contexto
					language: trackingData.language,
					scanMethod: trackingData.scanMethod,

					// Performance e Segurança
					responseTime,
					isBot: trackingData.isBot,
				},
			})
			.catch((err: unknown) => {
				console.error("Erro ao salvar log de acesso:", err);
			});

		// 7. Faz redirect 302 para a URL de destino
		return NextResponse.redirect(qrCode.targetUrl, {
			status: 302,
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				"Pragma": "no-cache",
				"Expires": "0",
			},
		});
	} catch (error) {
		console.error("Erro no rastreamento:", error);

		// Em caso de erro, tenta redirect direto se tiver o QR
		try {
			const qrCode = await prisma.qrCode.findUnique({
				where: { id },
				select: { targetUrl: true },
			});

			if (qrCode) {
				return NextResponse.redirect(qrCode.targetUrl, { status: 302 });
			}
		} catch {
			// Ignora erro secundário
		}

		// Fallback para home
		return NextResponse.redirect(new URL("/", request.url));
	}
}
