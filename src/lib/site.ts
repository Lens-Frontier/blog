export const languages = ['zh', 'en'] as const;
export type Language = (typeof languages)[number];

export const defaultLanguage: Language = 'zh';

export const sites: Record<Language, { title: string; description: string; htmlLang: string; locale: string }> = {
	zh: {
		title: 'Lens Frontier',
		description: '沉淀平时阅读分享的论文，输出一些围绕 benchmark 的浅薄观点。',
		htmlLang: 'zh-CN',
		locale: 'zh-CN',
	},
	en: {
		title: 'Lens Frontier',
		description: 'A place for paper notes and modest arguments around benchmarks and evaluation.',
		htmlLang: 'en',
		locale: 'en-US',
	},
};

export const site = sites[defaultLanguage];

export const ui = {
	zh: {
		brandTagline: 'papers benchmarks opinions',
		nav: {
			papers: 'Papers',
			benchmarks: 'Benchmarks',
			opinions: 'Opinions',
			tags: 'Tags',
		},
		footer: {
			line: 'Reading notes and modest benchmark arguments.',
			timeline: 'Timeline',
			about: 'About',
			rss: 'RSS',
		},
		home: {
			eyebrow: 'papers benchmarks opinions',
			title: '把阅读分享沉淀下来，输出一些浅薄的观点。',
			description:
				'Lens Frontier 用来沉淀大家平时阅读分享的论文，也记录一些围绕 benchmark、evaluation 和真实任务的个人观察。观点可以浅，但最好说清楚证据、上下文和判断边界。',
			channels: 'Channels',
			latest: 'Latest Writing',
			timeline: 'timeline',
			emptyTitle: 'No notes yet.',
			emptyBody: '第一篇论文分享、观点文章或 benchmark 观察会出现在这里。',
			scopeTitle: 'Editorial Scope',
			scopeBody:
				'这里欢迎不同作者的阅读视角、观点分歧和技术判断。文章不需要给出终局结论，但需要说明证据和边界。',
			styleTitle: 'House Style',
			styleBody: '主要围绕 benchmark 和 evaluation：观点可以浅一点，证据要多一点；少一点榜单口号，多一点上下文。',
		},
		channels: {
			papers: {
				label: 'Paper Notes',
				description: '平时阅读分享的论文沉淀。',
			},
			opinions: {
				label: 'Opinions',
				description: '围绕 benchmark 的浅薄观点。',
			},
			benchmarks: {
				label: 'Benchmarks',
				description: '评测协议、数据集和榜单语境。',
			},
		},
		pages: {
			papers: {
				title: 'Papers',
				description: '论文阅读分享与复盘。',
				eyebrow: 'paper sharing',
				body: '把大家平时阅读分享的论文沉淀下来。重点不是复述摘要，而是把问题、证据、限制和个人判断说清楚。',
				emptyTitle: 'No paper notes yet.',
				emptyBody: '第一篇论文分享会出现在这里。',
			},
			benchmarks: {
				title: 'Benchmarks',
				description: 'Benchmark 相关评测协议、数据集和榜单语境观察。',
				eyebrow: 'evaluation context',
				body: '把 benchmark 当作测量工具来记录：任务、指标、版本、风险、已知误读，以及它和真实问题之间的距离。',
				emptyTitle: 'No benchmark notes yet.',
				emptyBody: '第一篇 benchmark 观察会出现在这里。',
			},
			opinions: {
				title: 'Opinions',
				description: '围绕 benchmark 和 evaluation 的浅薄观点、论点和判断。',
				eyebrow: 'benchmark-facing arguments',
				body: '围绕 benchmark、evaluation 和真实任务落差的浅薄观点。可以有立场，但需要把事实、推断和不确定性分开。',
				emptyTitle: 'No opinions yet.',
				emptyBody: '第一篇观点文章会出现在这里。',
			},
			timeline: {
				title: 'Timeline',
				description: '全部论文分享、观点文章和 benchmark 观察的时间线。',
				eyebrow: 'all writing',
				body: '按时间汇总平时阅读分享的论文、观点文章和 benchmark 观察，方便顺着一条想法从阅读、质疑到判断往回看。',
				emptyTitle: 'No writing yet.',
				emptyBody: '第一篇论文分享、观点文章或 benchmark 观察会出现在这里。',
			},
			tags: {
				title: 'Tags',
				description: '主题标签索引。',
				eyebrow: 'index terms',
				body: '用标签把论文分享、观点文章和 benchmark 观察串起来。',
				emptyTitle: 'No tags yet.',
				emptyBody: '发布第一篇内容后，标签索引会自动出现。',
				tagDescription: (tag: string) => `标签 ${tag} 下的内容。`,
				relatedCount: (count: number) => `${count} 篇相关内容。`,
			},
			about: {
				title: 'About',
				description: '关于 Lens Frontier。',
				eyebrow: 'about',
				dek: '用于沉淀大家平时阅读分享的论文，也输出一些围绕 benchmark 的浅薄观点。',
				paragraphs: [
					'这里的写作目标不是产出统一口径，而是把不同人的阅读、观点和论点放到可追溯的语境里：一个结论依赖什么证据，它的边界在哪里，它和真实系统或评测协议之间隔了哪些假设。',
					'每篇文章尽量保留来源、假设、限制和个人判断。观点可以浅，判断需要可追溯；不同作者也可以在这里保留不同的观察角度，尤其是围绕 benchmark 设计、结果解释和真实任务落差的观察。',
				],
			},
		},
		article: {
			paper: 'Paper',
			code: 'Code',
			spec: {
				date: '日期',
				paperAuthors: '论文作者',
				venue: '发表位置',
				benchmarks: 'Benchmarks',
				tasks: '任务',
				status: '状态',
				area: '领域',
				metric: '指标',
				version: '版本',
				risk: '风险',
				stance: '立场',
			},
		},
		languageNames: {
			zh: '中文',
			en: 'EN',
		},
	},
	en: {
		brandTagline: 'papers benchmarks opinions',
		nav: {
			papers: 'Papers',
			benchmarks: 'Benchmarks',
			opinions: 'Opinions',
			tags: 'Tags',
		},
		footer: {
			line: 'Reading notes and modest benchmark arguments.',
			timeline: 'Timeline',
			about: 'About',
			rss: 'RSS',
		},
		home: {
			eyebrow: 'papers benchmarks opinions',
			title: 'Turn paper reading into durable notes and modest arguments.',
			description:
				'Lens Frontier collects paper notes, benchmark observations, and personal arguments around evaluation. The claims can stay modest; the evidence, context, and limits should be visible.',
			channels: 'Channels',
			latest: 'Latest Writing',
			timeline: 'timeline',
			emptyTitle: 'No notes yet.',
			emptyBody: 'The first paper note, opinion, or benchmark observation will appear here.',
			scopeTitle: 'Editorial Scope',
			scopeBody:
				'Different authors can keep different reading angles, disagreements, and technical judgments here. An article does not need the final word, but it should show its evidence and limits.',
			styleTitle: 'House Style',
			styleBody:
				'Mostly about benchmarks and evaluation: less leaderboard theater, more task context, evidence, and boundary conditions.',
		},
		channels: {
			papers: {
				label: 'Paper Notes',
				description: 'Notes from regular paper reading.',
			},
			opinions: {
				label: 'Opinions',
				description: 'Modest arguments around benchmarks.',
			},
			benchmarks: {
				label: 'Benchmarks',
				description: 'Protocols, datasets, metrics, and leaderboard context.',
			},
		},
		pages: {
			papers: {
				title: 'Papers',
				description: 'Paper reading notes and follow-up reflections.',
				eyebrow: 'paper sharing',
				body: 'A place to turn regular paper reading into durable notes. The goal is not to restate abstracts, but to make the problem, evidence, limits, and judgment clear.',
				emptyTitle: 'No paper notes yet.',
				emptyBody: 'The first paper note will appear here.',
			},
			benchmarks: {
				title: 'Benchmarks',
				description: 'Notes on benchmark protocols, datasets, metrics, and leaderboard context.',
				eyebrow: 'evaluation context',
				body: 'We treat a benchmark as a measurement instrument: task, metric, version, risks, common misreadings, and distance from real-world use.',
				emptyTitle: 'No benchmark notes yet.',
				emptyBody: 'The first benchmark observation will appear here.',
			},
			opinions: {
				title: 'Opinions',
				description: 'Arguments and judgment around benchmarks and evaluation.',
				eyebrow: 'benchmark-facing arguments',
				body: 'Modest arguments around benchmarks, evaluation, and the gap to real tasks. A position is welcome; facts, inference, and uncertainty should stay separated.',
				emptyTitle: 'No opinions yet.',
				emptyBody: 'The first opinion piece will appear here.',
			},
			timeline: {
				title: 'Timeline',
				description: 'All paper notes, opinions, and benchmark observations in time order.',
				eyebrow: 'all writing',
				body: 'A time-ordered view of paper notes, opinion pieces, and benchmark observations, useful for tracing an idea from reading to doubt to judgment.',
				emptyTitle: 'No writing yet.',
				emptyBody: 'The first paper note, opinion, or benchmark observation will appear here.',
			},
			tags: {
				title: 'Tags',
				description: 'Topic index.',
				eyebrow: 'index terms',
				body: 'Tags connect paper notes, opinion pieces, and benchmark observations.',
				emptyTitle: 'No tags yet.',
				emptyBody: 'The tag index will appear after the first article is published.',
				tagDescription: (tag: string) => `Content tagged ${tag}.`,
				relatedCount: (count: number) => `${count} related ${count === 1 ? 'piece' : 'pieces'}.`,
			},
			about: {
				title: 'About',
				description: 'About Lens Frontier.',
				eyebrow: 'about',
				dek: 'A place for paper notes and modest arguments around benchmarks and evaluation.',
				paragraphs: [
					'The goal is not to create a single official line. It is to put reading notes, arguments, and judgments into a traceable context: what evidence a claim depends on, where its boundary sits, and which assumptions separate it from real systems or evaluation protocols.',
					'Each article should keep sources, assumptions, limits, and personal judgment visible. Claims can be modest, but the reasoning should be traceable; different authors can keep different angles, especially around benchmark design, result interpretation, and the gap to real tasks.',
				],
			},
		},
		article: {
			paper: 'Paper',
			code: 'Code',
			spec: {
				date: 'Date',
				paperAuthors: 'Paper Authors',
				venue: 'Venue',
				benchmarks: 'Benchmarks',
				tasks: 'Tasks',
				status: 'Status',
				area: 'Area',
				metric: 'Metric',
				version: 'Version',
				risk: 'Risk',
				stance: 'Stance',
			},
		},
		languageNames: {
			zh: '中文',
			en: 'EN',
		},
	},
} as const;

