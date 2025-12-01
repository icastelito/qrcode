"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
	IoArrowBack,
	IoArrowForward,
	IoClose,
	IoImage,
	IoCheckmarkCircle,
	IoDownload,
	IoSquare,
	IoEllipse,
	IoDiamond,
	IoApps,
	IoPhonePortrait,
} from "react-icons/io5";

export default function NewQRCodePage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [savedQrUrl, setSavedQrUrl] = useState<string | null>(null);
	const [qrId, setQrId] = useState<string | null>(null);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [formData, setFormData] = useState({
		name: "",
		targetUrl: "",
		size: 400,
		darkColor: "#000000",
		lightColor: "#FFFFFF",
		logo: "" as string,
		logoSize: 20,
		moduleStyle: "square" as "square" | "rounded" | "circle" | "diamond",
	});

	// Função para gerar preview
	const generatePreview = useCallback(async () => {
		setIsLoadingPreview(true);
		try {
			const response = await fetch("/api/qr/preview", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					previewUrl: formData.targetUrl || "https://exemplo.com",
					size: formData.size,
					darkColor: formData.darkColor,
					lightColor: formData.lightColor,
					logo: formData.logo || undefined,
					logoSize: formData.logoSize,
					moduleStyle: formData.moduleStyle,
				}),
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				// Limpa URL anterior
				if (previewUrl) {
					URL.revokeObjectURL(previewUrl);
				}
				setPreviewUrl(url);
			}
		} catch (err) {
			console.error("Erro ao gerar preview:", err);
		} finally {
			setIsLoadingPreview(false);
		}
	}, [formData, previewUrl]);

	// Debounce do preview - atualiza após 500ms de inatividade
	useEffect(() => {
		if (previewTimeoutRef.current) {
			clearTimeout(previewTimeoutRef.current);
		}

		previewTimeoutRef.current = setTimeout(() => {
			generatePreview();
		}, 500);

		return () => {
			if (previewTimeoutRef.current) {
				clearTimeout(previewTimeoutRef.current);
			}
		};
	}, [
		formData.size,
		formData.darkColor,
		formData.lightColor,
		formData.logo,
		formData.logoSize,
		formData.targetUrl,
		formData.moduleStyle,
	]);

	// Gera preview inicial
	useEffect(() => {
		generatePreview();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validar tipo de arquivo
		if (!file.type.startsWith("image/")) {
			setError("Por favor, selecione uma imagem válida");
			return;
		}

		// Validar tamanho (max 6MB)
		if (file.size > 6 * 1024 * 1024) {
			setError("A imagem deve ter no máximo 6MB");
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const base64 = event.target?.result as string;
			setFormData((prev) => ({ ...prev, logo: base64 }));
			setLogoPreview(base64);
			setError(null);
		};
		reader.readAsDataURL(file);
	};

	const removeLogo = () => {
		setFormData((prev) => ({ ...prev, logo: "" }));
		setLogoPreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/qr/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name,
					targetUrl: formData.targetUrl,
					style: {
						size: formData.size,
						darkColor: formData.darkColor,
						lightColor: formData.lightColor,
						logo: formData.logo || undefined,
						logoSize: formData.logoSize,
						moduleStyle: formData.moduleStyle,
					},
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erro ao criar QR Code");
			}

			const id = response.headers.get("X-QR-ID");
			setQrId(id);

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			setSavedQrUrl(url);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDownload = () => {
		const urlToDownload = savedQrUrl || previewUrl;
		if (urlToDownload) {
			const a = document.createElement("a");
			a.href = urlToDownload;
			a.download = `qr-${formData.name || "code"}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Breadcrumb */}
				<nav className="mb-4">
					<Link href="/dashboard/qr" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
						<IoArrowBack className="w-4 h-4" /> Voltar para lista
					</Link>
				</nav>

				<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Criar Novo QR Code</h1>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Formulário */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Nome */}
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Nome do QR Code *
								</label>
								<input
									type="text"
									id="name"
									required
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
									placeholder="Ex: Campanha Black Friday"
								/>
							</div>

							{/* URL Destino */}
							<div>
								<label
									htmlFor="targetUrl"
									className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									URL de Destino *
								</label>
								<input
									type="url"
									id="targetUrl"
									required
									value={formData.targetUrl}
									onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
									placeholder="https://exemplo.com/pagina"
								/>
							</div>

							{/* Tamanho */}
							<div>
								<label
									htmlFor="size"
									className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Tamanho: {formData.size}px
								</label>
								<input
									type="range"
									id="size"
									min="200"
									max="800"
									step="50"
									value={formData.size}
									onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
									className="w-full"
								/>
							</div>

							{/* Cores */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="darkColor"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Cor Principal
									</label>
									<input
										type="color"
										id="darkColor"
										value={formData.darkColor}
										onChange={(e) => setFormData({ ...formData, darkColor: e.target.value })}
										className="w-full h-10 rounded cursor-pointer"
									/>
								</div>
								<div>
									<label
										htmlFor="lightColor"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Cor de Fundo
									</label>
									<input
										type="color"
										id="lightColor"
										value={formData.lightColor}
										onChange={(e) => setFormData({ ...formData, lightColor: e.target.value })}
										className="w-full h-10 rounded cursor-pointer"
									/>
								</div>
							</div>

							{/* Estilo do Módulo (Padrão) */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Estilo do Padrão
								</label>
								<div className="grid grid-cols-4 gap-2">
									{[
										{ value: "square", label: "Quadrado", icon: <IoSquare className="w-6 h-6" /> },
										{
											value: "rounded",
											label: "Arredondado",
											icon: <IoApps className="w-6 h-6" />,
										},
										{ value: "circle", label: "Círculo", icon: <IoEllipse className="w-6 h-6" /> },
										{ value: "diamond", label: "Losango", icon: <IoDiamond className="w-6 h-6" /> },
									].map((style) => (
										<button
											key={style.value}
											type="button"
											onClick={() =>
												setFormData({
													...formData,
													moduleStyle: style.value as
														| "square"
														| "rounded"
														| "circle"
														| "diamond",
												})
											}
											className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
												formData.moduleStyle === style.value
													? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
													: "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
											}`}
										>
											{style.icon}
											<span className="text-xs text-gray-600 dark:text-gray-400">
												{style.label}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Logo Upload */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Logo (opcional)
								</label>
								<div className="space-y-3">
									{logoPreview ? (
										<div className="flex items-center gap-4">
											<div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
												<Image
													src={logoPreview}
													alt="Logo preview"
													fill
													className="object-contain"
												/>
											</div>
											<button
												type="button"
												onClick={removeLogo}
												className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
											>
												<IoClose className="w-4 h-4" /> Remover logo
											</button>
										</div>
									) : (
										<div
											onClick={() => fileInputRef.current?.click()}
											className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
										>
											<IoImage className="w-8 h-8 mx-auto text-gray-400" />
											<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
												Clique para adicionar uma logo
											</p>
											<p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG até 6MB</p>
										</div>
									)}
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										onChange={handleLogoUpload}
										className="hidden"
									/>
								</div>
							</div>

							{/* Tamanho do Logo */}
							{logoPreview && (
								<div>
									<label
										htmlFor="logoSize"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Tamanho da Logo: {formData.logoSize}%
									</label>
									<input
										type="range"
										id="logoSize"
										min="10"
										max="25"
										step="5"
										value={formData.logoSize}
										onChange={(e) =>
											setFormData({ ...formData, logoSize: parseInt(e.target.value) })
										}
										className="w-full"
									/>
									<p className="text-xs text-gray-400 mt-1">
										Máximo de 25% para garantir leitura do QR
									</p>
								</div>
							)}

							{/* Erro */}
							{error && (
								<div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
									{error}
								</div>
							)}

							{/* Botão */}
							<button
								type="submit"
								disabled={isLoading || !formData.name || !formData.targetUrl}
								className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
							>
								{isLoading ? "Salvando..." : "Salvar QR Code"}
							</button>
						</form>
					</div>

					{/* Preview */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center justify-center">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Prévia em Tempo Real</h3>

						<div className="relative">
							{isLoadingPreview && (
								<div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg z-10">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								</div>
							)}
							{previewUrl ? (
								<Image
									src={previewUrl}
									alt="QR Code Preview"
									width={280}
									height={280}
									className="rounded-lg"
								/>
							) : (
								<div className="w-[280px] h-[280px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
									<IoPhonePortrait className="w-12 h-12 text-gray-400" />
								</div>
							)}
						</div>

						<p className="text-xs text-gray-400 mt-3 text-center">A prévia atualiza automaticamente</p>

						{/* Ações após salvar */}
						{savedQrUrl && qrId && (
							<div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg w-full">
								<p className="text-green-700 dark:text-green-400 text-sm font-medium mb-3 text-center flex items-center justify-center gap-1">
									<IoCheckmarkCircle className="w-5 h-5" /> QR Code salvo com sucesso!
								</p>
								<div className="flex gap-3 justify-center">
									<button
										onClick={handleDownload}
										className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1"
									>
										<IoDownload className="w-4 h-4" /> Download
									</button>
									<button
										onClick={() => router.push(`/dashboard/qr/${qrId}`)}
										className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1"
									>
										Ver Detalhes <IoArrowForward className="w-4 h-4" />
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
