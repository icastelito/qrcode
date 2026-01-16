import Link from "next/link";
import { IoLockClosed } from "react-icons/io5";

export default function LinkInativoPage() {
	return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
			<div className="text-center max-w-md">
				<div className="flex justify-center mb-4 sm:mb-6">
					<div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-orange-600/20 rounded-full flex items-center justify-center">
						<IoLockClosed className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-orange-500" />
					</div>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Link Inativo</h1>
				<p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
					Este link foi desativado temporariamente. Por favor, tente novamente mais tarde ou entre em contato
					com o administrador.
				</p>
				<Link
					href="/"
					className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
				>
					Voltar ao início
				</Link>
			</div>
		</div>
	);
}
