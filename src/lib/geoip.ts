// Dados GeoIP simplificados baseados em ranges conhecidos
// Em produção, use uma lib como 'geoip-lite' ou serviço externo

interface GeoData {
	country: string | null;
	region: string | null;
	city: string | null;
	timezone: string | null;
	latitude: number | null;
	longitude: number | null;
}

const DEFAULT_GEO: GeoData = {
	country: null,
	region: null,
	city: null,
	timezone: null,
	latitude: null,
	longitude: null,
};

const LOCAL_GEO: GeoData = {
	country: "Local",
	region: "Local",
	city: "Local",
	timezone: null,
	latitude: null,
	longitude: null,
};

/**
 * Verifica se é IP privado/local
 */
function isPrivateIP(ip: string): boolean {
	return (
		ip.startsWith("192.168.") ||
		ip.startsWith("10.") ||
		ip.startsWith("172.16.") ||
		ip.startsWith("172.17.") ||
		ip.startsWith("172.18.") ||
		ip.startsWith("172.19.") ||
		ip.startsWith("172.2") ||
		ip.startsWith("172.30.") ||
		ip.startsWith("172.31.") ||
		ip === "127.0.0.1" ||
		ip === "0.0.0.0" ||
		ip === "::1" ||
		ip === "localhost"
	);
}

/**
 * Tenta resolver localização a partir do IP
 * Versão simplificada - em produção use geoip-lite ou MaxMind
 */
export function getGeoFromIP(ip: string): GeoData {
	if (isPrivateIP(ip)) {
		return LOCAL_GEO;
	}
	return DEFAULT_GEO;
}

/**
 * Versão assíncrona que pode chamar API externa
 * Exemplo com ip-api.com (gratuito para uso não-comercial)
 */
export async function getGeoFromIPAsync(ip: string): Promise<GeoData> {
	if (isPrivateIP(ip)) {
		return LOCAL_GEO;
	}

	try {
		// API gratuita - em produção use MaxMind ou similar
		// Campos: country, regionName, city, timezone, lat, lon
		const response = await fetch(
			`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,lat,lon`,
			{
				signal: AbortSignal.timeout(2000), // Timeout de 2s
			}
		);

		if (!response.ok) {
			return DEFAULT_GEO;
		}

		const data = await response.json();

		if (data.status !== "success") {
			return DEFAULT_GEO;
		}

		return {
			country: data.country || null,
			region: data.regionName || null,
			city: data.city || null,
			timezone: data.timezone || null,
			latitude: data.lat || null,
			longitude: data.lon || null,
		};
	} catch {
		// Falha silenciosa - não bloqueia o redirect
		return DEFAULT_GEO;
	}
}
