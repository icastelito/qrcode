import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renewAffiliateLink, isShopeeConfigured } from "@/lib/shopee-api";
import { calculateDaysRemaining } from "@/lib/affiliate-utils";

/**
 * GET - Verifica o status da integração com a Shopee
 */
export async function GET() {
	const configured = isShopeeConfigured();

	return NextResponse.json({
		configured,
		message: configured
			? "API da Shopee configurada corretamente"
			: "Configure SHOPEE_APP_ID e SHOPEE_SECRET no arquivo .env",
	});
}

/**
 * POST - Renova múltiplos links de afiliado
 *
 * Body:
 * - links: Array de objetos com { id, productUrl }
 * - autoRenewExpiring: Se true, renova automaticamente links que expiram em X dias
 * - daysThreshold: Número de dias para considerar link próximo de expirar (default: 2)
 */
export async function POST(request: NextRequest) {
	try {
		// Verifica se a API está configurada
		if (!isShopeeConfigured()) {
			return NextResponse.json(
				{ error: "API da Shopee não configurada. Configure SHOPEE_APP_ID e SHOPEE_SECRET no .env" },
				{ status: 503 }
			);
		}

		const body = await request.json();
		const { links, autoRenewExpiring, daysThreshold = 2 } = body;

		const results: Array<{
			id: string;
			success: boolean;
			newUrl?: string;
			error?: string;
		}> = [];

		// Se autoRenewExpiring está ativo, busca links próximos de expirar
		let linksToRenew = links || [];

		if (autoRenewExpiring) {
			const allLinks = await prisma.affiliateLink.findMany({
				where: { isActive: true },
			});

			// Filtra links que estão próximos de expirar
			const expiringLinks = allLinks.filter((link) => {
				const daysRemaining = calculateDaysRemaining(link.updatedAt);
				return daysRemaining <= daysThreshold;
			});

			// Se não foram fornecidos links específicos, usa os que estão expirando
			if (!links || links.length === 0) {
				linksToRenew = expiringLinks.map((link) => ({
					id: link.id,
					productUrl: link.affiliateUrl, // Tenta usar o URL atual
				}));
			}
		}

		// Processa cada link
		for (const linkData of linksToRenew) {
			try {
				const { id, productUrl } = linkData;

				// Busca o link no banco
				const link = await prisma.affiliateLink.findUnique({
					where: { id },
				});

				if (!link) {
					results.push({ id, success: false, error: "Link não encontrado" });
					continue;
				}

				// Determina a URL do produto
				let urlToUse = productUrl;
				if (!urlToUse) {
					// A API da Shopee aceita qualquer URL válida da Shopee
					if (
						link.affiliateUrl.includes("shopee.com.br") ||
						link.affiliateUrl.includes("shope.ee") ||
						link.affiliateUrl.includes("s.shopee.com.br")
					) {
						urlToUse = link.affiliateUrl;
					}
				}

				if (!urlToUse) {
					results.push({ id, success: false, error: "URL do produto não fornecida" });
					continue;
				}

				// Renova o link
				const newUrl = await renewAffiliateLink(urlToUse, link.slug);

				// Atualiza no banco
				await prisma.affiliateLink.update({
					where: { id },
					data: { affiliateUrl: newUrl },
				});

				results.push({ id, success: true, newUrl });

				// Pequeno delay para não sobrecarregar a API (rate limit: 2000/hora)
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				results.push({
					id: linkData.id,
					success: false,
					error: error instanceof Error ? error.message : "Erro desconhecido",
				});
			}
		}

		const successCount = results.filter((r) => r.success).length;
		const failCount = results.filter((r) => !r.success).length;

		return NextResponse.json({
			success: true,
			message: `${successCount} link(s) renovado(s), ${failCount} falha(s)`,
			results,
		});
	} catch (error) {
		console.error("Erro ao renovar links em lote:", error);
		return NextResponse.json({ error: "Erro ao renovar links em lote" }, { status: 500 });
	}
}
