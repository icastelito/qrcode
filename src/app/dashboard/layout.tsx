import Link from "next/link";
import { IoQrCode, IoStorefront, IoAddCircle, IoList, IoMenu } from "react-icons/io5";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Navbar */}
			<nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
				<div className="max-w-[1920px] 2xl:max-w-[2560px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
					<div className="flex justify-between h-14 sm:h-16">
						<div className="flex items-center w-full">
							{/* Logo */}
							<Link
								href="/dashboard/qr"
								className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 sm:gap-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors shrink-0"
							>
								<IoQrCode className="w-6 h-6 sm:w-7 sm:h-7" />
								<span className="hidden xs:inline">QR Tracker</span>
							</Link>

							{/* Menu Principal - Desktop */}
							<div className="hidden sm:flex ml-4 md:ml-10 items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
								<Link
									href="/dashboard/qr"
									className="text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium flex items-center gap-1 md:gap-1.5 transition-colors"
								>
									<IoList className="w-4 h-4" />
									<span className="hidden md:inline">QR Codes</span>
									<span className="md:hidden">QRs</span>
								</Link>
								<Link
									href="/dashboard/qr/new"
									className="text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium flex items-center gap-1 md:gap-1.5 transition-colors"
								>
									<IoAddCircle className="w-4 h-4" />
									<span className="hidden lg:inline">Novo QR</span>
									<span className="lg:hidden">+</span>
								</Link>
								<Link
									href="/dashboard/affiliate"
									className="text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium flex items-center gap-1 md:gap-1.5 transition-colors"
								>
									<IoStorefront className="w-4 h-4" />
									<span className="hidden md:inline">Afiliados</span>
								</Link>
							</div>

							{/* Menu Principal - Mobile */}
							<div className="flex sm:hidden ml-auto items-center gap-1">
								<Link
									href="/dashboard/qr"
									className="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors"
									title="QR Codes"
								>
									<IoList className="w-5 h-5" />
								</Link>
								<Link
									href="/dashboard/qr/new"
									className="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors"
									title="Novo QR"
								>
									<IoAddCircle className="w-5 h-5" />
								</Link>
								<Link
									href="/dashboard/affiliate"
									className="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors"
									title="Afiliados"
								>
									<IoStorefront className="w-5 h-5" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</nav>

			{/* Content */}
			<main className="w-[95%] sm:w-[90%] lg:w-[85%] xl:w-[80%] mx-auto">{children}</main>
		</div>
	);
}
