"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
	IoArrowBack,
	IoCopy,
	IoCheckmark,
	IoRefresh,
	IoStorefront,
	IoSync,
	IoLogoInstagram,
	IoLogoFacebook,
	IoLogoTiktok,
	IoLogoTwitter,
	IoLogoWhatsapp,
	IoLogoYoutube,
	IoLogoPinterest,
	IoLogoLinkedin,
	IoLogoReddit,
	IoLink,
	IoGlobe,
	IoPhonePortrait,
	IoWarning,
	IoCloseCircle,
	IoDocumentText,
	IoCalendar,
	IoTime,
	IoList,
} from "react-icons/io5";
import { FaTelegram } from "react-icons/fa";
import { calculateDaysRemaining, getLinkStatus, formatDate, formatNumber } from "@/lib/affiliate-utils";

interface AccessLog {
	id: string;
	timestamp: string;
	device: string | null;
	browser: string | null;
	platform: string | null;
	country: string | null;
	city: string | null;
	region: string | null;
	socialNetwork: string | null;
	referer: string | null;
	isUniqueVisitor: boolean;
}

interface AffiliateDetail {
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
	totalClicks: number;
	uniqueVisitors: number;
	stats: {
		clicksBySocialNetwork: { network: string; count: number }[];
		clicksByCountry: { country: string; count: number }[];
	};
	recentAccess: AccessLog[];
}

const socialIconComponents: Record<string, React.ReactNode> = {
	instagram: <IoLogoInstagram className="w-5 h-5 text-pink-500" />,
	facebook: <IoLogoFacebook className="w-5 h-5 text-blue-600" />,
	tiktok: <IoLogoTiktok className="w-5 h-5" />,
	twitter: <IoLogoTwitter className="w-5 h-5 text-sky-500" />,
	whatsapp: <IoLogoWhatsapp className="w-5 h-5 text-green-500" />,
	telegram: <FaTelegram className="w-5 h-5 text-blue-400" />,
	youtube: <IoLogoYoutube className="w-5 h-5 text-red-600" />,
	pinterest: <IoLogoPinterest className="w-5 h-5 text-red-500" />,
	linkedin: <IoLogoLinkedin className="w-5 h-5 text-blue-700" />,
	kwai: <IoPhonePortrait className="w-5 h-5 text-orange-500" />,
	reddit: <IoLogoReddit className="w-5 h-5 text-orange-600" />,
	direto: <IoLink className="w-5 h-5 text-gray-500" />,
};

const defaultIcon = <IoGlobe className="w-5 h-5 text-gray-400" />;

