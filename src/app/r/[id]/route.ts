import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectTrackingData, getClientIP } from "@/lib/tracking-utils";
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

		// 3. Obtém o IP real do cliente
		const clientIP = getClientIP(request.headers);
		console.log(`[Tracking] IP do cliente: ${clientIP}`);

		// 4. Tenta resolver geolocalização
		// Primeiro verifica se já tem dados do Cloudflare
		let geoData = {
			country: trackingData.country,
			region: trackingData.region,
			city: trackingData.city,
			timezone: trackingData.timezone,
			latitude: trackingData.latitude,
			longitude: trackingData.longitude,
		};

		// Se não tiver dados do Cloudflare, busca via API de GeoIP
		if (!geoData.city || !geoData.country) {
			console.log(`[Tracking] Buscando geolocalização para IP: ${clientIP}`);
			const geo = await getGeoFromIPAsync(clientIP);
			geoData = {
				country: geo.country || geoData.country,
				region: geo.region || geoData.region,
				city: geo.city || geoData.city,
				timezone: geo.timezone || geoData.timezone,
				latitude: geo.latitude || geoData.latitude,
				longitude: geo.longitude || geoData.longitude,
			};
			console.log(`[Tracking] Geolocalização: ${geoData.city}, ${geoData.region}, ${geoData.country}`);
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
