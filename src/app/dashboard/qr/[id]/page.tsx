import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IoArrowBack, IoDownload } from "react-icons/io5";
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
}> {
	// Acessos por dia (últimos 30 dias)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const accessesByDay = await prisma.qrAccessLog.groupBy({
		by: ["timestamp"],
		where: {
			qrId,
			timestamp: { gte: thirtyDaysAgo },
		},
		_count: true,
	});

	// Agrupa por dia
	const dailyStats: Record<string, number> = {};
	for (const access of accessesByDay) {
		const day = new Date(access.timestamp).toISOString().split("T")[0];
		dailyStats[day] = (dailyStats[day] || 0) + access._count;
	}

	// Dispositivos
	const devices = await prisma.qrAccessLog.groupBy({
		by: ["device"],
		where: { qrId },
		_count: true,
	});

	// Plataformas
	const platforms = await prisma.qrAccessLog.groupBy({
		by: ["platform"],
		where: { qrId },
		_count: true,
	});

	// Países
	const countries = await prisma.qrAccessLog.groupBy({
		by: ["country"],
		where: { qrId },
		_count: true,
	});

	return {
		dailyStats,
		devices: devices.map((d) => ({ name: d.device || "Desconhecido", count: d._count })),
		platforms: platforms.map((p) => ({ name: p.platform || "Desconhecido", count: p._count })),
		countries: countries.map((c) => ({ name: c.country || "Desconhecido", count: c._count })),
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
	const cacheBuster = qrCode.updatedAt ? new Date(qrCode.updatedAt).getTime() : Date.now();

	// Prepara dados do gráfico (últimos 14 dias)
	const chartData: { date: string; count: number }[] = [];
	for (let i = 13; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split("T")[0];
		chartData.push({
			date: dateStr,
			count: stats.dailyStats[dateStr] || 0,
		});
	}

	const maxCount = Math.max(...chartData.map((d) => d.count), 1);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Breadcrumb */}
				<nav className="mb-4">
					<Link href="/dashboard/qr" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
						<IoArrowBack className="w-4 h-4" /> Voltar para lista
					</Link>
				</nav>

				{/* Header */}
				<div className="flex flex-col md:flex-row gap-8 mb-8">
					{/* QR Code Image */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
						<Image
							src={`/api/qr/${qrCode.id}?v=${cacheBuster}`}
							alt={`QR Code: ${qrCode.name}`}
							width={200}
							height={200}
							className="rounded-lg"
							unoptimized
						/>
						<a
							href={`/api/qr/${qrCode.id}?v=${cacheBuster}`}
							download={`qr-${qrCode.name}.png`}
							className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
						>
							<IoDownload className="w-4 h-4" /> Download PNG
						</a>
					</div>

					{/* Info */}
					<div className="flex-1">
						<div className="flex items-start justify-between mb-2">
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white">{qrCode.name}</h1>
							<QRCodeActions qrId={qrCode.id} qrName={qrCode.name} />
						</div>
						<div className="space-y-2 text-gray-600 dark:text-gray-300">
							<p>
								<span className="font-medium">URL Destino:</span>{" "}
								<a
									href={qrCode.targetUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:underline"
								>
									{qrCode.targetUrl}
								</a>
							</p>
							<p>
								<span className="font-medium">URL de Rastreamento:</span>{" "}
								<code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
									{trackingUrl}
								</code>
							</p>
							<p>
								<span className="font-medium">Criado em:</span>{" "}
								{new Date(qrCode.createdAt).toLocaleString("pt-BR")}
							</p>
							<p>
								<span className="font-medium">Total de acessos:</span>{" "}
								<span className="text-2xl font-bold text-blue-600">{qrCode._count.accessLogs}</span>
							</p>
						</div>
					</div>
				</div>

				{/* Gráfico de Acessos por Dia */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Acessos por Dia (últimos 14 dias)
					</h2>
					<div className="flex items-end gap-1 h-40">
						{chartData.map((day) => (
							<div key={day.date} className="flex-1 flex flex-col items-center">
								<div
									className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
									style={{
										height: `${(day.count / maxCount) * 100}%`,
										minHeight: day.count > 0 ? "4px" : "0",
									}}
									title={`${day.date}: ${day.count} acessos`}
								/>
								<span className="text-xs text-gray-400 mt-1 rotate-45 origin-left">
									{day.date.slice(5)}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Dispositivos */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dispositivos</h3>
						{stats.devices.length === 0 ? (
							<p className="text-gray-500">Nenhum dado</p>
						) : (
							<div className="space-y-3">
								{stats.devices.map((device) => (
									<div key={device.name} className="flex justify-between items-center">
										<span className="text-gray-600 dark:text-gray-300 capitalize">
											{device.name}
										</span>
										<span className="font-medium text-gray-900 dark:text-white">
											{device.count}
										</span>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Plataformas */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plataformas</h3>
						{stats.platforms.length === 0 ? (
							<p className="text-gray-500">Nenhum dado</p>
						) : (
							<div className="space-y-3">
								{stats.platforms.map((platform) => (
									<div key={platform.name} className="flex justify-between items-center">
										<span className="text-gray-600 dark:text-gray-300">{platform.name}</span>
										<span className="font-medium text-gray-900 dark:text-white">
											{platform.count}
										</span>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Países */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Países</h3>
						{stats.countries.length === 0 ? (
							<p className="text-gray-500">Nenhum dado</p>
						) : (
							<div className="space-y-3">
								{stats.countries.map((country) => (
									<div key={country.name} className="flex justify-between items-center">
										<span className="text-gray-600 dark:text-gray-300">{country.name}</span>
										<span className="font-medium text-gray-900 dark:text-white">
											{country.count}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
