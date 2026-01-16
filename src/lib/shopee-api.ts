import crypto from "crypto";

/**
 * Cliente para a API de Afiliados da Shopee Brasil
 * Documentação: https://affiliate.shopee.com.br/open_api/home
 */

const SHOPEE_API_URL = "https://open-api.affiliate.shopee.com.br/graphql";

interface ShopeeApiConfig {
	appId: string;
	secret: string;
}

interface GenerateShortLinkInput {
	originUrl: string;
	subIds?: string[];
}

interface ShopeeApiResponse<T> {
	data?: T;
	errors?: Array<{
		message: string;
		extensions?: {
			code: string;
		};
	}>;
}

interface GenerateShortLinkResponse {
	generateShortLink: {
		shortLink: string;
	};
}

/**
 * Gera o header de autorização para a API da Shopee
 * Formato: SHA256 Credential={AppId}, Timestamp={Timestamp}, Signature={SHA256(AppId+Timestamp+Payload+Secret)}
 */
function generateAuthorization(config: ShopeeApiConfig, payload: string): string {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const factor = config.appId + timestamp + payload + config.secret;
	const signature = crypto.createHash("sha256").update(factor).digest("hex");

	return `SHA256 Credential=${config.appId}, Timestamp=${timestamp}, Signature=${signature}`;
}

/**
 * Obtém as credenciais da API da Shopee das variáveis de ambiente
 */
function getShopeeConfig(): ShopeeApiConfig {
	const appId = process.env.SHOPEE_APP_ID;
	const secret = process.env.SHOPEE_SECRET;

	if (!appId || !secret) {
		throw new Error("Credenciais da Shopee não configuradas. Defina SHOPEE_APP_ID e SHOPEE_SECRET no .env");
	}

	return { appId, secret };
}

/**
 * Faz uma requisição GraphQL para a API da Shopee
 */
async function shopeeGraphQL<T>(
	query: string,
	variables?: Record<string, unknown>,
	operationName?: string
): Promise<T> {
	const config = getShopeeConfig();

	const payload = JSON.stringify({
		query,
		variables,
		operationName,
	});

	const authorization = generateAuthorization(config, payload);

	const response = await fetch(SHOPEE_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: authorization,
		},
		body: payload,
	});

	if (!response.ok) {
		throw new Error(`Erro na API da Shopee: ${response.status} ${response.statusText}`);
	}

	const data: ShopeeApiResponse<T> = await response.json();

	if (data.errors && data.errors.length > 0) {
		const error = data.errors[0];
		const code = error.extensions?.code || "UNKNOWN";
		throw new Error(`Shopee API Error [${code}]: ${error.message}`);
	}

	if (!data.data) {
		throw new Error("Resposta inválida da API da Shopee");
	}

	return data.data;
}

/**
 * Gera um link de afiliado encurtado a partir de uma URL de produto da Shopee
 *
 * @param originUrl - URL original do produto (ex: https://shopee.com.br/product/...)
 * @param subIds - Sub IDs opcionais para tracking (até 5)
 * @returns Link de afiliado gerado
 */
export async function generateAffiliateLink(originUrl: string, subIds?: string[]): Promise<string> {
	// Formato correto da API GraphQL da Shopee - passando argumentos diretamente
	const subIdsParam = subIds && subIds.length > 0 ? `, subIds: ${JSON.stringify(subIds)}` : "";
	const query = `
		mutation {
			generateShortLink(input: { originUrl: "${originUrl}"${subIdsParam} }) {
				shortLink
			}
		}
	`;

	const response = await shopeeGraphQL<GenerateShortLinkResponse>(query);

	return response.generateShortLink.shortLink;
}

/**
 * Renova um link de afiliado gerando um novo a partir da URL original do produto
 *
 * @param productUrl - URL do produto na Shopee
 * @param linkSlug - Slug do link (não usado - subIds da Shopee têm restrições)
 * @returns Novo link de afiliado
 */
export async function renewAffiliateLink(productUrl: string, _linkSlug?: string): Promise<string> {
	// Nota: subIds da Shopee têm restrições de formato, então não usamos o slug
	return generateAffiliateLink(productUrl);
}

/**
 * Extrai a URL do produto de um link de afiliado da Shopee
 * Links de afiliado geralmente redirecionam para a URL do produto
 *
 * @param affiliateUrl - Link de afiliado atual
 * @returns URL do produto extraída ou null se não conseguir extrair
 */
export function extractProductUrl(affiliateUrl: string): string | null {
	try {
		const url = new URL(affiliateUrl);

		// Tenta extrair de parâmetros comuns
		const possibleParams = ["url", "origin", "redirect", "target"];
		for (const param of possibleParams) {
			const value = url.searchParams.get(param);
			if (value && value.includes("shopee.com.br")) {
				return decodeURIComponent(value);
			}
		}

		// Se é um link shope.ee ou s.shopee, não conseguimos extrair facilmente
		// Nesse caso, retorna null e o usuário precisa fornecer a URL do produto
		if (url.hostname.includes("shope.ee") || url.hostname.includes("s.shopee")) {
			return null;
		}

		// Se já é uma URL de produto da Shopee, retorna ela mesma
		if (url.hostname.includes("shopee.com.br") && url.pathname.includes("-i.")) {
			return affiliateUrl;
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Verifica se as credenciais da Shopee estão configuradas
 */
export function isShopeeConfigured(): boolean {
	return !!(process.env.SHOPEE_APP_ID && process.env.SHOPEE_SECRET);
}
