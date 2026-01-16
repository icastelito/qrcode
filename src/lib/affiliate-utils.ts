/**
 * Utilitários para o sistema de Links de Afiliados
 */

/**
 * Gera um slug único e amigável
 */
export function generateSlug(productName: string): string {
	const base = productName
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Remove acentos
		.replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
		.replace(/\s+/g, "-") // Espaços viram hífens
		.replace(/-+/g, "-") // Remove hífens duplicados
		.substring(0, 30) // Limita tamanho
		.replace(/^-|-$/g, ""); // Remove hífens do início/fim

	// Adiciona um sufixo aleatório para garantir unicidade
	const suffix = Math.random().toString(36).substring(2, 6);
	return `${base}-${suffix}`;
}

/**
 * Calcula os dias restantes até o link expirar (7 dias após o update)
 */
export function calculateDaysRemaining(updatedAt: Date): number {
	const now = new Date();
	const updateDate = new Date(updatedAt);
	const expirationDate = new Date(updateDate);
	expirationDate.setDate(expirationDate.getDate() + 7);

	const diffTime = expirationDate.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	// Retorna entre 0 e 7
	return Math.max(0, Math.min(7, diffDays));
}

/**
 * Retorna status baseado nos dias restantes
 */
export function getLinkStatus(daysRemaining: number): {
	status: "ok" | "warning" | "danger" | "expired";
	label: string;
	color: string;
} {
	if (daysRemaining <= 0) {
		return { status: "expired", label: "Expirado", color: "red" };
	}
	if (daysRemaining <= 2) {
		return { status: "danger", label: "Crítico", color: "red" };
	}
	if (daysRemaining <= 4) {
		return { status: "warning", label: "Atenção", color: "yellow" };
	}
	return { status: "ok", label: "OK", color: "green" };
}

/**
 * Detecta rede social de origem baseado no referer e user-agent
 */
export function detectSocialNetwork(referer: string | null, userAgent: string | null): string | null {
	const ref = (referer || "").toLowerCase();
	const ua = (userAgent || "").toLowerCase();

	// Instagram
	if (ref.includes("instagram.com") || ref.includes("l.instagram.com") || ua.includes("instagram")) {
		return "instagram";
	}

	// Facebook
	if (
		ref.includes("facebook.com") ||
		ref.includes("fb.com") ||
		ref.includes("l.facebook.com") ||
		ref.includes("lm.facebook.com") ||
		ua.includes("fban") ||
		ua.includes("fbav")
	) {
		return "facebook";
	}

	// TikTok
	if (
		ref.includes("tiktok.com") ||
		ref.includes("vm.tiktok.com") ||
		ua.includes("tiktok") ||
		ua.includes("musical_ly")
	) {
		return "tiktok";
	}

	// Twitter/X
	if (ref.includes("twitter.com") || ref.includes("x.com") || ref.includes("t.co") || ua.includes("twitter")) {
		return "twitter";
	}

	// LinkedIn
	if (ref.includes("linkedin.com") || ua.includes("linkedin")) {
		return "linkedin";
	}

	// WhatsApp
	if (ref.includes("whatsapp") || ua.includes("whatsapp")) {
		return "whatsapp";
	}

	// Telegram
	if (ref.includes("telegram") || ref.includes("t.me") || ua.includes("telegram")) {
		return "telegram";
	}

	// Pinterest
	if (ref.includes("pinterest.com") || ua.includes("pinterest")) {
		return "pinterest";
	}

	// YouTube
	if (ref.includes("youtube.com") || ref.includes("youtu.be")) {
		return "youtube";
	}

	// Reddit
	if (ref.includes("reddit.com")) {
		return "reddit";
	}

	// Kwai
	if (ref.includes("kwai.com") || ua.includes("kwai")) {
		return "kwai";
	}

	// Snapchat
	if (ref.includes("snapchat.com") || ua.includes("snapchat")) {
		return "snapchat";
	}

	return null;
}

/**
 * Valida URL de afiliado da Shopee
 */
export function isValidShopeeUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return (
			parsed.hostname.includes("shopee.com.br") ||
			parsed.hostname.includes("shope.ee") ||
			parsed.hostname.includes("s.shopee.com.br")
		);
	} catch {
		return false;
	}
}

/**
 * Formata data para exibição
 */
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

/**
 * Formata número para exibição (ex: 1.234)
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat("pt-BR").format(num);
}
