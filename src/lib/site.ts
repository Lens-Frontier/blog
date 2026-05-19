export const site = {
	title: 'Lens Frontier',
	description: '沉淀平时阅读分享的论文，输出一些围绕 benchmark 的浅薄观点。',
};

export function path(input = '/') {
	const base = import.meta.env.BASE_URL || '/';
	const normalizedBase = base.endsWith('/') ? base : `${base}/`;
	const normalizedInput = input.replace(/^\/+/, '');
	return input === '/' ? normalizedBase : `${normalizedBase}${normalizedInput}`;
}

export function formatDate(date: Date) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T) {
	return b.data.date.getTime() - a.data.date.getTime();
}

export function tagPath(tag: string) {
	return path(`/tags/${encodeURIComponent(tag)}/`);
}
