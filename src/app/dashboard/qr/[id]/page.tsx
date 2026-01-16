import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTimeBR, formatDateBR, toISODateBR, getDaysAgoBR, getTodayStartBR } from "@/lib/date-utils";
import {
	IoArrowBack,
	IoDownload,
	IoGlobe,
	IoPhonePortrait,
	IoDesktop,
	IoTabletPortrait,
	IoTime,
	IoPerson,
	IoLocation,
} from "react-icons/io5";
import QRCodeActions from "@/components/QRCodeActions";

// Desativa cache da página para sempre mostrar dados atualizados
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
	params: Promise<{ id: string }>;
}

interface StatItem {
	name: string;
	count: number;
}

interface AccessLog {
	id: string;
	timestamp: Date;
	device: string | null;
	browser: string | null;
	platform: string | null;
	country: string | null;
	city: string | null;
	isUniqueVisitor: boolean;
	isMobile: boolean;
}

async function getQRCodeDetails(id: string) {
	const qrCode = await prisma.qrCode.findUnique({
		where: { id },
		include: {
			_count: {
				select: { accessLogs: true },
			},
		},
	});
	return qrCode;
}

async function getAccessStats(qrId: string): Promise<{
	dailyStats: Record<string, number>;
	devices: StatItem[];
	platforms: StatItem[];
	countries: StatItem[];
	browsers: StatItem[];
	cities: StatItem[];
	recentLogs: AccessLog[];
	uniqueVisitors: number;
	totalToday: number;
	totalThisWeek: number;
}> {
	// Acessos por dia (últimos 30 dias) - usando timezone do Brasil
	const thirtyDaysAgo = getDaysAgoBR(30);
	const today = getTodayStartBR();
	const weekAgo = getDaysAgoBR(7);

	const accessesByDay = await prisma.qrAccessLog.groupBy({
		by: ["timestamp"],
		where: {
			qrId,
			timestamp: { gte: thirtyDaysAgo },
		},
		_count: true,
	});

	// Agrupa por dia (usando timezone do Brasil)
	const dailyStats: Record<string, number> = {};
	for (const access of accessesByDay) {
		const day = toISODateBR(access.timestamp);
		dailyStats[day] = (dailyStats[day] || 0) + access._count;
	}

	// Dispositivos
	const devices = await prisma.qrAccessLog.groupBy({
		by: ["device"],
		where: { qrId },
		_count: true,
		orderBy: { _count: { device: "desc" } },
	});

	// Plataformas
	const platforms = await prisma.qrAccessLog.groupBy({
		by: ["platform"],
		where: { qrId },
		_count: true,
		orderBy: { _count: { platform: "desc" } },
	});

	// Países
	const countries = await prisma.qrAccessLog.groupBy({
		by: ["country"],
		where: { qrId },
		_count: true,
		orderBy: { _count: { country: "desc" } },
	});

	// Browsers
	const browsers = await prisma.qrAccessLog.groupBy({
		by: ["browser"],
		where: { qrId },
		_count: true,
		orderBy: { _count: { browser: "desc" } },
	});

	// Cidades
	const cities = await prisma.qrAccessLog.groupBy({
		by: ["city"],
		where: { qrId },
		_count: true,
		orderBy: { _count: { city: "desc" } },
		take: 10,
	});

	// Últimos acessos
	const recentLogs = await prisma.qrAccessLog.findMany({
		where: { qrId },
		orderBy: { timestamp: "desc" },
		take: 20,
		select: {
			id: true,
			timestamp: true,
			device: true,
			browser: true,
			platform: true,
			country: true,
			city: true,
			isUniqueVisitor: true,
			isMobile: true,
		},
	});

	// Visitantes únicos
	const uniqueVisitors = await prisma.qrAccessLog.count({
		where: { qrId, isUniqueVisitor: true },
	});

	// Total hoje
	const totalToday = await prisma.qrAccessLog.count({
		where: { qrId, timestamp: { gte: today } },
	});

	// Total esta semana
	const totalThisWeek = await prisma.qrAccessLog.count({
		where: { qrId, timestamp: { gte: weekAgo } },
	});

	return {
		dailyStats,
		devices: devices.map((d) => ({ name: d.device || "Desconhecido", count: d._count })),
		platforms: platforms.map((p) => ({ name: p.platform || "Desconhecido", count: p._count })),
		countries: countries.map((c) => ({ name: c.country || "Desconhecido", count: c._count })),
		browsers: browsers.map((b) => ({ name: b.browser || "Desconhecido", count: b._count })),
		cities: cities.map((c) => ({ name: c.city || "Desconhecido", count: c._count })),
		recentLogs,
		uniqueVisitors,
		totalToday,
		totalThisWeek,
	};
}

