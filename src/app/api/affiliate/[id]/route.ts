import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidShopeeUrl } from "@/lib/affiliate-utils";

interface RouteParams {
	params: Promise<{ id: string }>;
}

/**
 * GET - Busca um link de afiliado específico com estatísticas
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;

		const link = await prisma.affiliateLink.findUnique({
			where: { id },
			include: {
				_count: {
					select: { accessLogs: true },
				},
			},
		});

		if (!link) {
			return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
		}

		// Estatísticas detalhadas
		const [uniqueVisitors, clicksByDay, clicksBySocialNetwork, clicksByCountry] = await Promise.all([
			// Visitantes únicos
			prisma.affiliateAccessLog.groupBy({
				by: ["ipHash"],
				where: { linkId: id },
			}),
			// Cliques por dia (últimos 30 dias)
			prisma.affiliateAccessLog.groupBy({
				by: ["timestamp"],
				where: {
					linkId: id,
					timestamp: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					},
				},
				_count: true,
			}),
			// Cliques por rede social
			prisma.affiliateAccessLog.groupBy({
				by: ["socialNetwork"],
				where: { linkId: id },
				_count: true,
			}),
			// Cliques por país
			prisma.affiliateAccessLog.groupBy({
				by: ["country"],
				where: { linkId: id },
				_count: true,
			}),
		]);

		// Últimos acessos
		const recentAccess = await prisma.affiliateAccessLog.findMany({
			where: { linkId: id },
			orderBy: { timestamp: "desc" },
			take: 50,
			select: {
				id: true,
				timestamp: true,
				device: true,
				browser: true,
				platform: true,
				country: true,
				city: true,
				region: true,
				socialNetwork: true,
				referer: true,
				isUniqueVisitor: true,
			},
		});

		return NextResponse.json({
			...link,
			totalClicks: link._count.accessLogs,
			uniqueVisitors: uniqueVisitors.length,
			stats: {
				clicksByDay,
				clicksBySocialNetwork: clicksBySocialNetwork.map((item) => ({
					network: item.socialNetwork || "direto",
					count: item._count,
				})),
				clicksByCountry: clicksByCountry.map((item) => ({
					country: item.country || "Desconhecido",
					count: item._count,
				})),
			},
			recentAccess,
		});
	} catch (error) {
		console.error("Erro ao buscar link de afiliado:", error);
		return NextResponse.json({ error: "Erro ao buscar link de afiliado" }, { status: 500 });
	}
}

/**
 * PUT - Atualiza um link de afiliado (principalmente para renovar o link)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { productName, affiliateUrl, category, notes, productImage, isActive } = body;

		// Verifica se o link existe
		const existingLink = await prisma.affiliateLink.findUnique({
			where: { id },
		});

		if (!existingLink) {
			return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
		}

		// Valida URL se fornecida
		if (affiliateUrl && !isValidShopeeUrl(affiliateUrl)) {
			return NextResponse.json(
				{ error: "URL de afiliado inválida. Use um link válido da Shopee." },
				{ status: 400 }
			);
		}

		const updateData: Record<string, unknown> = {};
		if (productName !== undefined) updateData.productName = productName;
		if (affiliateUrl !== undefined) updateData.affiliateUrl = affiliateUrl;
		if (category !== undefined) updateData.category = category;
		if (notes !== undefined) updateData.notes = notes;
		if (productImage !== undefined) updateData.productImage = productImage;
		if (isActive !== undefined) updateData.isActive = isActive;

		const link = await prisma.affiliateLink.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json(link);
	} catch (error) {
		console.error("Erro ao atualizar link de afiliado:", error);
		return NextResponse.json({ error: "Erro ao atualizar link de afiliado" }, { status: 500 });
	}
}

/**
 * DELETE - Remove um link de afiliado
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;

		const existingLink = await prisma.affiliateLink.findUnique({
			where: { id },
		});

		if (!existingLink) {
			return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
		}

		await prisma.affiliateLink.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Erro ao deletar link de afiliado:", error);
		return NextResponse.json({ error: "Erro ao deletar link de afiliado" }, { status: 500 });
	}
}
