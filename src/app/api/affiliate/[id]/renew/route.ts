import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renewAffiliateLink, isShopeeConfigured } from "@/lib/shopee-api";

interface RouteParams {
	params: Promise<{ id: string }>;
}

/**
 * POST - Renova um link de afiliado usando a API da Shopee
 *
 * Body opcional:
 * - productUrl: URL do produto na Shopee (se não fornecido, tenta extrair do link atual)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		// Verifica se a API está configurada
		if (!isShopeeConfigured()) {
			return NextResponse.json(
				{ error: "API da Shopee não configurada. Configure SHOPEE_APP_ID e SHOPEE_SECRET no .env" },
				{ status: 503 }
			);
		}

		const { id } = await params;

		// Busca o link atual
		const link = await prisma.affiliateLink.findUnique({
			where: { id },
		});

		if (!link) {
			return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
		}

		// Tenta obter a URL do produto
		let productUrl: string | null = null;

		// Primeiro, verifica se foi enviada no body
		try {
			const body = await request.json();
			productUrl = body.productUrl || null;
		} catch {
			// Body vazio ou inválido, continua
		}

		// Se não foi fornecida, tenta usar o link atual como URL de origem
		if (!productUrl) {
			// A API da Shopee aceita qualquer URL válida da Shopee (produto ou link encurtado)
			const currentUrl = link.affiliateUrl;
			if (
				currentUrl.includes("shopee.com.br") ||
				currentUrl.includes("shope.ee") ||
				currentUrl.includes("s.shopee.com.br")
			) {
				productUrl = currentUrl;
			}
		}

		if (!productUrl) {
			return NextResponse.json(
				{
					error: "URL do produto não fornecida. Envie productUrl no body da requisição.",
					hint: "A URL deve ser do formato: https://shopee.com.br/Nome-do-Produto-i.LOJA_ID.PRODUCT_ID",
					currentUrl: link.affiliateUrl,
				},
				{ status: 400 }
			);
		}

		// Gera novo link de afiliado usando a API da Shopee
		const newAffiliateUrl = await renewAffiliateLink(productUrl, link.slug);

		// Atualiza o link no banco de dados
		const updatedLink = await prisma.affiliateLink.update({
			where: { id },
			data: {
				affiliateUrl: newAffiliateUrl,
				// updatedAt é atualizado automaticamente pelo Prisma
			},
		});

		return NextResponse.json({
			success: true,
			message: "Link renovado com sucesso",
			link: updatedLink,
			newUrl: newAffiliateUrl,
		});
	} catch (error) {
		console.error("Erro ao renovar link de afiliado:", error);

		// Trata erros específicos da API da Shopee
		if (error instanceof Error) {
			if (error.message.includes("Shopee API Error")) {
				return NextResponse.json({ error: error.message }, { status: 502 });
			}
			if (error.message.includes("Credenciais")) {
				return NextResponse.json({ error: error.message }, { status: 503 });
			}
		}

		return NextResponse.json({ error: "Erro ao renovar link de afiliado" }, { status: 500 });
	}
}
