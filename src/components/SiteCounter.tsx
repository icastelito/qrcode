"use client";

import { useEffect } from "react";

export default function SiteCounter() {
	useEffect(() => {
		fetch("https://contador.icastelo.com.br/api/count/bfb4d17e-8e45-48bf-acfc-fe48108ecf65/increment?format=text", {
			credentials: "include",
		}).catch((err) => console.error("Erro ao carregar contador:", err));
	}, []);

	return null;
}