export default function AffiliateDetailPage() {
	const params = useParams();
	const id = params.id as string;

	const [link, setLink] = useState<AffiliateDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);
	const [renewing, setRenewing] = useState(false);
	const [renewError, setRenewError] = useState<string | null>(null);
	const [renewSuccess, setRenewSuccess] = useState(false);
	const [productUrlInput, setProductUrlInput] = useState("");
	const [showProductUrlModal, setShowProductUrlModal] = useState(false);

	useEffect(() => {
		fetchLink();
	}, [id]);

	const fetchLink = async () => {
		try {
			const res = await fetch(`/api/affiliate/${id}`);
			const data = await res.json();
			setLink(data);
		} catch (error) {
			console.error("Erro ao carregar link:", error);
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = () => {
		if (!link) return;
		const url = `${window.location.origin}/a/${link.slug}`;
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const renewLink = async (productUrl?: string) => {
		if (!link) return;

		setRenewing(true);
		setRenewError(null);
		setRenewSuccess(false);

		try {
			const res = await fetch(`/api/affiliate/${id}/renew`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productUrl }),
			});

			const data = await res.json();

			if (!res.ok) {
				// Se precisa da URL do produto, mostra modal
				if (res.status === 400 && data.hint) {
					setShowProductUrlModal(true);
					setRenewing(false);
					return;
				}
				throw new Error(data.error || "Erro ao renovar link");
			}

			setRenewSuccess(true);
			setShowProductUrlModal(false);
			setProductUrlInput("");
			// Recarrega os dados do link
			await fetchLink();
			setTimeout(() => setRenewSuccess(false), 3000);
		} catch (error) {
			setRenewError(error instanceof Error ? error.message : "Erro ao renovar link");
		} finally {
			setRenewing(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
					<div className="animate-pulse space-y-4">
						<div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 sm:w-64"></div>
						<div className="h-36 sm:h-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
						<div className="h-72 sm:h-96 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
					</div>
				</div>
			</div>
		);
	}

	if (!link) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 text-center">
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
			<div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
				{/* Header */}
				<div className="mb-4 sm:mb-6">
					<Link
						href="/dashboard/affiliate"
						className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm sm:text-base"
					>
						<IoArrowBack className="w-4 h-4" /> <span className="hidden sm:inline">Voltar para lista</span><span className="sm:hidden">Voltar</span>
					</Link>
				</div>

				{/* Info Card */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 mb-4 sm:mb-6">
					<div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
						{/* Imagem */}
						<div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto lg:mx-0">
							{link.productImage ? (
								<img
									src={link.productImage}
									alt={link.productName}
									className="w-full h-full object-cover"
								/>
							) : (
								<IoStorefront className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
							)}
						</div>

						{/* Info */}
						<div className="flex-1">
							<div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
								<div className="text-center sm:text-left">
									<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
										{link.productName}
									</h1>
									<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
										{link.category && (
											<span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
												{link.category}
											</span>
										)}
										<span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
											por {link.createdBy}
										</span>
									</div>
								</div>

								{/* Status de expiração */}
								<div
									className={`text-center px-4 sm:px-6 py-2 sm:py-3 rounded-xl ${
										status.status === "expired" || status.status === "danger"
											? "bg-red-100 dark:bg-red-900/30"
											: status.status === "warning"
											? "bg-yellow-100 dark:bg-yellow-900/30"
											: "bg-green-100 dark:bg-green-900/30"
									}`}
								>
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
									<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
										{daysRemaining === 0 ? "expirado" : "dias restantes"}
									</p>
								</div>
							</div>

							{/* URL */}
							<div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
								<div className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg font-mono text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate text-center sm:text-left">
									{typeof window !== "undefined" ? window.location.origin : ""}/a/{link.slug}
								</div>
								<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
									<button
										onClick={copyToClipboard}
										className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
									>
										{copied ? <IoCheckmark className="w-4 h-4" /> : <IoCopy className="w-4 h-4" />}
										<span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar"}</span>
									</button>
									<button
										onClick={() => renewLink()}
										disabled={renewing}
										className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
											renewSuccess
												? "bg-green-600 text-white"
												: "bg-orange-600 hover:bg-orange-700 text-white"
										} ${renewing ? "opacity-50 cursor-not-allowed" : ""}`}
									>
										<IoSync className={`w-4 h-4 ${renewing ? "animate-spin" : ""}`} />
										<span className="hidden sm:inline">{renewing ? "Renovando..." : renewSuccess ? "Renovado!" : "Renovar"}</span>
									</button>
									<Link
										href={`/dashboard/affiliate/${link.id}/edit`}
										className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
									>
										<IoRefresh className="w-4 h-4" /> <span className="hidden sm:inline">Editar</span>
								</Link>
							</div>

							{/* Erro de renovação */}
							{renewError && (
								<div className="mt-2 p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs sm:text-sm flex items-center gap-2">
									<IoCloseCircle className="w-4 h-4 flex-shrink-0" /> <span className="break-all">{renewError}</span>
								</div>
							)}

							{/* Modal para URL do produto */}
							{showProductUrlModal && (
								<div className="mt-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
									<p className="text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm mb-3 flex items-start sm:items-center gap-2">
										<IoWarning className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" /> 
										<span>Não foi possível detectar a URL do produto automaticamente. Cole a URL do produto da Shopee abaixo:</span>
									</p>
									<div className="flex flex-col sm:flex-row gap-2">
										<input
											type="text"
											value={productUrlInput}
											onChange={(e) => setProductUrlInput(e.target.value)}
											placeholder="https://shopee.com.br/Nome-do-Produto-i.123456.789012"
											className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm"
										/>
										<div className="flex gap-2">
											<button
												onClick={() => renewLink(productUrlInput)}
												disabled={renewing || !productUrlInput}
												className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs sm:text-sm disabled:opacity-50"
											>
												Renovar
											</button>
											<button
												onClick={() => {
													setShowProductUrlModal(false);
													setProductUrlInput("");
												}}
												className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm"
											>
												Cancelar
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Notas */}
							{link.notes && (
								<div className="mt-4 p-2 sm:p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
									<IoDocumentText className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{link.notes}</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-5 text-center">
						<p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
							{formatNumber(link.totalClicks)}
						</p>
						<p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total de Cliques</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-5 text-center">
						<p className="text-xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
							{formatNumber(link.uniqueVisitors)}
						</p>
						<p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Visitantes Únicos</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-5 text-center">
						<p className="text-xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
							{link.totalClicks > 0 ? ((link.uniqueVisitors / link.totalClicks) * 100).toFixed(1) : 0}%
						</p>
						<p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Taxa de Novos</p>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-5 text-center">
						<p className="text-xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
							{link.stats?.clicksBySocialNetwork?.length || 0}
						</p>
						<p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Fontes de Tráfego</p>
					</div>
				</div>

				{/* Charts Row */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
					{/* Por Rede Social */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5">
						<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
							<IoPhonePortrait className="w-4 h-4 sm:w-5 sm:h-5" /> Por Rede Social
						</h3>
						{(link.stats?.clicksBySocialNetwork?.length || 0) > 0 ? (
							<div className="space-y-3">
								{(link.stats?.clicksBySocialNetwork || [])
									.sort((a, b) => b.count - a.count)
									.map((item) => (
										<div key={item.network} className="flex items-center gap-3">
											<span>{socialIconComponents[item.network] || defaultIcon}</span>
											<div className="flex-1">
												<div className="flex justify-between mb-1">
													<span className="capitalize text-gray-700 dark:text-gray-300">
														{item.network}
													</span>
													<span className="text-gray-500 dark:text-gray-400">
														{item.count}
													</span>
												</div>
												<div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
													<div
														className="h-full bg-blue-500 rounded-full"
														style={{
															width: `${(item.count / link.totalClicks) * 100}%`,
														}}
													/>
												</div>
											</div>
										</div>
									))}
							</div>
						) : (
							<p className="text-gray-400 dark:text-gray-500 text-center py-6 sm:py-8 text-sm">Sem dados ainda</p>
						)}
					</div>

					{/* Por País */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5">
						<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
							<IoGlobe className="w-4 h-4 sm:w-5 sm:h-5" /> Por País
						</h3>
						{(link.stats?.clicksByCountry?.length || 0) > 0 ? (
							<div className="space-y-3">
								{(link.stats?.clicksByCountry || [])
									.sort((a, b) => b.count - a.count)
									.slice(0, 8)
									.map((item) => (
										<div key={item.country} className="flex items-center gap-3">
											<div className="flex-1">
												<div className="flex justify-between mb-1">
													<span className="text-gray-700 dark:text-gray-300">
														{item.country}
													</span>
													<span className="text-gray-500 dark:text-gray-400">
														{item.count}
													</span>
												</div>
												<div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
													<div
														className="h-full bg-green-500 rounded-full"
														style={{
															width: `${(item.count / link.totalClicks) * 100}%`,
														}}
													/>
												</div>
											</div>
										</div>
									))}
							</div>
						) : (
							<p className="text-gray-400 dark:text-gray-500 text-center py-6 sm:py-8 text-sm">Sem dados ainda</p>
						)}
					</div>
				</div>

				{/* Recent Access */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5">
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
						<IoList className="w-4 h-4 sm:w-5 sm:h-5" /> Acessos Recentes
					</h3>
					{(link.recentAccess?.length || 0) > 0 ? (
						<div className="overflow-x-auto -mx-4 sm:mx-0">
							<table className="w-full text-xs sm:text-sm min-w-[600px]">
								<thead>
									<tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
										<th className="text-left py-2 sm:py-3 px-2 font-medium">Data</th>
										<th className="text-left py-2 sm:py-3 px-2 font-medium">Origem</th>
										<th className="text-left py-2 sm:py-3 px-2 font-medium hidden sm:table-cell">Local</th>
										<th className="text-left py-2 sm:py-3 px-2 font-medium hidden md:table-cell">Dispositivo</th>
										<th className="text-left py-2 sm:py-3 px-2 font-medium hidden lg:table-cell">Navegador</th>
										<th className="text-center py-2 sm:py-3 px-2 font-medium">Novo?</th>
									</tr>
								</thead>
								<tbody>
									{(link.recentAccess || []).map((access) => (
										<tr
											key={access.id}
											className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
										>
											<td className="py-2 sm:py-3 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
												{formatDate(new Date(access.timestamp))}
											</td>
											<td className="py-2 sm:py-3 px-2">
												<span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
													{socialIconComponents[access.socialNetwork || "direto"] ||
														defaultIcon}
													<span className="capitalize hidden sm:inline">
														{access.socialNetwork || "Direto"}
													</span>
												</span>
											</td>
											<td className="py-2 sm:py-3 px-2 text-gray-700 dark:text-gray-300 hidden sm:table-cell">
												{access.city && access.region
													? `${access.city}, ${access.region}`
													: access.country || "Desconhecido"}
											</td>
											<td className="py-2 sm:py-3 px-2 text-gray-700 dark:text-gray-300 hidden md:table-cell">
												{access.platform || "?"} / {access.device || "?"}
											</td>
											<td className="py-2 sm:py-3 px-2 text-gray-700 dark:text-gray-300 hidden lg:table-cell">
												{access.browser || "Desconhecido"}
											</td>
											<td className="py-2 sm:py-3 px-2 text-center">
												{access.isUniqueVisitor ? (
													<span className="text-green-500">✓</span>
												) : (
													<span className="text-gray-400">-</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="text-gray-400 dark:text-gray-500 text-center py-6 sm:py-8 text-sm">
							Nenhum acesso registrado ainda
						</p>
					)}
				</div>

				{/* Datas */}
				<div className="mt-4 sm:mt-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
					<span className="flex items-center gap-1">
						<IoCalendar className="w-4 h-4" /> Criado:{" "}
						{link.createdAt ? formatDate(new Date(link.createdAt)) : "-"}
					</span>
					<span className="flex items-center gap-1">
						<IoTime className="w-4 h-4" /> Atualizado:{" "}
						{link.updatedAt ? formatDate(new Date(link.updatedAt)) : "-"}
					</span>
				</div>
			</div>
		</div>
	);
}
