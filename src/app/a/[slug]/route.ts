import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectTrackingData, getClientIP } from "@/lib/tracking-utils";
import { getGeoFromIPAsync } from "@/lib/geoip";
import { detectSocialNetwork } from "@/lib/affiliate-utils";

interface RouteParams {
	params: Promise<{ slug: string }>;
}

/**
 * GET - Redireciona para o link de afiliado e registra o acesso
 * Rota: /a/[slug]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	const startTime = Date.now();
	const { slug } = await params;

	try {
		// 1. Busca o link de afiliado pelo slug
		const affiliateLink = await prisma.affiliateLink.findUnique({
			where: { slug },
		});

		// Se não encontrar ou estiver inativo, redireciona para página de erro
		if (!affiliateLink) {
			return NextResponse.redirect(new URL("/404", request.url));
		}

		if (!affiliateLink.isActive) {
			return NextResponse.redirect(new URL("/link-inativo", request.url));
		}

		// 2. Coleta dados de tracking (reutiliza a função existente)
		const trackingData = collectTrackingData(request);

		// 3. Obtém o IP real do cliente
		const clientIP = getClientIP(request.headers);
		console.log(`[Affiliate Tracking] IP: ${clientIP}, Slug: ${slug}`);

		// 4. Detecta rede social de origem
		const socialNetwork = detectSocialNetwork(trackingData.referer, trackingData.userAgent);
		console.log(`[Affiliate Tracking] Rede Social: ${socialNetwork || "direto"}`);

		// 5. Resolve geolocalização
		let geoData = {
			country: trackingData.country,
			region: trackingData.region,
			city: trackingData.city,
			timezone: trackingData.timezone,
			latitude: trackingData.latitude,
			longitude: trackingData.longitude,
		};

		if (!geoData.city || !geoData.country) {
			console.log(`[Affiliate Tracking] Buscando geo para IP: ${clientIP}`);
			const geo = await getGeoFromIPAsync(clientIP);
			geoData = {
				country: geo.country || geoData.country,
				region: geo.region || geoData.region,
				city: geo.city || geoData.city,
				timezone: geo.timezone || geoData.timezone,
				latitude: geo.latitude || geoData.latitude,
				longitude: geo.longitude || geoData.longitude,
			};
		}

		// 6. Verifica se é visitante único
		const existingVisit = await prisma.affiliateAccessLog.findFirst({
			where: {
				linkId: affiliateLink.id,
				ipHash: trackingData.ipHash,
			},
			select: { id: true },
		});
		const isUniqueVisitor = !existingVisit;

		// 7. Calcula tempo de resposta
		const responseTime = Date.now() - startTime;

		// 8. Salva o log de acesso (não bloqueia o redirect)
		prisma.affiliateAccessLog
			.create({
				data: {
					linkId: affiliateLink.id,

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

					// Origem
					referer: trackingData.referer?.substring(0, 500) || null,
					utmSource: trackingData.utmSource,
					utmMedium: trackingData.utmMedium,
					utmCampaign: trackingData.utmCampaign,
					utmTerm: trackingData.utmTerm,
					utmContent: trackingData.utmContent,

					// Rede Social detectada
					socialNetwork,

					// Contexto
					language: trackingData.language,
					isBot: trackingData.isBot,
					responseTime,
				},
			})
			.then(() => {
				console.log(`[Affiliate Tracking] Log salvo para: ${affiliateLink.productName}`);
			})
			.catch((err) => {
				console.error("[Affiliate Tracking] Erro ao salvar log:", err);
			});

		// 9. Redireciona para o link de afiliado
		console.log(`[Affiliate Tracking] Redirecionando para: ${affiliateLink.affiliateUrl}`);
		return NextResponse.redirect(affiliateLink.affiliateUrl, { status: 302 });
	} catch (error) {
		console.error("[Affiliate Tracking] Erro:", error);
		return NextResponse.redirect(new URL("/erro", request.url));
	}
}
