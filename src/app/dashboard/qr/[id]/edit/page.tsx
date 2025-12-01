"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
	IoArrowBack,
	IoSave,
	IoClose,
	IoImage,
	IoCheckmarkCircle,
	IoSquare,
	IoEllipse,
	IoDiamond,
	IoApps,
} from "react-icons/io5";

interface QRCodeData {
	id: string;
	name: string;
	targetUrl: string;
	style: {
		size?: number;
		margin?: number;
		darkColor?: string;
		lightColor?: string;
		logo?: string;
		logoSize?: number;
		moduleStyle?: "square" | "rounded" | "circle" | "diamond";
	} | null;
}

export default function EditQRCodePage() {
	const router = useRouter();
	const params = useParams();
	const qrId = params.id as string;

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [qrData, setQrData] = useState<QRCodeData | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [formData, setFormData] = useState({
		size: 400,
		darkColor: "#000000",
		lightColor: "#FFFFFF",
		logo: "" as string,
		logoSize: 20,
		moduleStyle: "square" as "square" | "rounded" | "circle" | "diamond",
	});

	// Carrega dados do QR Code
	useEffect(() => {
		async function loadQRCode() {
			try {
				const response = await fetch(`/api/qr/${qrId}/style`);
				if (!response.ok) {
					throw new Error("QR Code não encontrado");
				}
				const data: QRCodeData = await response.json();
				setQrData(data);

				// Preenche o formulário com os dados existentes
				if (data.style) {
					setFormData({
						size: data.style.size || 400,
						darkColor: data.style.darkColor || "#000000",
						lightColor: data.style.lightColor || "#FFFFFF",
						logo: data.style.logo || "",
						logoSize: data.style.logoSize || 20,
						moduleStyle: data.style.moduleStyle || "square",
					});
					if (data.style.logo) {
						setLogoPreview(data.style.logo);
					}
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Erro ao carregar QR Code");
			} finally {
				setIsLoading(false);
			}
		}
		loadQRCode();
	}, [qrId]);

	// Função para gerar preview
	const generatePreview = useCallback(async () => {
		if (!qrData) return;

		setIsLoadingPreview(true);
		try {
			const response = await fetch("/api/qr/preview", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					previewUrl: qrData.targetUrl,
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
	}, [formData, qrData, previewUrl]);

	// Debounce do preview
	useEffect(() => {
		if (!qrData) return;

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
	}, [formData, qrData]);

	// Gera preview inicial após carregar dados
	useEffect(() => {
		if (qrData && !previewUrl) {
			generatePreview();
		}
	}, [qrData]);

	const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setError("Por favor, selecione uma imagem válida");
			return;
		}

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
		setIsSaving(true);
		setError(null);

		try {
			const response = await fetch(`/api/qr/${qrId}/style`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erro ao atualizar QR Code");
			}

			setSuccess(true);
			setTimeout(() => {
				router.push(`/dashboard/qr/${qrId}`);
				router.refresh();
			}, 1500);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (error && !qrData) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">{error}</p>
					<Link href="/dashboard/qr" className="text-blue-600 hover:text-blue-700">
						Voltar para lista
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Breadcrumb */}
				<nav className="mb-4">
					<Link
						href={`/dashboard/qr/${qrId}`}
						className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
					>
						<IoArrowBack className="w-4 h-4" /> Voltar para detalhes
					</Link>
				</nav>

				<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Editar Estilo do QR Code</h1>
				<p className="text-gray-500 dark:text-gray-400 mb-8">
					<strong>{qrData?.name}</strong> - Altere cores, tamanho, logo e estilo do padrão
				</p>

				{success && (
					<div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
						<IoCheckmarkCircle className="w-5 h-5" />
						QR Code atualizado com sucesso! Redirecionando...
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Formulário */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Info não editável */}
							<div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
								<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
									URL de Destino (não editável)
								</p>
								<p className="text-gray-700 dark:text-gray-300 truncate">{qrData?.targetUrl}</p>
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

							{/* Estilo do Módulo */}
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

							{/* Botões */}
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => router.push(`/dashboard/qr/${qrId}`)}
									className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSaving}
									className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									<IoSave className="w-5 h-5" />
									{isSaving ? "Salvando..." : "Salvar Alterações"}
								</button>
							</div>
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
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								</div>
							)}
						</div>

						<p className="text-xs text-gray-400 mt-3 text-center">A prévia atualiza automaticamente</p>
					</div>
				</div>
			</div>
		</div>
	);
}