export function isLanguage(value: unknown): value is Language {
	return typeof value === 'string' && languages.includes(value as Language);
}

export function languageFrom(value: unknown): Language {
	return isLanguage(value) ? value : defaultLanguage;
}

export function siteFor(lang: Language) {
	return sites[lang];
}

export function path(input = '/') {
	const base = import.meta.env.BASE_URL || '/';
	const normalizedBase = base.endsWith('/') ? base : `${base}/`;
	const normalizedInput = input.replace(/^\/+/, '');
	return input === '/' ? normalizedBase : `${normalizedBase}${normalizedInput}`;
}

export function localizedPath(lang: Language, input = '/') {
	const normalizedInput = input.startsWith('/') ? input : `/${input}`;
	return path(`/${lang}${normalizedInput === '/' ? '/' : normalizedInput}`);
}

export function formatDate(date: Date, lang: Language = defaultLanguage) {
	return new Intl.DateTimeFormat(sites[lang].locale, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T) {
	return b.data.date.getTime() - a.data.date.getTime();
}

export function tagPath(tag: string, lang: Language = defaultLanguage) {
	return localizedPath(lang, `/tags/${encodeURIComponent(tag)}/`);
}

export function entryPath(collection: 'papers' | 'benchmarks' | 'opinions', id: string, lang: Language = defaultLanguage) {
	return localizedPath(lang, `/${collection}/${id}/`);
}
