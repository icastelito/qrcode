import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Habilita output standalone para Docker
	output: "standalone",

	// Configurações de imagem (se necessário)
	images: {
		remotePatterns: [],
	},

	// Headers de segurança
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
				],
			},
		];
	},
};

export default nextConfig;
