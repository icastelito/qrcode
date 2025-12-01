"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoTrash, IoCreate, IoWarning } from "react-icons/io5";

interface QRCodeListActionsProps {
	qrId: string;
	qrName: string;
}

export default function QRCodeListActions({ qrId, qrName }: QRCodeListActionsProps) {
	const router = useRouter();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/qr/${qrId}/delete`, {
				method: "DELETE",
			});

			if (response.ok) {
				setShowDeleteModal(false);
				router.refresh();
			} else {
				const data = await response.json();
				alert(data.error || "Erro ao deletar QR Code");
			}
		} catch {
			alert("Erro ao deletar QR Code");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<div className="flex items-center gap-2">
				<button
					onClick={() => router.push(`/dashboard/qr/${qrId}/edit`)}
					className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
					title="Editar estilo"
				>
					<IoCreate className="w-5 h-5" />
				</button>
				<button
					onClick={() => setShowDeleteModal(true)}
					className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
					title="Excluir"
				>
					<IoTrash className="w-5 h-5" />
				</button>
			</div>

			{/* Modal de confirmação */}
			{showDeleteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
					<div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
								<IoWarning className="w-6 h-6 text-red-600" />
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">Excluir QR Code</h3>
								<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
									Tem certeza que deseja excluir o QR Code <strong>&quot;{qrName}&quot;</strong>? Esta
									ação não pode ser desfeita e todos os dados de rastreamento serão perdidos.
								</p>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-3">
							<button
								onClick={() => setShowDeleteModal(false)}
								disabled={isDeleting}
								className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								onClick={handleDelete}
								disabled={isDeleting}
								className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
							>
								{isDeleting ? (
									<>
										<svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
												fill="none"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										Excluindo...
									</>
								) : (
									<>
										<IoTrash className="w-4 h-4" />
										Excluir
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
