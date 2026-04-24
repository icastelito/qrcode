"use client";

import { useState } from "react";

interface ChartData {
	date: string;
	count: number;
}

interface DailyAccessChartProps {
	chartData: ChartData[];
}

export default function DailyAccessChart({ chartData }: DailyAccessChartProps) {
	const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(null);

	const maxCount = Math.max(...chartData.map((d) => d.count), 1);

	const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setHovered({
			index,
			x: rect.left + rect.width / 2,
			y: rect.top,
		});
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setHovered((prev) => (prev ? { ...prev, x: rect.left + rect.width / 2, y: rect.top } : null));
	};

	return (
		<div className="relative h-48 sm:h-64 overflow-x-auto">
			{/* Tooltip via position fixed — não é cortado pelo overflow */}
			{hovered !== null && (
				<div
					className="fixed z-50 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg pointer-events-none shadow-lg"
					style={{
						left: hovered.x,
						top: hovered.y - 12,
						transform: "translate(-50%, -100%)",
					}}
				>
					<div className="font-semibold">{chartData[hovered.index].count} acessos</div>
					<div className="text-xs text-gray-300 mt-0.5">
						{new Date(chartData[hovered.index].date + "T12:00:00").toLocaleDateString("pt-BR", {
							timeZone: "America/Sao_Paulo",
							weekday: "short",
							day: "2-digit",
							month: "short",
						})}
					</div>
					<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
				</div>
			)}

			{/* Linhas de grade horizontais */}
			<div className="absolute inset-0 flex flex-col justify-between min-w-[800px]">
				{[0, 1, 2, 3, 4].map((i) => (
					<div key={i} className="flex items-center">
						<span className="text-xs text-gray-400 w-8 text-right mr-3">
							{Math.round(maxCount - (maxCount / 4) * i)}
						</span>
						<div className="flex-1 border-t border-gray-100 dark:border-gray-700" />
					</div>
				))}
			</div>

			{/* Barras */}
			<div className="absolute inset-0 pl-11 pt-2 pb-6 sm:pb-8 flex items-end gap-0.5 min-w-[800px]">
				{chartData.map((day, index) => {
					const heightPercent = (day.count / maxCount) * 100;
					const isToday = index === chartData.length - 1;

					return (
						<div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end">
							<div
								className={`w-[40%] mx-auto rounded-t-sm transition-colors duration-150 cursor-default ${
									isToday
										? "bg-gradient-to-t from-pink-600 to-pink-400 hover:from-pink-700 hover:to-pink-500"
										: "bg-gradient-to-t from-pink-500 to-pink-300 hover:from-pink-600 hover:to-pink-400"
								}`}
								style={{
									height: `${Math.max(heightPercent, day.count > 0 ? 3 : 0)}%`,
									minHeight: day.count > 0 ? "8px" : "0",
								}}
								onMouseEnter={(e) => handleMouseEnter(e, index)}
								onMouseMove={handleMouseMove}
								onMouseLeave={() => setHovered(null)}
							/>
						</div>
					);
				})}
			</div>

			{/* Labels do eixo X — todos os dias */}
			<div className="absolute bottom-0 left-11 right-0 flex gap-0.5 min-w-[800px]">
				{chartData.map((day, index) => {
					const isToday = index === chartData.length - 1;
					return (
						<div key={day.date} className="flex-1 text-center">
							<span
								className={`text-[9px] ${
									isToday
										? "font-semibold text-pink-600 dark:text-pink-400"
										: "text-gray-500 dark:text-gray-400"
								}`}
							>
								{day.date.slice(8)}/{day.date.slice(5, 7)}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
