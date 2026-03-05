"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	IoPhonePortrait,
	IoDesktop,
	IoTabletPortrait,
	IoTime,
	IoChevronBack,
	IoChevronForward,
	IoFilter,
	IoRefresh,
	IoLocation,
} from "react-icons/io5";

interface AccessLog {
	id: string;
	timestamp: string;
	device: string | null;
	browser: string | null;
	browserVersion: string | null;
	platform: string | null;
	country: string | null;
	region: string | null;
	city: string | null;
	isUniqueVisitor: boolean;
	isMobile: boolean;
	latitude: number | null;
	longitude: number | null;
}

interface LogsResponse {
	logs: AccessLog[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface AccessLogsTableProps {
	qrId: string;
	availableDevices: string[];
	availableRegions: string[];
}

function formatDateTimeBR(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleString("pt-BR", {
		timeZone: "America/Sao_Paulo",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getDeviceIcon(device: string | null) {
	switch (device?.toLowerCase()) {
		case "mobile":
			return <IoPhonePortrait className="w-4 h-4 text-blue-500" />;
		case "tablet":
			return <IoTabletPortrait className="w-4 h-4 text-purple-500" />;
		default:
			return <IoDesktop className="w-4 h-4 text-gray-500" />;
	}
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AccessLogsTable({ qrId, availableDevices, availableRegions }: AccessLogsTableProps) {
	const router = useRouter();
	const [data, setData] = useState<LogsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);

	// Filtros
	const [filterDevice, setFilterDevice] = useState("");
	const [filterRegion, setFilterRegion] = useState("");
	const [filterCity, setFilterCity] = useState("");
	const [filterDateFrom, setFilterDateFrom] = useState("");
	const [filterDateTo, setFilterDateTo] = useState("");
	const [showFilters, setShowFilters] = useState(false);

	// Cidades disponíveis para o estado selecionado
	const [availableCities, setAvailableCities] = useState<string[]>([]);
	const [loadingCities, setLoadingCities] = useState(false);

	// Quando o estado muda, busca cidades daquele estado e limpa a cidade selecionada
	useEffect(() => {
		setFilterCity("");
		if (!filterRegion) {
			setAvailableCities([]);
			return;
		}
		setLoadingCities(true);
		fetch(`/api/qr/${qrId}/logs/filters?region=${encodeURIComponent(filterRegion)}`)
			.then((r) => r.json())
			.then((json) => setAvailableCities(json.cities ?? []))
			.finally(() => setLoadingCities(false));
	}, [filterRegion, qrId]);

	const fetchLogs = useCallback(async () => {
		setLoading(true);
		const params = new URLSearchParams();
		params.set("page", page.toString());
		params.set("limit", limit.toString());
		if (filterDevice) params.set("device", filterDevice);
		if (filterRegion) params.set("region", filterRegion);
		if (filterCity) params.set("city", filterCity);
		if (filterDateFrom) params.set("dateFrom", filterDateFrom);
		if (filterDateTo) params.set("dateTo", filterDateTo);

		try {
			const res = await fetch(`/api/qr/${qrId}/logs?${params.toString()}`);
			if (res.ok) {
				const json = await res.json();
				setData(json);
			}
		} finally {
			setLoading(false);
		}
	}, [qrId, page, limit, filterDevice, filterRegion, filterCity, filterDateFrom, filterDateTo]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	const handleFilter = () => {
		setPage(1);
		fetchLogs();
	};

	const clearFilters = () => {
		setFilterDevice("");
		setFilterRegion("");
		setFilterCity("");
		setFilterDateFrom("");
		setFilterDateTo("");
		setPage(1);
	};

	const hasActiveFilters = filterDevice || filterRegion || filterCity || filterDateFrom || filterDateTo;

	return (
		<div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
			{/* Header */}
			<div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<IoTime className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
						<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
							Acessos Registrados
						</h3>
						{data && (
							<span className="text-sm text-gray-500 dark:text-gray-400">
								({data.total.toLocaleString("pt-BR")} no total)
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setShowFilters(!showFilters)}
							className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
								showFilters || hasActiveFilters
									? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
									: "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
							}`}
						>
							<IoFilter className="w-4 h-4" />
							Filtros
							{hasActiveFilters && (
								<span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
									!
								</span>
							)}
						</button>
						<button
							onClick={fetchLogs}
							className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						>
							<IoRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
						</button>
					</div>
				</div>

				{/* Painel de filtros */}
				{showFilters && (
					<div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
							{/* Filtro dispositivo */}
							<div>
								<label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
									Dispositivo
								</label>
								<select
									value={filterDevice}
									onChange={(e) => setFilterDevice(e.target.value)}
									className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="">Todos os dispositivos</option>
									{availableDevices.map((d) => (
										<option key={d} value={d} className="capitalize">
											{d.charAt(0).toUpperCase() + d.slice(1)}
										</option>
									))}
								</select>
							</div>

							{/* Filtro estado */}
							<div>
								<label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
									Estado
								</label>
								<select
									value={filterRegion}
									onChange={(e) => setFilterRegion(e.target.value)}
									disabled={!!filterCity}
									className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
								>
									<option value="">Todos os estados</option>
									{availableRegions.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
								{!!filterCity && (
									<p className="text-[10px] text-gray-400 mt-0.5">
										Limpe a cidade para filtrar por estado
									</p>
								)}
							</div>

							{/* Filtro cidade */}
							<div>
								<label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
									Cidade
									{loadingCities && <span className="ml-1 text-gray-400">(carregando...)</span>}
								</label>
								<select
									value={filterCity}
									onChange={(e) => setFilterCity(e.target.value)}
									disabled={!filterRegion || loadingCities}
									className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
								>
									<option value="">
										{!filterRegion
											? "Selecione um estado"
											: availableCities.length === 0
												? "Nenhuma cidade"
												: "Todas as cidades"}
									</option>
									{availableCities.map((c) => (
										<option key={c} value={c}>
											{c}
										</option>
									))}
								</select>
							</div>

							{/* Data início */}
							<div>
								<label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
									Data início
								</label>
								<input
									type="date"
									value={filterDateFrom}
									onChange={(e) => setFilterDateFrom(e.target.value)}
									className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>

							{/* Data fim */}
							<div>
								<label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
									Data fim
								</label>
								<input
									type="date"
									value={filterDateTo}
									onChange={(e) => setFilterDateTo(e.target.value)}
									className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
						</div>

						<div className="flex gap-2 mt-3">
							<button
								onClick={handleFilter}
								className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
							>
								Aplicar Filtros
							</button>
							{hasActiveFilters && (
								<button
									onClick={clearFilters}
									className="px-4 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
								>
									Limpar
								</button>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Tabela */}
			{loading ? (
				<div className="p-12 flex items-center justify-center">
					<div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
						<IoRefresh className="w-5 h-5 animate-spin" />
						<span className="text-sm">Carregando acessos...</span>
					</div>
				</div>
			) : !data || data.logs.length === 0 ? (
				<div className="p-12 text-center text-gray-500 dark:text-gray-400">
					<IoTime className="w-8 h-8 mx-auto mb-2 opacity-40" />
					<p className="text-sm">
						{hasActiveFilters
							? "Nenhum acesso encontrado para os filtros selecionados."
							: "Nenhum acesso registrado ainda."}
					</p>
				</div>
			) : (
				<>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px]">
							<thead className="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th className="px-3 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Data/Hora
									</th>
									<th className="px-3 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Dispositivo
									</th>
									<th className="px-3 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
										Navegador
									</th>
									<th className="px-3 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
										Plataforma
									</th>
									<th className="px-3 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Localização
									</th>
									<th className="px-3 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Tipo
									</th>
									<th className="px-3 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
										GPS
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 dark:divide-gray-700">
								{data.logs.map((log) => (
									<tr
										key={log.id}
										className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
										onClick={() => router.push(`/dashboard/qr/${qrId}/logs/${log.id}`)}
									>
										<td className="px-3 sm:px-5 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
											<span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
												{formatDateTimeBR(log.timestamp)}
											</span>
										</td>
										<td className="px-3 sm:px-5 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
											<span className="flex items-center gap-1.5 capitalize">
												{getDeviceIcon(log.device)}
												<span className="hidden sm:inline">{log.device || "—"}</span>
											</span>
										</td>
										<td className="px-3 sm:px-5 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
											{log.browser
												? `${log.browser}${log.browserVersion ? ` ${log.browserVersion.split(".")[0]}` : ""}`
												: "—"}
										</td>
										<td className="px-3 sm:px-5 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
											{log.platform || "—"}
										</td>
										<td className="px-3 sm:px-5 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
											<span className="flex items-center gap-1">
												{(log.city || log.country) && (
													<IoLocation className="w-3 h-3 text-gray-400 flex-shrink-0" />
												)}
												{log.city && log.country
													? `${log.city}, ${log.country}`
													: log.city || log.country || "—"}
											</span>
										</td>
										<td className="px-3 sm:px-5 py-3 whitespace-nowrap">
											{log.isUniqueVisitor ? (
												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
													Novo
												</span>
											) : (
												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
													Retorno
												</span>
											)}
										</td>
										<td className="px-3 sm:px-5 py-3 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500 hidden lg:table-cell">
											{log.latitude && log.longitude ? (
												<span className="text-green-600 dark:text-green-400 font-medium">
													✓ GPS
												</span>
											) : (
												"—"
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Rodapé com paginação */}
					<div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
						{/* Info + tamanho de página */}
						<div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
							<span>
								{((page - 1) * limit + 1).toLocaleString("pt-BR")}–
								{Math.min(page * limit, data.total).toLocaleString("pt-BR")} de{" "}
								{data.total.toLocaleString("pt-BR")}
							</span>
							<span className="text-gray-300 dark:text-gray-600">|</span>
							<span className="flex items-center gap-1.5">
								Por página:
								<select
									value={limit}
									onChange={(e) => {
										setLimit(parseInt(e.target.value));
										setPage(1);
									}}
									className="text-sm border border-gray-200 dark:border-gray-600 rounded-md px-1.5 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
								>
									{PAGE_SIZE_OPTIONS.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
							</span>
						</div>

						{/* Botões de navegação */}
						<div className="flex items-center gap-1">
							<button
								onClick={() => setPage(1)}
								disabled={page === 1}
								className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
								title="Primeira página"
							>
								<IoChevronBack className="w-4 h-4" />
							</button>
							<button
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
								title="Página anterior"
							>
								<IoChevronBack className="w-4 h-4" />
							</button>

							{/* Números de página */}
							{Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
								let pageNum: number;
								if (data.totalPages <= 5) {
									pageNum = i + 1;
								} else if (page <= 3) {
									pageNum = i + 1;
								} else if (page >= data.totalPages - 2) {
									pageNum = data.totalPages - 4 + i;
								} else {
									pageNum = page - 2 + i;
								}
								return (
									<button
										key={pageNum}
										onClick={() => setPage(pageNum)}
										className={`w-8 h-8 text-sm rounded-md transition-colors ${
											pageNum === page
												? "bg-blue-600 text-white font-medium"
												: "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
										}`}
									>
										{pageNum}
									</button>
								);
							})}

							<button
								onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
								disabled={page === data.totalPages}
								className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
								title="Próxima página"
							>
								<IoChevronForward className="w-4 h-4" />
							</button>
							<button
								onClick={() => setPage(data.totalPages)}
								disabled={page === data.totalPages}
								className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
								title="Última página"
							>
								<IoChevronForward className="w-4 h-4" />
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
