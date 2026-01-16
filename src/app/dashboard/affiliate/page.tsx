"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
	IoAdd,
	IoStorefront,
	IoWarning,
	IoTime,
	IoSync,
	IoCheckmarkCircle,
	IoCloseCircle,
	IoChevronUp,
	IoChevronDown,
} from "react-icons/io5";
import { calculateDaysRemaining, getLinkStatus, formatNumber } from "@/lib/affiliate-utils";

interface AffiliateLink {
	id: string;
	slug: string;
	productName: string;
	productImage: string | null;
	affiliateUrl: string;
	createdBy: string;
	isActive: boolean;
	category: string | null;
	createdAt: string;
	updatedAt: string;
	totalClicks: number;
	uniqueVisitors: number;
}

type SortField = "productName" | "slug" | "totalClicks" | "uniqueVisitors" | "daysRemaining";
type SortDirection = "asc" | "desc";
type FilterType = "all" | "expiring" | "expired";

export default function AffiliateLinksPage() {
	const [links, setLinks] = useState<AffiliateLink[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<FilterType>("all");
	const [sortField, setSortField] = useState<SortField>("daysRemaining");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [renewingAll, setRenewingAll] = useState(false);
	const [renewResult, setRenewResult] = useState<{ success: number; failed: number } | null>(null);

	useEffect(() => {
		fetchLinks();
	}, []);

	const fetchLinks = async () => {
		try {
			const res = await fetch("/api/affiliate");
			const data = await res.json();
			setLinks(data);
		} catch (error) {
			console.error("Erro ao carregar links:", error);
		} finally {
			setLoading(false);
		}
	};

	const renewAllExpiring = async () => {
		setRenewingAll(true);
		setRenewResult(null);
		try {
			const res = await fetch("/api/affiliate/renew", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ autoRenewExpiring: true, daysThreshold: 3 }),
			});
			const data = await res.json();
			if (res.ok) {
				const success = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
				const failed = data.results?.filter((r: { success: boolean }) => !r.success).length || 0;
				setRenewResult({ success, failed });
				// Recarrega a lista
				await fetchLinks();
			}
		} catch (error) {
			console.error("Erro ao renovar links:", error);
		} finally {
			setRenewingAll(false);
		}
	};

	const expiredCount = links.filter((l) => calculateDaysRemaining(new Date(l.updatedAt)) <= 0).length;
	const expiringCount = links.filter((l) => {
		const days = calculateDaysRemaining(new Date(l.updatedAt));
		return days > 0 && days <= 3;
	}).length;

	const filteredAndSortedLinks = useMemo(() => {
		// Primeiro filtra
		const filtered = links.filter((link) => {
			const daysRemaining = calculateDaysRemaining(new Date(link.updatedAt));
			if (filter === "expiring") return daysRemaining > 0 && daysRemaining <= 3;
			if (filter === "expired") return daysRemaining <= 0;
			return true;
		});

		// Depois ordena
		return [...filtered].sort((a, b) => {
			let comparison = 0;

			switch (sortField) {
				case "productName":
					comparison = a.productName.localeCompare(b.productName, "pt-BR", { sensitivity: "base" });
					break;
				case "slug":
					comparison = a.slug.localeCompare(b.slug);
					break;
				case "totalClicks":
					comparison = a.totalClicks - b.totalClicks;
					break;
				case "uniqueVisitors":
					comparison = a.uniqueVisitors - b.uniqueVisitors;
					break;
				case "daysRemaining":
					comparison =
						calculateDaysRemaining(new Date(a.updatedAt)) - calculateDaysRemaining(new Date(b.updatedAt));
					break;
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [links, filter, sortField, sortDirection]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection(field === "productName" || field === "slug" ? "asc" : "desc");
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field) {
			return (
				<span className="ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
					<IoChevronUp className="w-3 h-3" />
				</span>
			);
		}
		return sortDirection === "asc" ? (
			<IoChevronUp className="w-4 h-4 ml-1 text-blue-600" />
		) : (
			<IoChevronDown className="w-4 h-4 ml-1 text-blue-600" />
		);
	};

	const SortableHeader = ({
		field,
		children,
		className = "",
	}: {
		field: SortField;
		children: React.ReactNode;
		className?: string;
	}) => (
		<th
			className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group select-none ${className}`}
			onClick={() => handleSort(field)}
		>
			<div className="flex items-center">
				{children}
				<SortIcon field={field} />
			</div>
		</th>
	);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
					<div className="animate-pulse">
						<div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 sm:w-64 mb-6 sm:mb-8"></div>
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="h-20 sm:h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
							))}
						</div>
						<div className="space-y-3 sm:space-y-4">
							{[1, 2, 3].map((i) => (
								<div key={i} className="h-20 sm:h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
							Links de Afiliados
						</h1>
						<p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">
							Gerencie seus links da Shopee com tracking completo
						</p>
					</div>
					<Link
						href="/dashboard/affiliate/new"
						className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
					>
						<IoAdd className="w-5 h-5" /> <span>Novo Link</span>
					</Link>
				</div>

				{/* Alertas */}
				{(expiredCount > 0 || expiringCount > 0) && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
						{expiredCount > 0 && (
							<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
								<div className="flex items-center gap-2 sm:gap-3">
									<IoWarning className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 shrink-0" />
									<div>
										<p className="font-semibold text-red-700 dark:text-red-400 text-sm sm:text-base">
											{expiredCount} link{expiredCount > 1 ? "s" : ""} expirado
											{expiredCount > 1 ? "s" : ""}
										</p>
										<p className="text-xs sm:text-sm text-red-600 dark:text-red-300">
											Renove agora para não perder vendas!
										</p>
									</div>
								</div>
							</div>
						)}
						{expiringCount > 0 && (
							<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
								<div className="flex items-center gap-2 sm:gap-3">
									<IoTime className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 shrink-0" />
									<div>
										<p className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm sm:text-base">
											{expiringCount} link{expiringCount > 1 ? "s" : ""} expirando em breve
										</p>
										<p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-300">
											Expira em até 3 dias
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Botão de Renovação em Lote */}
				{(expiredCount > 0 || expiringCount > 0) && (
					<div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
						<button
							onClick={renewAllExpiring}
							disabled={renewingAll}
							className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base ${
								renewingAll ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
							} text-white w-full sm:w-auto justify-center sm:justify-start`}
						>
							<IoSync className={`w-4 h-4 sm:w-5 sm:h-5 ${renewingAll ? "animate-spin" : ""}`} />
							{renewingAll ? "Renovando..." : `Renovar ${expiredCount + expiringCount} link(s)`}
						</button>
						{renewResult && (
							<div className="text-xs sm:text-sm flex items-center gap-3">
								{renewResult.success > 0 && (
									<span className="text-green-600 dark:text-green-400 flex items-center gap-1">
										<IoCheckmarkCircle className="w-4 h-4" /> {renewResult.success} renovado(s)
									</span>
								)}
								{renewResult.failed > 0 && (
									<span className="text-red-600 dark:text-red-400 flex items-center gap-1">
										<IoCloseCircle className="w-4 h-4" /> {renewResult.failed} falha(s)
									</span>
								)}
							</div>
						)}
					</div>
				)}

				{/* Stats Cards */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total de Links</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{links.length}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total de Cliques</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{formatNumber(links.reduce((acc, l) => acc + l.totalClicks, 0))}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Visitantes Únicos</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{formatNumber(links.reduce((acc, l) => acc + l.uniqueVisitors, 0))}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
						<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Links Ativos</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{
								links.filter((l) => l.isActive && calculateDaysRemaining(new Date(l.updatedAt)) > 0)
									.length
							}
						</p>
					</div>
				</div>

				{/* Lista de Links */}
				{links.length === 0 ? (
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 sm:p-12 text-center">
						<IoStorefront className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
						<p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400">
							Nenhum link cadastrado ainda
						</p>
						<Link
							href="/dashboard/affiliate/new"
							className="inline-block mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
						>
							Criar primeiro link
						</Link>
					</div>
				) : (
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
						{/* Barra de Filtros e Ordenação - Integrada na Tabela */}
						<div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
							{/* Info e Filtros */}
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
								<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
									{filteredAndSortedLinks.length} link{filteredAndSortedLinks.length !== 1 ? "s" : ""}
								</p>
								<div className="flex gap-1 flex-wrap">
									<button
										onClick={() => setFilter("all")}
										className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors ${
											filter === "all"
												? "bg-blue-600 text-white"
												: "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500"
										}`}
									>
										Todos ({links.length})
									</button>
									<button
										onClick={() => setFilter("expiring")}
										className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors ${
											filter === "expiring"
												? "bg-yellow-500 text-white"
												: "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500"
										}`}
									>
										<span className="hidden sm:inline">Expirando</span>
										<span className="sm:hidden">Exp.</span> ({expiringCount})
									</button>
									<button
										onClick={() => setFilter("expired")}
										className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors ${
											filter === "expired"
												? "bg-red-600 text-white"
												: "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500"
										}`}
									>
										<span className="hidden sm:inline">Expirados</span>
										<span className="sm:hidden">Exp!</span> ({expiredCount})
									</button>
								</div>
							</div>

							{/* Ordenação */}
							<div className="flex items-center gap-2 text-xs sm:text-sm">
								<span className="text-gray-500 dark:text-gray-400 hidden sm:inline">Ordenar:</span>
								<select
									value={sortField}
									onChange={(e) => {
										const field = e.target.value as SortField;
										setSortField(field);
										setSortDirection(field === "productName" || field === "slug" ? "asc" : "desc");
									}}
									className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="productName">Produto</option>
									<option value="slug">Slug</option>
									<option value="totalClicks">Cliques</option>
									<option value="uniqueVisitors">Únicos</option>
									<option value="daysRemaining">Dias</option>
								</select>
								<button
									onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
									className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
									title={sortDirection === "asc" ? "Crescente" : "Decrescente"}
								>
									{sortDirection === "asc" ? (
										<IoChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
									) : (
										<IoChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
									)}
								</button>
							</div>
						</div>

						{filteredAndSortedLinks.length === 0 ? (
							<div className="p-8 sm:p-12 text-center">
								<IoStorefront className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
								<p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
									Nenhum link {filter === "expired" ? "expirado" : "expirando"}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
									<thead className="bg-gray-50 dark:bg-gray-700">
										<tr>
											<SortableHeader field="productName">Produto</SortableHeader>
											<th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
												Slug
											</th>
											<SortableHeader field="totalClicks" className="text-center">
												<span className="hidden sm:inline">Cliques</span>
												<span className="sm:hidden">Cli.</span>
											</SortableHeader>
											<th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
												Únicos
											</th>
											<SortableHeader field="daysRemaining" className="text-center">
												<span className="hidden sm:inline">Expira</span>
												<span className="sm:hidden">Exp</span>
											</SortableHeader>
											<th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
												Ações
											</th>
										</tr>
									</thead>
									<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
										{filteredAndSortedLinks.map((link) => {
											const daysRemaining = calculateDaysRemaining(new Date(link.updatedAt));
											const status = getLinkStatus(daysRemaining);

											return (
												<tr
													key={link.id}
													className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
												>
													<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
														<div className="flex items-center gap-2 sm:gap-3">
															<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
																{link.productImage ? (
																	<img
																		src={link.productImage}
																		alt={link.productName}
																		className="w-full h-full object-cover"
																	/>
																) : (
																	<IoStorefront className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
																)}
															</div>
															<div className="min-w-0">
																<Link
																	href={`/dashboard/affiliate/${link.id}`}
																	className="font-medium text-gray-900 dark:text-white hover:text-blue-600 truncate block max-w-[120px] sm:max-w-[200px] text-sm sm:text-base"
																>
																	{link.productName}
																</Link>
																{/* Slug visível em mobile */}
																<p className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">
																	/a/{link.slug}
																</p>
																{link.category && (
																	<p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
																		{link.category}
																	</p>
																)}
															</div>
														</div>
													</td>
													<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hidden lg:table-cell">
														<code className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
															/a/{link.slug}
														</code>
													</td>
													<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
														<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
															{formatNumber(link.totalClicks)}
														</span>
													</td>
													<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center hidden md:table-cell">
														<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
															{formatNumber(link.uniqueVisitors)}
														</span>
													</td>
													<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
														<span
															className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-lg font-bold ${
																status.status === "expired"
																	? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
																	: status.status === "danger"
																	? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
																	: status.status === "warning"
																	? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
																	: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
															}`}
														>
															{daysRemaining}
														</span>
													</td>
													<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right">
														<div className="flex items-center justify-end gap-1 sm:gap-2">
															<Link
																href={`/dashboard/affiliate/${link.id}`}
																className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 text-xs sm:text-sm hidden sm:inline"
															>
																Ver
															</Link>
															<Link
																href={`/dashboard/affiliate/${link.id}/edit`}
																className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
															>
																<span className="hidden sm:inline">Renovar</span>
																<span className="sm:hidden">Edit</span>
															</Link>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}

				{/* Link para voltar */}
				<div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
					<Link
						href="/dashboard/qr"
						className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm sm:text-base"
					>
						← Voltar para QR Codes
					</Link>
				</div>
			</div>
		</div>
	);
}
