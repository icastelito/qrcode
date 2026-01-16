"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { IoArrowForward, IoChevronUp, IoChevronDown } from "react-icons/io5";
import QRCodeListActions from "@/components/QRCodeListActions";
import { formatDateBR } from "@/lib/date-utils";

type QRCodeWithCount = {
	id: string;
	name: string;
	targetUrl: string;
	style: unknown;
	createdAt: Date;
	_count: {
		accessLogs: number;
	};
};

type SortField = "name" | "targetUrl" | "createdAt" | "accessLogs";
type SortDirection = "asc" | "desc";

interface QRCodeTableProps {
	qrCodes: QRCodeWithCount[];
}

export default function QRCodeTable({ qrCodes }: QRCodeTableProps) {
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	const sortedQRCodes = useMemo(() => {
		return [...qrCodes].sort((a, b) => {
			let comparison = 0;

			switch (sortField) {
				case "name":
					comparison = a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
					break;
				case "targetUrl":
					comparison = a.targetUrl.localeCompare(b.targetUrl);
					break;
				case "createdAt":
					comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
				case "accessLogs":
					comparison = a._count.accessLogs - b._count.accessLogs;
					break;
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [qrCodes, sortField, sortDirection]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection(field === "name" ? "asc" : "desc");
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
		hideOnMobile = false,
	}: {
		field: SortField;
		children: React.ReactNode;
		className?: string;
		hideOnMobile?: boolean;
	}) => (
		<th
			className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group select-none ${className} ${
				hideOnMobile ? "hidden md:table-cell" : ""
			}`}
			onClick={() => handleSort(field)}
		>
			<div className="flex items-center">
				{children}
				<SortIcon field={field} />
			</div>
		</th>
	);

	if (qrCodes.length === 0) {
		return (
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 sm:p-12 text-center">
				<p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum QR Code criado ainda</p>
				<Link
					href="/dashboard/qr/new"
					className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
				>
					Criar primeiro QR Code <IoArrowForward className="w-4 h-4" />
				</Link>
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
			{/* Sort Info */}
			<div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
				<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
					{qrCodes.length} QR Code{qrCodes.length !== 1 ? "s" : ""} encontrado
					{qrCodes.length !== 1 ? "s" : ""}
				</p>
				<div className="flex items-center gap-2 text-xs sm:text-sm">
					<span className="text-gray-500 dark:text-gray-400 hidden sm:inline">Ordenar por:</span>
					<select
						value={sortField}
						onChange={(e) => {
							const field = e.target.value as SortField;
							setSortField(field);
							setSortDirection(field === "name" ? "asc" : "desc");
						}}
						className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="name">Nome</option>
						<option value="createdAt">Data</option>
						<option value="accessLogs">Acessos</option>
						<option value="targetUrl">URL</option>
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

			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead className="bg-gray-50 dark:bg-gray-700">
						<tr>
							<SortableHeader field="name">Nome</SortableHeader>
							<SortableHeader field="targetUrl" hideOnMobile>
								URL Destino
							</SortableHeader>
							<SortableHeader field="createdAt" hideOnMobile>
								Criado em
							</SortableHeader>
							<SortableHeader field="accessLogs">Acessos</SortableHeader>
							<th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
								Ações
							</th>
						</tr>
					</thead>
					<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
						{sortedQRCodes.map((qr) => (
							<tr key={qr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
									<Link
										href={`/dashboard/qr/${qr.id}`}
										className="text-gray-900 dark:text-white font-medium hover:text-blue-600 text-sm sm:text-base block"
									>
										{qr.name}
									</Link>
									{/* URL visível apenas em mobile */}
									<p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] md:hidden mt-1">
										{qr.targetUrl}
									</p>
								</td>
								<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hidden md:table-cell">
									<a
										href={qr.targetUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-gray-500 dark:text-gray-400 hover:text-blue-600 truncate block max-w-[150px] lg:max-w-xs text-sm"
									>
										{qr.targetUrl}
									</a>
								</td>
								<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 hidden md:table-cell text-sm">
									{formatDateBR(qr.createdAt)}
								</td>
								<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
									<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
										{qr._count.accessLogs}
									</span>
								</td>
								<td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
									<div className="flex items-center justify-end gap-2 sm:gap-4">
										<Link
											href={`/dashboard/qr/${qr.id}`}
											className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 text-xs sm:text-sm"
										>
											<span className="hidden sm:inline">Ver detalhes</span>
											<span className="sm:hidden">Ver</span>
										</Link>
										<QRCodeListActions qrId={qr.id} qrName={qr.name} />
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
