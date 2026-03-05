"use client";

interface AccessLogMapProps {
	latitude: number;
	longitude: number;
	label?: string;
}

export default function AccessLogMap({ latitude, longitude, label }: AccessLogMapProps) {
	const delta = 0.05;
	const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
	const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
	const linkHref = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=13/${latitude}/${longitude}`;

	return (
		<div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
			<iframe
				src={src}
				title={label || "Localização do acesso"}
				width="100%"
				height="320"
				style={{ border: 0 }}
				loading="lazy"
				referrerPolicy="no-referrer"
			/>
			<div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
				<span>
					{latitude.toFixed(6)}, {longitude.toFixed(6)}
				</span>
				<a
					href={linkHref}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 dark:text-blue-400 hover:underline"
				>
					Abrir no OpenStreetMap ↗
				</a>
			</div>
		</div>
	);
}
