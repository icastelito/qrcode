import { createHash, randomUUID } from "crypto";

/**
 * Aplica hash no IP para anonimização (LGPD/GDPR)
 */
export function hashIP(ip: string): string {
	const salt = process.env.IP_HASH_SALT || "default-salt-change-in-production";
	return createHash("sha256").update(`${ip}${salt}`).digest("hex").substring(0, 16);
}

/**
 * Gera um ID de sessão único
 */
export function generateSessionId(): string {
	return randomUUID();
}

/**
 * Informações completas extraídas do User-Agent
 */
export interface UserAgentInfo {
	device: string;
	isMobile: boolean;
	platform: string;
	osVersion: string | null;
	browser: string;
	browserVersion: string | null;
	isBot: boolean;
}

/**
 * Extrai informações detalhadas do User-Agent
 */
export function parseUserAgent(userAgent: string | null): UserAgentInfo {
	if (!userAgent) {
		return {
			device: "unknown",
			isMobile: false,
			platform: "unknown",
			osVersion: null,
			browser: "unknown",
			browserVersion: null,
			isBot: false,
		};
	}

	const ua = userAgent.toLowerCase();

	// Detecta se é bot
	const isBot = /bot|crawler|spider|crawling|facebookexternalhit|slurp|googlebot|bingbot|yandex|baidu|duckduck/i.test(
		ua
	);

	// Detecta dispositivo
	let device = "desktop";
	let isMobile = false;
	if (/mobile|android(?!.*tablet)|iphone|ipod|blackberry|windows phone/i.test(ua)) {
		device = "mobile";
		isMobile = true;
	} else if (/tablet|ipad|android(?=.*tablet)/i.test(ua)) {
		device = "tablet";
		isMobile = true;
	}

	// Detecta plataforma/OS e versão
	let platform = "unknown";
	let osVersion: string | null = null;

	if (/windows nt (\d+\.\d+)/i.test(ua)) {
		platform = "Windows";
		const match = ua.match(/windows nt (\d+\.\d+)/i);
		if (match) {
			const ntVersion = match[1];
			const windowsVersions: Record<string, string> = {
				"10.0": "10/11",
				"6.3": "8.1",
				"6.2": "8",
				"6.1": "7",
				"6.0": "Vista",
				"5.1": "XP",
			};
			osVersion = windowsVersions[ntVersion] || ntVersion;
		}
	} else if (/mac os x (\d+[._]\d+[._]?\d*)/i.test(ua)) {
		platform = "macOS";
		const match = ua.match(/mac os x (\d+[._]\d+[._]?\d*)/i);
		osVersion = match ? match[1].replace(/_/g, ".") : null;
	} else if (/android (\d+\.?\d*\.?\d*)/i.test(ua)) {
		platform = "Android";
		const match = ua.match(/android (\d+\.?\d*\.?\d*)/i);
		osVersion = match ? match[1] : null;
	} else if (/(?:iphone|ipad|ipod).*os (\d+[._]\d+)/i.test(ua)) {
		platform = "iOS";
		const match = ua.match(/os (\d+[._]\d+)/i);
		osVersion = match ? match[1].replace(/_/g, ".") : null;
	} else if (/linux/i.test(ua)) {
		platform = "Linux";
	} else if (/cros/i.test(ua)) {
		platform = "Chrome OS";
	}

	// Detecta navegador e versão
	let browser = "unknown";
	let browserVersion: string | null = null;

	if (/edg\/(\d+\.?\d*)/i.test(ua)) {
		browser = "Edge";
		const match = ua.match(/edg\/(\d+\.?\d*)/i);
		browserVersion = match ? match[1] : null;
	} else if (/opr\/(\d+\.?\d*)/i.test(ua) || /opera\/(\d+\.?\d*)/i.test(ua)) {
		browser = "Opera";
		const match = ua.match(/(?:opr|opera)\/(\d+\.?\d*)/i);
		browserVersion = match ? match[1] : null;
	} else if (/chrome\/(\d+\.?\d*)/i.test(ua) && !/chromium/i.test(ua)) {
		browser = "Chrome";
		const match = ua.match(/chrome\/(\d+\.?\d*)/i);
		browserVersion = match ? match[1] : null;
	} else if (/safari\/(\d+\.?\d*)/i.test(ua) && !/chrome/i.test(ua)) {
		browser = "Safari";
		const match = ua.match(/version\/(\d+\.?\d*)/i);
		browserVersion = match ? match[1] : null;
	} else if (/firefox\/(\d+\.?\d*)/i.test(ua)) {
		browser = "Firefox";
		const match = ua.match(/firefox\/(\d+\.?\d*)/i);
		browserVersion = match ? match[1] : null;
	} else if (/msie (\d+\.?\d*)/i.test(ua) || /trident.*rv:(\d+\.?\d*)/i.test(ua)) {
		browser = "Internet Explorer";
		const match = ua.match(/(?:msie |rv:)(\d+\.?\d*)/i);
		browserVersion = match ? match[1] : null;
	} else if (/samsung/i.test(ua)) {
		browser = "Samsung Internet";
		const match = ua.match(/samsungbrowser\/(\d+\.?\d*)/i);
		browserVersion = match ? match[1] : null;
	}

	return {
		device,
		isMobile,
		platform,
		osVersion,
		browser,
		browserVersion,
		isBot,
	};
}

