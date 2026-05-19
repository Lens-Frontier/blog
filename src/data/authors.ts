export type AuthorProfile =
	| {
			name: string;
			github?: string;
			avatar?: string;
			url?: string;
	  }
	| {
			name?: string;
			github: string;
			avatar?: string;
			url?: string;
	  };

export interface AuthorInput {
	id?: string;
	name?: string;
	github?: string;
	avatar?: string;
	url?: string;
}

export const authorIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const authorRegistry: Record<string, AuthorProfile> = {
	mattheliu: {
		github: 'mattheliu',
	},
	// Add recurring authors here, then reference them from posts with:
	// authors:
	//   - id: "your-id"
	//
	// "your-id": {
	//   name: "Your Name",
	//   github: "your-github-id",
	// },
};

function hasText(value: unknown) {
	return typeof value === 'string' && value.trim().length > 0;
}

function validateAuthorProfile(id: string, profile: AuthorProfile) {
	if (!authorIdPattern.test(id)) {
		throw new Error(`Author registry id must use lowercase kebab-case: ${id}`);
	}
	if (!hasText(profile.name) && !hasText(profile.github)) {
		throw new Error(`Author registry entry "${id}" needs either name or github.`);
	}
	if (profile.name !== undefined && !hasText(profile.name)) {
		throw new Error(`Author registry entry "${id}" has an empty name.`);
	}
	if (profile.github !== undefined && !hasText(profile.github)) {
		throw new Error(`Author registry entry "${id}" has an empty github.`);
	}
	if (profile.avatar !== undefined && !hasText(profile.avatar)) {
		throw new Error(`Author registry entry "${id}" has an empty avatar.`);
	}
	if (profile.url !== undefined) {
		new URL(profile.url);
	}
}

export function validateAuthorRegistry() {
	for (const [id, profile] of Object.entries(authorRegistry)) {
		validateAuthorProfile(id, profile);
	}
}

validateAuthorRegistry();

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
	return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

export function hasAuthorId(id: string) {
	return Object.prototype.hasOwnProperty.call(authorRegistry, id);
}

export function resolveAuthor(author: AuthorInput): AuthorProfile {
	const profile = author.id && hasAuthorId(author.id) ? authorRegistry[author.id] : {};
	const { id: _id, ...overrides } = author;

	return {
		...profile,
		...withoutUndefined(overrides),
	} as AuthorProfile;
}

export function resolveAuthors(authors: AuthorInput[] = []) {
	return authors.map(resolveAuthor);
}