export default async function QRCodeDetailPage({ params }: PageProps) {
	const { id } = await params;
	const qrCode = await getQRCodeDetails(id);

	if (!qrCode) {
		notFound();
	}

	const stats = await getAccessStats(id);
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const trackingUrl = `${baseUrl}/r/${qrCode.id}`;

	// Cache buster baseado no updatedAt para forçar reload da imagem após edição
	const cacheBuster = qrCode.updatedAt ? new Date(qrCode.updatedAt).getTime() : 0;

	// Prepara dados do gráfico (últimos 14 dias) - usando timezone do Brasil
	const chartData: { date: string; count: number }[] = [];
	for (let i = 13; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		const dateStr = toISODateBR(date);
		chartData.push({
			date: dateStr,
			count: stats.dailyStats[dateStr] || 0,
		});
	}

	const maxCount = Math.max(...chartData.map((d) => d.count), 1);

	// Calcula total de acessos do período do gráfico
	const totalChartPeriod = chartData.reduce((sum, d) => sum + d.count, 0);

	// Helper para ícone de dispositivo
	const getDeviceIcon = (device: string | null) => {
		switch (device?.toLowerCase()) {
			case "mobile":
				return <IoPhonePortrait className="w-4 h-4" />;
			case "tablet":
				return <IoTabletPortrait className="w-4 h-4" />;
			default:
				return <IoDesktop className="w-4 h-4" />;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
				{/* Breadcrumb */}
				<nav className="mb-4">
					<Link
						href="/dashboard/qr"
						className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm sm:text-base"
					>
						<IoArrowBack className="w-4 h-4" /> <span className="hidden sm:inline">Voltar para lista</span>
						<span className="sm:hidden">Voltar</span>
					</Link>
				</nav>

				{/* Header */}
				<div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
					{/* QR Code Image */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 flex flex-col items-center">
						<Image
							src={`/api/qr/${qrCode.id}?v=${cacheBuster}`}
							alt={`QR Code: ${qrCode.name}`}
							width={200}
							height={200}
							className="rounded-lg w-36 h-36 sm:w-48 sm:h-48 lg:w-[200px] lg:h-[200px]"
							unoptimized
						/>
						<a
							href={`/api/qr/${qrCode.id}?v=${cacheBuster}`}
							download={`qr-${qrCode.name}.png`}
							className="mt-3 sm:mt-4 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center gap-1"
						>
							<IoDownload className="w-4 h-4" /> Download PNG
						</a>
					</div>

					{/* Info */}
					<div className="flex-1">
						<div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
							<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
								{qrCode.name}
							</h1>
							<QRCodeActions qrId={qrCode.id} qrName={qrCode.name} />
						</div>
						<div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">
							<p>
								<span className="font-medium">URL Destino:</span>{" "}
								<a
									href={qrCode.targetUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:underline break-all"
								>
									{qrCode.targetUrl}
								</a>
							</p>
							<p>
								<span className="font-medium">URL de Rastreamento:</span>{" "}
								<code className="bg-gray-100 dark:bg-gray-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm break-all">
									{trackingUrl}
								</code>
							</p>
							<p>
								<span className="font-medium">Criado em:</span> {formatDateTimeBR(qrCode.createdAt)}
							</p>
						</div>

						{/* Cards de métricas */}
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
							<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
								<p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Total de Acessos</p>
								<p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
									{qrCode._count.accessLogs}
								</p>
							</div>
							<div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4">
								<p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
									Visitantes Únicos
								</p>
								<p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">
									{stats.uniqueVisitors}
								</p>
							</div>
							<div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4">
								<p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">Hoje</p>
								<p className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
									{stats.totalToday}
								</p>
							</div>
							<div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 sm:p-4">
								<p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">Esta Semana</p>
								<p className="text-lg sm:text-2xl font-bold text-orange-700 dark:text-orange-300">
									{stats.totalThisWeek}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Gráfico de Acessos por Dia */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
						<h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
							Acessos por Dia
						</h2>
						<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
							Últimos 14 dias • {totalChartPeriod} acessos
						</span>
					</div>

					{/* Gráfico de barras melhorado */}
					<div className="relative h-48 sm:h-64 overflow-x-auto">
						{/* Linhas de grade horizontais */}
						<div className="absolute inset-0 flex flex-col justify-between min-w-[400px] sm:min-w-0">
							{[0, 1, 2, 3, 4].map((i) => (
								<div key={i} className="flex items-center">
									<span className="text-xs text-gray-400 w-6 sm:w-8 text-right mr-2 sm:mr-3">
										{Math.round(maxCount - (maxCount / 4) * i)}
									</span>
									<div className="flex-1 border-t border-gray-100 dark:border-gray-700" />
								</div>
							))}
						</div>

						{/* Área do gráfico */}
						<div className="absolute inset-0 pl-8 sm:pl-11 pt-2 pb-6 sm:pb-8 flex items-end gap-0.5 sm:gap-1 min-w-[400px] sm:min-w-0">
							{chartData.map((day, index) => {
								const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
								const isToday = index === chartData.length - 1;
								return (
									<div
										key={day.date}
										className="flex-1 flex flex-col items-center group relative h-full justify-end"
									>
										{/* Barra */}
										<div
											className={`w-full rounded-t-md transition-all duration-200 ${
												isToday
													? "bg-gradient-to-t from-green-500 to-green-400 hover:from-green-600 hover:to-green-500"
													: "bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500"
											}`}
											style={{
												height: `${Math.max(heightPercent, day.count > 0 ? 3 : 0)}%`,
												minHeight: day.count > 0 ? "8px" : "0",
											}}
										>
											{/* Tooltip */}
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
												<div className="font-medium">{day.count} acessos</div>
												<div className="text-xs text-gray-300">
													{new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR", {
														timeZone: "America/Sao_Paulo",
														weekday: "short",
														day: "2-digit",
														month: "short",
													})}
												</div>
												<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
											</div>
										</div>

										{/* Valor acima da barra */}
										{day.count > 0 && (
											<span className="absolute bottom-full mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
												{day.count}
											</span>
										)}
									</div>
								);
							})}
						</div>

						{/* Labels do eixo X */}
						<div className="absolute bottom-0 left-8 sm:left-11 right-0 flex gap-0.5 sm:gap-1 min-w-[400px] sm:min-w-0">
							{chartData.map((day, index) => {
								const isToday = index === chartData.length - 1;
								return (
									<div key={day.date} className="flex-1 text-center">
										<span
											className={`text-[10px] sm:text-xs ${
												isToday
													? "font-semibold text-green-600 dark:text-green-400"
													: "text-gray-500 dark:text-gray-400"
											}`}
										>
											{day.date.slice(8)}/{day.date.slice(5, 7)}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Stats Grid - 2x3 */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
					{/* Dispositivos */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<div className="flex items-center gap-2 mb-3 sm:mb-4">
							<IoPhonePortrait className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
								Dispositivos
							</h3>
						</div>
						{stats.devices.length === 0 ? (
							<p className="text-gray-500">Nenhum dado</p>
						) : (
							<div className="space-y-3">
								{stats.devices.map((device) => {
									const percent = Math.round((device.count / qrCode._count.accessLogs) * 100);
									return (
										<div key={device.name}>
											<div className="flex justify-between items-center mb-1">
												<span className="text-gray-600 dark:text-gray-300 capitalize flex items-center gap-2">
													{getDeviceIcon(device.name)}
													{device.name}
												</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{device.count} ({percent}%)
												</span>
											</div>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className="bg-blue-500 h-2 rounded-full transition-all"
													style={{ width: `${percent}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Plataformas */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<div className="flex items-center gap-2 mb-3 sm:mb-4">
							<IoDesktop className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
								Plataformas
							</h3>
						</div>
						{stats.platforms.length === 0 ? (
							<p className="text-gray-500 text-sm">Nenhum dado</p>
						) : (
							<div className="space-y-2 sm:space-y-3">
								{stats.platforms.map((platform) => {
									const percent = Math.round((platform.count / qrCode._count.accessLogs) * 100);
									return (
										<div key={platform.name}>
											<div className="flex justify-between items-center mb-1 text-sm">
												<span className="text-gray-600 dark:text-gray-300">
													{platform.name}
												</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{platform.count} ({percent}%)
												</span>
											</div>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className="bg-purple-500 h-2 rounded-full transition-all"
													style={{ width: `${percent}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Navegadores */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<div className="flex items-center gap-2 mb-3 sm:mb-4">
							<IoGlobe className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
								Navegadores
							</h3>
						</div>
						{stats.browsers.length === 0 ? (
							<p className="text-gray-500 text-sm">Nenhum dado</p>
						) : (
							<div className="space-y-2 sm:space-y-3">
								{stats.browsers.slice(0, 5).map((browser) => {
									const percent = Math.round((browser.count / qrCode._count.accessLogs) * 100);
									return (
										<div key={browser.name}>
											<div className="flex justify-between items-center mb-1 text-sm">
												<span className="text-gray-600 dark:text-gray-300">{browser.name}</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{browser.count} ({percent}%)
												</span>
											</div>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className="bg-green-500 h-2 rounded-full transition-all"
													style={{ width: `${percent}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Países */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<div className="flex items-center gap-2 mb-3 sm:mb-4">
							<IoGlobe className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Países</h3>
						</div>
						{stats.countries.length === 0 ? (
							<p className="text-gray-500 text-sm">Nenhum dado</p>
						) : (
							<div className="space-y-2 sm:space-y-3">
								{stats.countries.slice(0, 5).map((country) => {
									const percent = Math.round((country.count / qrCode._count.accessLogs) * 100);
									return (
										<div key={country.name}>
											<div className="flex justify-between items-center mb-1 text-sm">
												<span className="text-gray-600 dark:text-gray-300">{country.name}</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{country.count} ({percent}%)
												</span>
											</div>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className="bg-orange-500 h-2 rounded-full transition-all"
													style={{ width: `${percent}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Cidades */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<div className="flex items-center gap-2 mb-3 sm:mb-4">
							<IoLocation className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
								Cidades
							</h3>
						</div>
						{stats.cities.length === 0 ? (
							<p className="text-gray-500 text-sm">Nenhum dado</p>
						) : (
							<div className="space-y-2 sm:space-y-3">
								{stats.cities.slice(0, 5).map((city) => {
									const percent = Math.round((city.count / qrCode._count.accessLogs) * 100);
									return (
										<div key={city.name}>
											<div className="flex justify-between items-center mb-1 text-sm">
												<span className="text-gray-600 dark:text-gray-300">{city.name}</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{city.count} ({percent}%)
												</span>
											</div>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className="bg-red-500 h-2 rounded-full transition-all"
													style={{ width: `${percent}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Resumo de Visitantes */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<div className="flex items-center gap-2 mb-3 sm:mb-4">
							<IoPerson className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Resumo</h3>
						</div>
						<div className="space-y-3 sm:space-y-4">
							<div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
								<span className="text-gray-600 dark:text-gray-300">Taxa de Retorno</span>
								<span className="font-bold text-indigo-600 dark:text-indigo-400">
									{qrCode._count.accessLogs > 0
										? Math.round(
												((qrCode._count.accessLogs - stats.uniqueVisitors) /
													qrCode._count.accessLogs) *
													100
										  )
										: 0}
									%
								</span>
							</div>
							<div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
								<span className="text-gray-600 dark:text-gray-300">Média Diária (14d)</span>
								<span className="font-bold text-indigo-600 dark:text-indigo-400">
									{(totalChartPeriod / 14).toFixed(1)}
								</span>
							</div>
							<div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
								<span className="text-gray-600 dark:text-gray-300">Pico do Período</span>
								<span className="font-bold text-indigo-600 dark:text-indigo-400">{maxCount}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Últimos Acessos */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
					<div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center gap-2">
							<IoTime className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
								Últimos Acessos
							</h3>
						</div>
					</div>
					{stats.recentLogs.length === 0 ? (
						<div className="p-4 sm:p-6 text-center text-gray-500 text-sm">Nenhum acesso registrado</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[600px]">
								<thead className="bg-gray-50 dark:bg-gray-700">
									<tr>
										<th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Data/Hora
										</th>
										<th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Dispositivo
										</th>
										<th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
											Navegador
										</th>
										<th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
											Plataforma
										</th>
										<th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
											Localização
										</th>
										<th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Tipo
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{stats.recentLogs.map((log) => (
										<tr
											key={log.id}
											className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
										>
											<td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
												{formatDateTimeBR(log.timestamp)}
											</td>
											<td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
												<span className="flex items-center gap-1 sm:gap-2 capitalize">
													{getDeviceIcon(log.device)}
													<span className="hidden sm:inline">{log.device || "—"}</span>
												</span>
											</td>
											<td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
												{log.browser || "—"}
											</td>
											<td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
												{log.platform || "—"}
											</td>
											<td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
												{log.city && log.country
													? `${log.city}, ${log.country}`
													: log.country || "—"}
											</td>
											<td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
												{log.isUniqueVisitor ? (
													<span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
														Novo
													</span>
												) : (
													<span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
														Retorno
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
