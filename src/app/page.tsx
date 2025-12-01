import Link from "next/link";
import { IoQrCode } from "react-icons/io5";

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
			<main className="text-center px-4">
				<h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
					<IoQrCode className="w-12 h-12" /> QR Code Tracker
				</h1>
				<p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
					Crie, gerencie e rastreie seus QR Codes com análises detalhadas de acesso.
				</p>
				<div className="flex gap-4 justify-center">
					<Link
						href="/dashboard/qr"
						className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
					>
						Acessar Dashboard
					</Link>
					<Link
						href="/dashboard/qr/new"
						className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium px-6 py-3 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
					>
						Criar QR Code
					</Link>
				</div>
			</main>
		</div>
	);
}
