import type { GetServerSideProps } from 'next';

function buildBaseUrl(req: any): string {
	const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'www.verbfy.com';
	const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
	return `${proto}://${host}`;
}

// Only include public, crawlable pages
const staticRoutes: string[] = Array.from(
	new Set([
		'/',
		'/landing',
		'/teachers',
		'/free-materials',
		'/materials',
		'/verbfy-talk',
		'/privacy',
		'/terms',
		'/help',
	])
);

async function fetchJson<T = any>(url: string): Promise<T | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		const r = await fetch(url, { method: 'GET', signal: controller.signal });
		clearTimeout(timeout);
		if (!r.ok) return null;
		return (await r.json()) as T;
	} catch {
		return null;
	}
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const baseUrl = buildBaseUrl(req);
	const now = new Date().toISOString();

	// Dynamic content: teachers, free materials, materials
	const dynamicRoutes: string[] = [];

	// Teachers
	const teachers = await fetchJson<any>(`${baseUrl}/api/users/teachers`);
	if (teachers && Array.isArray(teachers)) {
		for (const t of teachers.slice(0, 2000)) {
			const id = t?.slug || t?._id || t?.id;
			if (id) dynamicRoutes.push(`/teachers/${id}`);
		}
	}

	// Free materials
	const freeMaterialsResp = await fetchJson<any>(`${baseUrl}/api/free-materials?limit=2000`);
	const freeMaterials = Array.isArray(freeMaterialsResp?.data)
		? freeMaterialsResp.data
		: Array.isArray(freeMaterialsResp)
			? freeMaterialsResp
			: [];
	for (const m of freeMaterials) {
		const id = m?.slug || m?._id || m?.id;
		if (id) dynamicRoutes.push(`/free-materials/${id}`);
	}

	// Premium materials (if public)
	const materialsResp = await fetchJson<any>(`${baseUrl}/api/materials?limit=2000`);
	const materials = Array.isArray(materialsResp?.data)
		? materialsResp.data
		: Array.isArray(materialsResp)
			? materialsResp
			: [];
	for (const m of materials) {
		const id = m?.slug || m?._id || m?.id;
		if (id) dynamicRoutes.push(`/materials/${id}`);
	}

	const allRoutes = [...staticRoutes, ...dynamicRoutes];

	const urls = allRoutes
		.filter(Boolean)
		.map((route) => {
			const priority = route === '/' ? '1.0' : '0.7';
			return `\t<url>\n\t\t<loc>${baseUrl}${route}</loc>\n\t\t<lastmod>${now}</lastmod>\n\t\t<changefreq>weekly</changefreq>\n\t\t<priority>${priority}</priority>\n\t</url>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

	res.setHeader('Content-Type', 'application/xml');
	res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
	res.write(xml);
	res.end();

	return { props: {} };
};

export default function SiteMap() {
	return null;
}


