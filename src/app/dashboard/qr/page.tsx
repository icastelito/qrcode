import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IoArrowForward, IoAdd } from "react-icons/io5";
import QRCodeListActions from "@/components/QRCodeListActions";

// Força renderização dinâmica (não faz prerender no build)
export const dynamic = "force-dynamic";

type QRCodeWithCount = {
	id: string;
	name: string;
	targetUrl: string;
	style: unknown;
	createdAt: Date;
	_count: {
		accessLogs: number;
	};
};

async function getQRCodes(): Promise<QRCodeWithCount[]> {
	const qrCodes = await prisma.qrCode.findMany({
		orderBy: { createdAt: "desc" },
		include: {
			_count: {
				select: { accessLogs: true },
			},
		},
	});
	return qrCodes;
}

export default async function DashboardQRPage() {
	const qrCodes = await getQRCodes();

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">QR Codes</h1>
						<p className="mt-1 text-gray-500 dark:text-gray-400">Gerencie e monitore seus QR Codes</p>
					</div>
					<Link
						href="/dashboard/qr/new"
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
					>
						<IoAdd className="w-5 h-5" /> Novo QR Code
					</Link>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
						<p className="text-sm text-gray-500 dark:text-gray-400">Total de QR Codes</p>
						<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{qrCodes.length}</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
						<p className="text-sm text-gray-500 dark:text-gray-400">Total de Acessos</p>
						<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{qrCodes.reduce((acc, qr) => acc + qr._count.accessLogs, 0)}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
						<p className="text-sm text-gray-500 dark:text-gray-400">Média por QR</p>
						<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{qrCodes.length > 0
								? Math.round(
										qrCodes.reduce((acc, qr) => acc + qr._count.accessLogs, 0) / qrCodes.length
								  )
								: 0}
						</p>
					</div>
				</div>

				{/* QR Codes List */}
				{qrCodes.length === 0 ? (
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
						<p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum QR Code criado ainda</p>
						<Link
							href="/dashboard/qr/new"
							className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
						>
							Criar primeiro QR Code <IoArrowForward className="w-4 h-4" />
						</Link>
					</div>
				) : (
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
							<thead className="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Nome
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										URL Destino
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Criado em
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Acessos
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Ações
									</th>
								</tr>
							</thead>
							<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
								{qrCodes.map((qr) => (
									<tr key={qr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
										<td className="px-6 py-4 whitespace-nowrap">
											<Link
												href={`/dashboard/qr/${qr.id}`}
												className="text-gray-900 dark:text-white font-medium hover:text-blue-600"
											>
												{qr.name}
											</Link>
										</td>
										<td className="px-6 py-4">
											<a
												href={qr.targetUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-gray-500 dark:text-gray-400 hover:text-blue-600 truncate block max-w-xs"
											>
												{qr.targetUrl}
											</a>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
											{new Date(qr.createdAt).toLocaleDateString("pt-BR")}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
												{qr._count.accessLogs}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<div className="flex items-center justify-end gap-4">
												<Link
													href={`/dashboard/qr/${qr.id}`}
													className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
												>
													Ver detalhes
												</Link>
												<QRCodeListActions qrId={qr.id} qrName={qr.name} />
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
