"use client";

import { useState, useCallback } from "react";
import type { QRStyle } from "@/lib/qr-generator";

interface CreateQRParams {
	name: string;
	targetUrl: string;
	style?: QRStyle;
}

interface UseQRCodeReturn {
	createQR: (params: CreateQRParams) => Promise<{ blob: Blob; id: string; trackingUrl: string } | null>;
	isLoading: boolean;
	error: string | null;
	qrImageUrl: string | null;
	qrId: string | null;
	trackingUrl: string | null;
}

export function useQRCode(): UseQRCodeReturn {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
	const [qrId, setQrId] = useState<string | null>(null);
	const [trackingUrl, setTrackingUrl] = useState<string | null>(null);

	const createQR = useCallback(async (params: CreateQRParams) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/qr/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(params),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao criar QR Code");
			}

			// Pega os headers com informações do QR
			const id = response.headers.get("X-QR-ID") || "";
			const tracking = response.headers.get("X-Tracking-URL") || "";

			// Cria URL do blob para exibir a imagem
			const blob = await response.blob();
			const imageUrl = URL.createObjectURL(blob);

			setQrImageUrl(imageUrl);
			setQrId(id);
			setTrackingUrl(tracking);

			return { blob, id, trackingUrl: tracking };
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro desconhecido";
			setError(message);
			return null;
		} finally {
			setIsLoading(false);
		}
	}, []);

	return {
		createQR,
		isLoading,
		error,
		qrImageUrl,
		qrId,
		trackingUrl,
	};
}

/**
 * Função utilitária para download do QR Code
 */
export function downloadQR(blob: Blob, filename: string = "qrcode.png") {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
