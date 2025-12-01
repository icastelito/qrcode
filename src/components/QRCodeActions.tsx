"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoTrash, IoCreate, IoWarning } from "react-icons/io5";

interface QRCodeActionsProps {
	qrId: string;
	qrName: string;
}

export default function QRCodeActions({ qrId, qrName }: QRCodeActionsProps) {
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
				router.push("/dashboard/qr");
				router.refresh();
			} else {
				const data = await response.json();
				alert(data.error || "Erro ao deletar QR Code");
			}
		} catch (error) {
			console.error("Erro ao deletar:", error);
			alert("Erro ao deletar QR Code");
		} finally {
			setIsDeleting(false);
			setShowDeleteModal(false);
		}
	};

	return (
		<>
			<div className="flex gap-3">
				<button
					onClick={() => router.push(`/dashboard/qr/${qrId}/edit`)}
					className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
				>
					<IoCreate className="w-4 h-4" />
					Editar Estilo
				</button>
				<button
					onClick={() => setShowDeleteModal(true)}
					className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
				>
					<IoTrash className="w-4 h-4" />
					Deletar
				</button>
			</div>

			{/* Modal de confirmação de exclusão */}
			{showDeleteModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
						<div className="flex items-center gap-3 text-red-600 mb-4">
							<IoWarning className="w-8 h-8" />
							<h3 className="text-xl font-bold">Confirmar Exclusão</h3>
						</div>
						<p className="text-gray-600 dark:text-gray-300 mb-2">
							Tem certeza que deseja deletar o QR Code <strong>&quot;{qrName}&quot;</strong>?
						</p>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
							Esta ação é irreversível. Todos os dados de rastreamento associados também serão excluídos.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowDeleteModal(false)}
								disabled={isDeleting}
								className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={handleDelete}
								disabled={isDeleting}
								className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
							>
								{isDeleting ? "Deletando..." : "Sim, Deletar"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
