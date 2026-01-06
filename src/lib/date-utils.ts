/**
 * Utilitários para formatação de datas no fuso horário do Brasil (America/Sao_Paulo)
 */

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

/**
 * Formata uma data para o padrão brasileiro (dd/mm/aaaa hh:mm:ss)
 * sempre usando o fuso horário de São Paulo
 */
export function formatDateTimeBR(date: Date | string): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return dateObj.toLocaleString("pt-BR", {
		timeZone: BRAZIL_TIMEZONE,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

/**
 * Formata uma data para o padrão brasileiro (dd/mm/aaaa)
 * sempre usando o fuso horário de São Paulo
 */
export function formatDateBR(date: Date | string): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return dateObj.toLocaleDateString("pt-BR", {
		timeZone: BRAZIL_TIMEZONE,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

/**
 * Formata hora para o padrão brasileiro (hh:mm)
 * sempre usando o fuso horário de São Paulo
 */
export function formatTimeBR(date: Date | string): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return dateObj.toLocaleTimeString("pt-BR", {
		timeZone: BRAZIL_TIMEZONE,
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Retorna a data atual no fuso horário de São Paulo
 */
export function getNowBR(): Date {
	return new Date(new Date().toLocaleString("en-US", { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Retorna o início do dia atual no fuso horário de São Paulo (em UTC para queries)
 */
export function getTodayStartBR(): Date {
	const now = new Date();
	const brDate = new Date(now.toLocaleString("en-US", { timeZone: BRAZIL_TIMEZONE }));
	brDate.setHours(0, 0, 0, 0);

	// Converte de volta para UTC considerando o offset do Brasil (-3h)
	const utcDate = new Date(brDate.getTime() + 3 * 60 * 60 * 1000);
	return utcDate;
}

/**
 * Retorna o início de X dias atrás no fuso horário de São Paulo (em UTC para queries)
 */
export function getDaysAgoBR(days: number): Date {
	const today = getTodayStartBR();
	today.setDate(today.getDate() - days);
	return today;
}

/**
 * Converte uma data UTC para string de data no formato ISO (YYYY-MM-DD)
 * considerando o fuso horário do Brasil
 */
export function toISODateBR(date: Date | string): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;

	// Formata no timezone brasileiro e extrai ano, mês, dia
	const formatted = dateObj.toLocaleDateString("en-CA", {
		timeZone: BRAZIL_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	return formatted; // Retorna no formato YYYY-MM-DD
}
