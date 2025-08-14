import type { GetServerSideProps } from 'next';

function buildBaseUrl(req: any): string {
	const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'www.verbfy.com';
	const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
	return `${proto}://${host}`;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const baseUrl = buildBaseUrl(req);
	const content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
	res.write(content);
	res.end();
	return { props: {} };
};

export default function RobotsTxt() {
	return null;
}


