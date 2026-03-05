import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTimeBR } from "@/lib/date-utils";
import {
	IoArrowBack,
	IoPhonePortrait,
	IoDesktop,
	IoTabletPortrait,
	IoGlobe,
	IoLocation,
	IoTime,
	IoShield,
	IoCodeSlash,
	IoSpeedometer,
	IoPerson,
} from "react-icons/io5";
import AccessLogMap from "@/components/AccessLogMap";

export const dynamic = "force-dynamic";

interface PageProps {
	params: Promise<{ id: string; logId: string }>;
}

function getDeviceIcon(device: string | null) {
	switch (device?.toLowerCase()) {
		case "mobile":
			return <IoPhonePortrait className="w-5 h-5 text-blue-500" />;
		case "tablet":
			return <IoTabletPortrait className="w-5 h-5 text-purple-500" />;
		default:
			return <IoDesktop className="w-5 h-5 text-gray-500" />;
	}
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
			<span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide sm:w-44 flex-shrink-0 pt-0.5">
				{label}
			</span>
			<span className="text-sm text-gray-900 dark:text-white break-all">{value ?? "—"}</span>
		</div>
	);
}

export default async function AccessLogDetailPage({ params }: PageProps) {
	const { id: qrId, logId } = await params;

	const log = await prisma.qrAccessLog.findUnique({
		where: { id: logId },
	});

	if (!log || log.qrId !== qrId) {
		notFound();
	}

	const qrCode = await prisma.qrCode.findUnique({
		where: { id: qrId },
		select: { id: true, name: true },
	});

	if (!qrCode) notFound();

	// Outros acessos do mesmo dispositivo (mesmo ipHash)
	const relatedLogs = await prisma.qrAccessLog.findMany({
		where: {
			qrId,
			ipHash: log.ipHash,
			id: { not: logId },
		},
		orderBy: { timestamp: "desc" },
		take: 20,
		select: {
			id: true,
			timestamp: true,
			device: true,
			browser: true,
			city: true,
			region: true,
			country: true,
			latitude: true,
			longitude: true,
			isUniqueVisitor: true,
			isMobile: true,
			platform: true,
		},
	});

	const hasLocation = log.latitude != null && log.longitude != null;

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="px-3 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
				{/* Breadcrumb */}
				<nav className="mb-5 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
					<Link
						href="/dashboard/qr"
						className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
					>
						QR Codes
					</Link>
					<span>/</span>
					<Link
						href={`/dashboard/qr/${qrId}`}
						className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
					>
						{qrCode.name}
					</Link>
					<span>/</span>
					<span className="text-gray-700 dark:text-gray-300">Detalhe do Acesso</span>
				</nav>

				{/* Botão voltar */}
				<div className="mb-6">
					<Link
						href={`/dashboard/qr/${qrId}`}
						className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
					>
						<IoArrowBack className="w-4 h-4" />
						Voltar para o QR Code
					</Link>
				</div>

				{/* Header */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow px-5 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						{getDeviceIcon(log.device)}
						<div>
							<h1 className="text-lg font-bold text-gray-900 dark:text-white">
								Acesso de {formatDateTimeBR(log.timestamp)}
							</h1>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{log.city && log.country
									? `${log.city}, ${log.region ? log.region + ", " : ""}${log.country}`
									: log.country || "Localização desconhecida"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{log.isUniqueVisitor ? (
							<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
								Novo visitante
							</span>
						) : (
							<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
								Visitante recorrente
							</span>
						)}
						{log.isBot && (
							<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
								Bot
							</span>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Coluna principal */}
					<div className="lg:col-span-2 space-y-6">
						{/* Mapa */}
						{hasLocation && (
							<div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
								<div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
									<IoLocation className="w-5 h-5 text-red-500" />
									<h2 className="font-semibold text-gray-900 dark:text-white">Localização GPS</h2>
								</div>
								<div className="p-4">
									<AccessLogMap
										latitude={log.latitude!}
										longitude={log.longitude!}
										label={log.city || "Localização do acesso"}
									/>
								</div>
							</div>
						)}

						{/* Dispositivo & Navegador */}
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow px-5 py-4">
							<div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
								{getDeviceIcon(log.device)}
								<h2 className="font-semibold text-gray-900 dark:text-white">Dispositivo e Navegador</h2>
							</div>
							<InfoRow label="Dispositivo" value={<span className="capitalize">{log.device}</span>} />
							<InfoRow label="É Mobile" value={log.isMobile ? "Sim" : "Não"} />
							<InfoRow label="Navegador" value={log.browser} />
							<InfoRow label="Versão Navegador" value={log.browserVersion} />
							<InfoRow label="Plataforma" value={log.platform} />
							<InfoRow label="Versão SO" value={log.osVersion} />
							<InfoRow
								label="Resolução de Tela"
								value={
									log.screenWidth && log.screenHeight
										? `${log.screenWidth} × ${log.screenHeight} px`
										: null
								}
							/>
							<InfoRow label="Idioma" value={log.language} />
							<InfoRow
								label="User Agent"
								value={
									log.userAgent ? (
										<span className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
											{log.userAgent}
										</span>
									) : null
								}
							/>
						</div>

						{/* Geolocalização */}
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow px-5 py-4">
							<div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
								<IoGlobe className="w-5 h-5 text-green-500" />
								<h2 className="font-semibold text-gray-900 dark:text-white">Geolocalização</h2>
							</div>
							<InfoRow label="País" value={log.country} />
							<InfoRow label="Região / Estado" value={log.region} />
							<InfoRow label="Cidade" value={log.city} />
							<InfoRow label="Fuso Horário" value={log.timezone} />
							<InfoRow label="Latitude" value={log.latitude != null ? log.latitude.toFixed(6) : null} />
							<InfoRow
								label="Longitude"
								value={log.longitude != null ? log.longitude.toFixed(6) : null}
							/>
						</div>

						{/* Rastreamento UTM */}
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow px-5 py-4">
							<div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
								<IoCodeSlash className="w-5 h-5 text-indigo-500" />
								<h2 className="font-semibold text-gray-900 dark:text-white">Origem & UTM</h2>
							</div>
							<InfoRow label="Referer" value={log.referer} />
							<InfoRow label="UTM Source" value={log.utmSource} />
							<InfoRow label="UTM Medium" value={log.utmMedium} />
							<InfoRow label="UTM Campaign" value={log.utmCampaign} />
							<InfoRow label="UTM Term" value={log.utmTerm} />
							<InfoRow label="UTM Content" value={log.utmContent} />
							<InfoRow label="Método de Scan" value={log.scanMethod} />
						</div>

						{/* Técnico */}
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow px-5 py-4">
							<div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
								<IoSpeedometer className="w-5 h-5 text-orange-500" />
								<h2 className="font-semibold text-gray-900 dark:text-white">Dados Técnicos</h2>
							</div>
							<InfoRow
								label="ID do Registro"
								value={<span className="font-mono text-xs">{log.id}</span>}
							/>
							<InfoRow
								label="Session ID"
								value={
									log.sessionId ? <span className="font-mono text-xs">{log.sessionId}</span> : null
								}
							/>
							<InfoRow
								label="IP (Anonimizado)"
								value={
									<span className="font-mono text-xs flex items-center gap-1">
										<IoShield className="w-3.5 h-3.5 text-green-500" />
										{log.ipHash}
									</span>
								}
							/>
							<InfoRow
								label="Tempo de Resposta"
								value={log.responseTime != null ? `${log.responseTime} ms` : null}
							/>
							<InfoRow
								label="Data/Hora (UTC)"
								value={
									<span className="font-mono text-xs">{new Date(log.timestamp).toISOString()}</span>
								}
							/>
						</div>
					</div>

					{/* Coluna lateral */}
					<div className="space-y-6">
						{/* Resumo */}
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow px-5 py-4">
							<div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
								<IoTime className="w-5 h-5 text-blue-500" />
								<h2 className="font-semibold text-gray-900 dark:text-white">Resumo</h2>
							</div>
							<div className="space-y-3">
								<div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
									<p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">
										Data e Hora
									</p>
									<p className="text-sm font-medium text-blue-800 dark:text-blue-300">
										{formatDateTimeBR(log.timestamp)}
									</p>
								</div>
								<div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
									<p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">
										Dispositivo
									</p>
									<p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize flex items-center gap-1.5">
										{getDeviceIcon(log.device)}
										{log.device || "Desconhecido"}
									</p>
								</div>
								{hasLocation && (
									<div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
										<p className="text-xs text-green-600 dark:text-green-400 font-medium mb-0.5">
											Coordenadas GPS
										</p>
										<p className="text-xs font-mono text-green-800 dark:text-green-300">
											{log.latitude!.toFixed(5)}, {log.longitude!.toFixed(5)}
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Outros acessos do mesmo dispositivo */}
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
							<div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
								<IoPerson className="w-5 h-5 text-purple-500" />
								<div>
									<h2 className="font-semibold text-gray-900 dark:text-white text-sm">
										Mesmo Dispositivo
									</h2>
									<p className="text-xs text-gray-400 dark:text-gray-500">
										{relatedLogs.length > 0
											? `${relatedLogs.length} outro${relatedLogs.length > 1 ? "s" : ""} acesso${relatedLogs.length > 1 ? "s" : ""}`
											: "Nenhum outro acesso"}
									</p>
								</div>
							</div>

							{relatedLogs.length === 0 ? (
								<div className="px-5 py-6 text-center text-gray-400 dark:text-gray-500">
									<IoDesktop className="w-8 h-8 mx-auto mb-2 opacity-40" />
									<p className="text-xs">Nenhum outro acesso deste dispositivo</p>
								</div>
							) : (
								<div className="divide-y divide-gray-50 dark:divide-gray-700">
									{relatedLogs.map((related) => (
										<Link
											key={related.id}
											href={`/dashboard/qr/${qrId}/logs/${related.id}`}
											className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<p className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
														{formatDateTimeBR(related.timestamp)}
													</p>
													<p className="text-xs text-gray-400 dark:text-gray-500 truncate">
														{related.city && related.country
															? `${related.city}, ${related.country}`
															: related.country || "—"}
													</p>
													{related.latitude != null && related.longitude != null && (
														<p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
															✓ GPS
														</p>
													)}
												</div>
												<span
													className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
														related.isUniqueVisitor
															? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
															: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
													}`}
												>
													{related.isUniqueVisitor ? "Novo" : "Retorno"}
												</span>
											</div>
										</Link>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
