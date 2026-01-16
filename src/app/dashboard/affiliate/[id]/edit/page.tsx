"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IoArrowBack, IoSave, IoTrash, IoStorefront, IoRefresh, IoWarning } from "react-icons/io5";
import { calculateDaysRemaining, getLinkStatus, formatDate } from "@/lib/affiliate-utils";

interface AffiliateLink {
	id: string;
	slug: string;
	productName: string;
	productImage: string | null;
	affiliateUrl: string;
	createdBy: string;
	isActive: boolean;
	category: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export default function EditAffiliateLinkPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [link, setLink] = useState<AffiliateLink | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		productName: "",
		affiliateUrl: "",
		category: "",
		notes: "",
		productImage: "",
		isActive: true,
	});

	const categories = [
		"Eletrônicos",
		"Moda",
		"Casa",
		"Beleza",
		"Esportes",
		"Brinquedos",
		"Pets",
		"Automotivo",
		"Outros",
	];

	useEffect(() => {
		fetchLink();
	}, [id]);

	const fetchLink = async () => {
		try {
			const res = await fetch(`/api/affiliate/${id}`);
			const data = await res.json();
			setLink(data);
			setFormData({
				productName: data.productName,
				affiliateUrl: data.affiliateUrl,
				category: data.category || "",
				notes: data.notes || "",
				productImage: data.productImage || "",
				isActive: data.isActive,
			});
		} catch (error) {
			console.error("Erro ao carregar link:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccess(null);

		try {
			const res = await fetch(`/api/affiliate/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					category: formData.category || null,
					notes: formData.notes || null,
					productImage: formData.productImage || null,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Erro ao atualizar");
			}

			setSuccess("Link renovado com sucesso! O contador voltou para 7 dias.");
			setLink(data);

			// Atualiza os dados
			setTimeout(() => {
				fetchLink();
			}, 500);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Tem certeza que deseja excluir este link? Esta ação não pode ser desfeita.")) {
			return;
		}

		setDeleting(true);
		try {
			const res = await fetch(`/api/affiliate/${id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				throw new Error("Erro ao excluir");
			}

			router.push("/dashboard/affiliate");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao excluir");
			setDeleting(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
		}));
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-2xl mx-auto">
					<div className="animate-pulse space-y-4">
						<div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 sm:w-64"></div>
						<div className="h-72 sm:h-96 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
					</div>
				</div>
			</div>
		);
	}

	if (!link) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-2xl mx-auto text-center">
					<IoStorefront className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
					<p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400">Link não encontrado</p>
					<Link
						href="/dashboard/affiliate"
						className="inline-block mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm sm:text-base"
					>
						Voltar
					</Link>
				</div>
			</div>
		);
	}

	const daysRemaining = calculateDaysRemaining(new Date(link.updatedAt));
	const status = getLinkStatus(daysRemaining);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-4 sm:mb-8">
					<Link
						href={`/dashboard/affiliate/${id}`}
						className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm sm:text-base"
					>
						<IoArrowBack className="w-4 h-4" />{" "}
						<span className="hidden sm:inline">Voltar para detalhes</span>
						<span className="sm:hidden">Voltar</span>
					</Link>
					<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-4">
						Renovar / Editar Link
					</h1>
					<p className="mt-1 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
						Atualize o link de afiliado para renovar o contador
					</p>
				</div>

				{/* Status atual */}
				<div
					className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border ${
						status.status === "expired" || status.status === "danger"
							? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
							: status.status === "warning"
							? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
							: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
					}`}
				>
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0 flex-1">
							<p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
								Status atual: {status.label}
							</p>
							<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
								Última atualização: {formatDate(new Date(link.updatedAt))}
							</p>
						</div>
						<div className="text-center flex-shrink-0">
							<p
								className={`text-2xl sm:text-4xl font-bold ${
									status.status === "expired" || status.status === "danger"
										? "text-red-600 dark:text-red-400"
										: status.status === "warning"
										? "text-yellow-600 dark:text-yellow-400"
										: "text-green-600 dark:text-green-400"
								}`}
							>
								{daysRemaining}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">dias</p>
						</div>
					</div>
				</div>

				{/* Mensagens */}
				{error && (
					<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm sm:text-base">
						{error}
					</div>
				)}
				{success && (
					<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm sm:text-base">
						{success}
					</div>
				)}

				{/* Form */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
					<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
						{/* Slug (somente leitura) */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Link Permanente
							</label>
							<div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 font-mono text-xs sm:text-sm break-all">
								/a/{link.slug}
							</div>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Este link não pode ser alterado
							</p>
						</div>

						{/* Nome do Produto */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Nome do Produto
							</label>
							<input
								type="text"
								name="productName"
								value={formData.productName}
								onChange={handleChange}
								required
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
							/>
						</div>

						{/* URL de Afiliado - PRINCIPAL */}
						<div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
							<label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
								<IoRefresh className="w-4 h-4" /> Novo Link de Afiliado da Shopee
							</label>
							<input
								type="url"
								name="affiliateUrl"
								value={formData.affiliateUrl}
								onChange={handleChange}
								required
								placeholder="https://shope.ee/..."
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
							/>
							<p className="text-xs text-blue-600 dark:text-blue-300 mt-2 flex items-start sm:items-center gap-1">
								<IoWarning className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />{" "}
								<span>Cole o NOVO link de afiliado para renovar. O contador voltará para 7 dias!</span>
							</p>
						</div>

						{/* Categoria */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Categoria
							</label>
							<select
								name="category"
								value={formData.category}
								onChange={handleChange}
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
							>
								<option value="">Sem categoria</option>
								{categories.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						{/* Imagem */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								URL da Imagem
							</label>
							<input
								type="url"
								name="productImage"
								value={formData.productImage}
								onChange={handleChange}
								placeholder="https://..."
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
							/>
						</div>

						{/* Notas */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Observações
							</label>
							<textarea
								name="notes"
								value={formData.notes}
								onChange={handleChange}
								rows={3}
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-gray-900 dark:text-white text-sm sm:text-base"
							/>
						</div>

						{/* Status Ativo */}
						<div className="flex items-start sm:items-center gap-3">
							<input
								type="checkbox"
								name="isActive"
								id="isActive"
								checked={formData.isActive}
								onChange={handleChange}
								className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0"
							/>
							<label htmlFor="isActive" className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
								Link ativo (se desativado, mostrará página de erro)
							</label>
						</div>

						{/* Botões */}
						<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
							<button
								type="submit"
								disabled={saving}
								className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
							>
								<IoSave className="w-4 h-4 sm:w-5 sm:h-5" />
								{saving ? "Salvando..." : "Salvar e Renovar"}
							</button>
							<Link
								href={`/dashboard/affiliate/${id}`}
								className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-center text-sm sm:text-base"
							>
								Cancelar
							</Link>
						</div>
					</form>
				</div>

				{/* Zona de Perigo */}
				<div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
					<h3 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 mb-3 sm:mb-4 flex items-center gap-2">
						<IoWarning className="w-4 h-4 sm:w-5 sm:h-5" /> Zona de Perigo
					</h3>
					<p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4">
						Excluir este link irá remover permanentemente todos os dados de tracking associados.
					</p>
					<button
						onClick={handleDelete}
						disabled={deleting}
						className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base"
					>
						<IoTrash className="w-4 h-4 sm:w-5 sm:h-5" />
						{deleting ? "Excluindo..." : "Excluir Link"}
					</button>
				</div>
			</div>
		</div>
	);
}
