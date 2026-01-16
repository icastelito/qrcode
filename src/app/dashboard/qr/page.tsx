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
			<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">QR Codes</h1>
						<p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">
							Gerencie e monitore seus QR Codes
						</p>
					</div>
					<Link
						href="/dashboard/qr/new"
						className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
					>
						<IoAdd className="w-5 h-5" /> <span>Novo QR Code</span>
					</Link>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total de QR Codes</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{qrCodes.length}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total de Acessos</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{qrCodes.reduce((acc, qr) => acc + qr._count.accessLogs, 0)}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 col-span-2 lg:col-span-1">
						<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Média por QR</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
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
