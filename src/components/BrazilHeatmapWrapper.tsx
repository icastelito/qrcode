"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { HeatPoint, MapMode } from "./BrazilHeatmap";

const BrazilHeatmapClient = dynamic(() => import("./BrazilHeatmap"), {
	ssr: false,
	loading: () => <div className="h-[600px] bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />,
});

interface Props {
	points: HeatPoint[];
}

export default function BrazilHeatmapWrapper({ points }: Props) {
	const [mode, setMode] = useState<MapMode>("heat");

	return (
		<div>
			<div className="flex gap-2 mb-4">
				<button
					onClick={() => setMode("heat")}
					className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
						mode === "heat"
							? "bg-indigo-600 text-white shadow-sm"
							: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
					}`}
				>
					Mapa de Calor
				</button>
				<button
					onClick={() => setMode("pins")}
					className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
						mode === "pins"
							? "bg-indigo-600 text-white shadow-sm"
							: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
					}`}
				>
					Pins com Acessos
				</button>
			</div>
			<BrazilHeatmapClient points={points} mode={mode} />
		</div>
	);
}
