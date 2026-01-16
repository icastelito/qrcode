"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IoArrowBack, IoSave, IoInformationCircle } from "react-icons/io5";

export default function NewAffiliateLinkPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		productName: "",
		affiliateUrl: "",
		createdBy: "",
		category: "",
		notes: "",
		productImage: "",
		customSlug: "",
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/affiliate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					customSlug: formData.customSlug || undefined,
					category: formData.category || undefined,
					notes: formData.notes || undefined,
					productImage: formData.productImage || undefined,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Erro ao criar link");
			}

			router.push("/dashboard/affiliate");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-4 sm:mb-8">
					<Link
						href="/dashboard/affiliate"
						className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm sm:text-base"
					>
						<IoArrowBack className="w-4 h-4" /> Voltar
					</Link>
					<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-4">
						Novo Link de Afiliado
					</h1>
					<p className="mt-1 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
						Crie um link permanente para seu produto da Shopee
					</p>
				</div>

				{/* Erro */}
				{error && (
					<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm sm:text-base">
						{error}
					</div>
				)}

				{/* Form */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
					<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
						{/* Nome do Produto */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Nome do Produto *
							</label>
							<input
								type="text"
								name="productName"
								value={formData.productName}
								onChange={handleChange}
								required
								placeholder="Ex: Fone Bluetooth TWS Premium"
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
							/>
						</div>

						{/* URL de Afiliado */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Link de Afiliado da Shopee *
							</label>
							<input
								type="url"
								name="affiliateUrl"
								value={formData.affiliateUrl}
								onChange={handleChange}
								required
								placeholder="https://shope.ee/..."
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
							/>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Cole o link de afiliado gerado na plataforma da Shopee
							</p>
						</div>

						{/* Criado por */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Criado por *
							</label>
							<input
								type="text"
								name="createdBy"
								value={formData.createdBy}
								onChange={handleChange}
								required
								placeholder="Seu nome ou identificador"
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
							/>
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
								<option value="">Selecione uma categoria</option>
								{categories.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						{/* Imagem do Produto */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								URL da Imagem do Produto
							</label>
							<input
								type="url"
								name="productImage"
								value={formData.productImage}
								onChange={handleChange}
								placeholder="https://..."
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
							/>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Opcional: Cole a URL da imagem do produto
							</p>
						</div>

						{/* Slug Personalizado */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Slug Personalizado
							</label>
							<div className="flex items-center">
								<span className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 border-r-0 rounded-l-lg text-gray-500 dark:text-gray-400 text-sm sm:text-base">
									/a/
								</span>
								<input
									type="text"
									name="customSlug"
									value={formData.customSlug}
									onChange={handleChange}
									placeholder="fone-bluetooth (opcional)"
									className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm sm:text-base"
								/>
							</div>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Opcional: Deixe em branco para gerar automaticamente
							</p>
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
								placeholder="Anotações sobre o produto, comissão, etc."
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-gray-900 dark:text-white text-sm sm:text-base"
							/>
						</div>

						{/* Botões */}
						<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
							<button
								type="submit"
								disabled={loading}
								className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
							>
								<IoSave className="w-4 h-4 sm:w-5 sm:h-5" />
								{loading ? "Criando..." : "Criar Link"}
							</button>
							<Link
								href="/dashboard/affiliate"
								className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-center text-sm sm:text-base"
							>
								Cancelar
							</Link>
						</div>
					</form>
				</div>

				{/* Info */}
				<div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
					<h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2 text-sm sm:text-base">
						<IoInformationCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Como funciona
					</h3>
					<ul className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 space-y-1">
						<li>
							• O link permanente será:{" "}
							<code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded text-xs">
								seusite.com/a/slug
							</code>
						</li>
						<li>• Esse link nunca muda, mesmo quando você renovar o afiliado</li>
						<li>• O contador mostra quantos dias até expirar (7 a 0)</li>
						<li>• Renove o link de afiliado antes de expirar para não perder vendas</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
