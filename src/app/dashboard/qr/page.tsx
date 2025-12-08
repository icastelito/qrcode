import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IoAdd } from "react-icons/io5";
import QRCodeTable from "@/components/QRCodeTable";

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
				<QRCodeTable qrCodes={qrCodes} />
			</div>
		</div>
	);
}
