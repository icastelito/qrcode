import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug, isValidShopeeUrl } from "@/lib/affiliate-utils";

/**
 * GET - Lista todos os links de afiliados
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const createdBy = searchParams.get("createdBy");
		const category = searchParams.get("category");
		const isActive = searchParams.get("isActive");

		const where: Record<string, unknown> = {};
		if (createdBy) where.createdBy = createdBy;
		if (category) where.category = category;
		if (isActive !== null) where.isActive = isActive === "true";

		const links = await prisma.affiliateLink.findMany({
			where,
			include: {
				_count: {
					select: { accessLogs: true },
				},
			},
			orderBy: { updatedAt: "desc" },
		});

		// Adiciona contagem de visitantes únicos para cada link
		const linksWithStats = await Promise.all(
			links.map(async (link) => {
				const uniqueVisitors = await prisma.affiliateAccessLog.groupBy({
					by: ["ipHash"],
					where: { linkId: link.id },
				});

				return {
					...link,
					totalClicks: link._count.accessLogs,
					uniqueVisitors: uniqueVisitors.length,
				};
			})
		);

		return NextResponse.json(linksWithStats);
	} catch (error) {
		console.error("Erro ao listar links de afiliados:", error);
		return NextResponse.json({ error: "Erro ao listar links de afiliados" }, { status: 500 });
	}
}

/**
 * POST - Cria um novo link de afiliado
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { productName, affiliateUrl, createdBy, category, notes, productImage, customSlug } = body;

		// Validações
		if (!productName || !affiliateUrl || !createdBy) {
			return NextResponse.json(
				{ error: "Campos obrigatórios: productName, affiliateUrl, createdBy" },
				{ status: 400 }
			);
		}

		if (!isValidShopeeUrl(affiliateUrl)) {
			return NextResponse.json(
				{ error: "URL de afiliado inválida. Use um link válido da Shopee." },
				{ status: 400 }
			);
		}

		// Gera slug único ou usa o customizado
		let slug = customSlug || generateSlug(productName);

		// Verifica se o slug já existe
		const existingSlug = await prisma.affiliateLink.findUnique({
			where: { slug },
		});

		if (existingSlug) {
			if (customSlug) {
				return NextResponse.json({ error: "Este slug já está em uso. Escolha outro." }, { status: 400 });
			}
			// Se não for customizado, gera um novo
			slug = generateSlug(productName);
		}

		const link = await prisma.affiliateLink.create({
			data: {
				slug,
				productName,
				productImage,
				affiliateUrl,
				createdBy,
				category,
				notes,
			},
		});

		return NextResponse.json(link, { status: 201 });
	} catch (error) {
		console.error("Erro ao criar link de afiliado:", error);
		return NextResponse.json({ error: "Erro ao criar link de afiliado" }, { status: 500 });
	}
}
