// Dados GeoIP com múltiplas APIs de fallback
// Para melhor precisão em produção, considere MaxMind GeoIP2

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
 * Tenta buscar geolocalização via ip-api.com
 */
async function tryIpApi(ip: string): Promise<GeoData | null> {
	try {
		const response = await fetch(
			`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,lat,lon`,
			{ signal: AbortSignal.timeout(3000) }
		);

		if (!response.ok) return null;

		const data = await response.json();
		if (data.status !== "success") return null;

		return {
			country: data.country || null,
			region: data.regionName || null,
			city: data.city || null,
			timezone: data.timezone || null,
			latitude: data.lat || null,
			longitude: data.lon || null,
		};
	} catch {
		return null;
	}
}

/**
 * Tenta buscar geolocalização via ipwho.is (HTTPS, sem limite)
 */
async function tryIpWhois(ip: string): Promise<GeoData | null> {
	try {
		const response = await fetch(`https://ipwho.is/${ip}`, {
			signal: AbortSignal.timeout(3000),
		});

		if (!response.ok) return null;

		const data = await response.json();
		if (!data.success) return null;

		return {
			country: data.country || null,
			region: data.region || null,
			city: data.city || null,
			timezone: data.timezone?.id || null,
			latitude: data.latitude || null,
			longitude: data.longitude || null,
		};
	} catch {
		return null;
	}
}

/**
 * Tenta buscar geolocalização via ipapi.co (HTTPS, 1000 req/dia grátis)
 */
async function tryIpapiCo(ip: string): Promise<GeoData | null> {
	try {
		const response = await fetch(`https://ipapi.co/${ip}/json/`, {
			signal: AbortSignal.timeout(3000),
		});

		if (!response.ok) return null;

		const data = await response.json();
		if (data.error) return null;

		return {
			country: data.country_name || null,
			region: data.region || null,
			city: data.city || null,
			timezone: data.timezone || null,
			latitude: data.latitude || null,
			longitude: data.longitude || null,
		};
	} catch {
		return null;
	}
}

/**
 * Versão assíncrona que tenta múltiplas APIs em sequência
 * Retorna assim que uma delas funcionar
 */
export async function getGeoFromIPAsync(ip: string): Promise<GeoData> {
	if (isPrivateIP(ip)) {
		return LOCAL_GEO;
	}

	// Tenta as APIs em ordem de preferência
	// ipwho.is é HTTPS e sem limite rígido
	const result = (await tryIpWhois(ip)) || (await tryIpapiCo(ip)) || (await tryIpApi(ip));

	if (result) {
		console.log(`[GeoIP] Resolvido IP ${ip.substring(0, 8)}... -> ${result.city}, ${result.country}`);
		return result;
	}

	console.warn(`[GeoIP] Não foi possível resolver IP ${ip.substring(0, 8)}...`);
	return DEFAULT_GEO;
}