/**
 * Extrai parâmetros UTM da URL
 */
export interface UTMParams {
	utmSource: string | null;
	utmMedium: string | null;
	utmCampaign: string | null;
	utmTerm: string | null;
	utmContent: string | null;
}

export function extractUTMParams(url: URL): UTMParams {
	return {
		utmSource: url.searchParams.get("utm_source"),
		utmMedium: url.searchParams.get("utm_medium"),
		utmCampaign: url.searchParams.get("utm_campaign"),
		utmTerm: url.searchParams.get("utm_term"),
		utmContent: url.searchParams.get("utm_content"),
	};
}

/**
 * Extrai o IP real do request (considerando proxies)
 */
export function getClientIP(headers: Headers): string {
	// Verifica headers comuns de proxy reverso
	const forwarded = headers.get("x-forwarded-for");
	if (forwarded) {
		// Pega o primeiro IP da lista (cliente original)
		return forwarded.split(",")[0].trim();
	}

	const realIP = headers.get("x-real-ip");
	if (realIP) {
		return realIP;
	}

	// Cloudflare
	const cfIP = headers.get("cf-connecting-ip");
	if (cfIP) {
		return cfIP;
	}

	return "0.0.0.0";
}

/**
 * Extrai idioma preferido do header Accept-Language
 */
export function extractLanguage(headers: Headers): string | null {
	const acceptLanguage = headers.get("accept-language");
	if (!acceptLanguage) return null;

	// Pega o primeiro idioma da lista
	const match = acceptLanguage.match(/^([a-zA-Z]{2}(-[a-zA-Z]{2})?)/);
	return match ? match[1] : null;
}

/**
 * Detecta método de scan baseado no referer e user-agent
 */
export function detectScanMethod(headers: Headers, userAgent: string | null): string {
	const referer = headers.get("referer");

	// Se não tem referer, provavelmente foi escaneado direto
	if (!referer) {
		return "camera";
	}

	// Se o referer é de um app de câmera ou leitor QR conhecido
	if (/qr|scanner|camera|lens/i.test(referer)) {
		return "camera";
	}

	// Se veio de um site
	if (/^https?:\/\//i.test(referer)) {
		return "link_direto";
	}

	return "unknown";
}

/**
 * Informações de geolocalização do Cloudflare (se disponível)
 */
export interface CloudflareGeoInfo {
	country: string | null;
	region: string | null;
	city: string | null;
	timezone: string | null;
	latitude: number | null;
	longitude: number | null;
}

export function extractCloudflareGeo(headers: Headers): CloudflareGeoInfo {
	return {
		country: headers.get("cf-ipcountry"),
		region: headers.get("cf-region"),
		city: headers.get("cf-ipcity"),
		timezone: headers.get("cf-timezone"),
		latitude: headers.get("cf-iplat") ? parseFloat(headers.get("cf-iplat")!) : null,
		longitude: headers.get("cf-iplon") ? parseFloat(headers.get("cf-iplon")!) : null,
	};
}

/**
 * Dados completos de tracking
 */
export interface TrackingData {
	ipHash: string;
	sessionId: string;
	userAgent: string | null;
	device: string;
	isMobile: boolean;
	browser: string;
	browserVersion: string | null;
	platform: string;
	osVersion: string | null;
	country: string | null;
	region: string | null;
	city: string | null;
	timezone: string | null;
	latitude: number | null;
	longitude: number | null;
	referer: string | null;
	utmSource: string | null;
	utmMedium: string | null;
	utmCampaign: string | null;
	utmTerm: string | null;
	utmContent: string | null;
	language: string | null;
	scanMethod: string;
	isBot: boolean;
}

/**
 * Coleta todos os dados de tracking de uma requisição
 */
export function collectTrackingData(request: Request): TrackingData {
	const headers = request.headers;
	const url = new URL(request.url);
	const userAgent = headers.get("user-agent");
	const ip = getClientIP(headers);

	const uaInfo = parseUserAgent(userAgent);
	const utmParams = extractUTMParams(url);
	const geoInfo = extractCloudflareGeo(headers);

	return {
		ipHash: hashIP(ip),
		sessionId: generateSessionId(),
		userAgent,
		device: uaInfo.device,
		isMobile: uaInfo.isMobile,
		browser: uaInfo.browser,
		browserVersion: uaInfo.browserVersion,
		platform: uaInfo.platform,
		osVersion: uaInfo.osVersion,
		country: geoInfo.country,
		region: geoInfo.region,
		city: geoInfo.city,
		timezone: geoInfo.timezone,
		latitude: geoInfo.latitude,
		longitude: geoInfo.longitude,
		referer: headers.get("referer"),
		utmSource: utmParams.utmSource,
		utmMedium: utmParams.utmMedium,
		utmCampaign: utmParams.utmCampaign,
		utmTerm: utmParams.utmTerm,
		utmContent: utmParams.utmContent,
		language: extractLanguage(headers),
		scanMethod: detectScanMethod(headers, userAgent),
		isBot: uaInfo.isBot,
	};
}
