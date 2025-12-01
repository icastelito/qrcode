import Link from "next/link";
import { IoQrCode } from "react-icons/io5";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Navbar */}
			<nav className="bg-white dark:bg-gray-800 shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<Link
								href="/dashboard/qr"
								className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
							>
								<IoQrCode className="w-6 h-6" /> QR Tracker
							</Link>
							<div className="ml-10 flex items-baseline space-x-4">
								<Link
									href="/dashboard/qr"
									className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
								>
									QR Codes
								</Link>
								<Link
									href="/dashboard/qr/new"
									className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
								>
									Novo QR
								</Link>
							</div>
						</div>
					</div>
				</div>
			</nav>

			{/* Content */}
			<main>{children}</main>
		</div>
	);
}
