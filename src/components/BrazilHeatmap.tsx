"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface HeatPoint {
	lat: number;
	lng: number;
	count: number;
}

export type MapMode = "heat" | "pins";

interface Props {
	points: HeatPoint[];
	mode: MapMode;
}

function formatCount(n: number): string {
	if (n >= 1000) return `${Math.floor(n / 1000)}k`;
	return String(n);
}

function createPinIcon(count: number) {
	const label = formatCount(count);
	const fontSize = label.length > 2 ? "10px" : label.length > 1 ? "12px" : "14px";
	return L.divIcon({
		html: `<div style="
			width:36px;height:36px;
			background:linear-gradient(135deg,#3b82f6,#1d4ed8);
			border-radius:50% 50% 50% 0;
			transform:rotate(-45deg);
			display:flex;align-items:center;justify-content:center;
			box-shadow:0 2px 6px rgba(0,0,0,0.35);
			border:2px solid #fff;
		"><span style="
			transform:rotate(45deg);
			color:#fff;
			font-weight:700;
			font-size:${fontSize};
			font-family:system-ui,sans-serif;
			line-height:1;
			display:inline-block;
		">${label}</span></div>`,
		iconSize: [36, 44],
		iconAnchor: [18, 44],
		className: "",
	});
}

export default function BrazilHeatmap({ points, mode }: Props) {
	if (points.length === 0) {
		return (
			<div className="flex items-center justify-center h-[600px] bg-gray-100 dark:bg-gray-700 rounded-xl">
				<p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados de localização disponíveis</p>
			</div>
		);
	}

	const maxCount = Math.max(...points.map((p) => p.count));

	return (
		<div style={{ height: 600 }} className="rounded-xl overflow-hidden">
			<MapContainer
				center={[-15, -52]}
				zoom={4}
				style={{ height: "100%", width: "100%" }}
				scrollWheelZoom={true}
				maxBounds={[
					[-35, -75],
					[6, -28],
				]}
				maxBoundsViscosity={0.8}
			>
				<TileLayer
					url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
					subdomains="abcd"
					maxZoom={19}
				/>
				{mode === "heat"
					? points.map((point, i) => {
							const ratio = maxCount > 1 ? (point.count - 1) / (maxCount - 1) : 1;
							const radius = 7 + ratio * 22;
							const hue = Math.round(50 - ratio * 50);
							const color = `hsl(${hue}, 90%, 48%)`;
							return (
								<CircleMarker
									key={i}
									center={[point.lat, point.lng]}
									radius={radius}
									pathOptions={{ fillColor: color, color, fillOpacity: 0.65, weight: 0 }}
								>
									<Tooltip direction="top" offset={[0, -4]}>
										<span className="text-xs font-medium">
											{point.count} acesso{point.count !== 1 ? "s" : ""}
										</span>
									</Tooltip>
								</CircleMarker>
							);
						})
					: points.map((point, i) => (
							<Marker key={i} position={[point.lat, point.lng]} icon={createPinIcon(point.count)}>
								<Tooltip direction="top" offset={[0, -48]}>
									<span className="text-xs font-medium">
										{point.count} acesso{point.count !== 1 ? "s" : ""}
									</span>
								</Tooltip>
							</Marker>
						))}
			</MapContainer>
		</div>
	);
}
