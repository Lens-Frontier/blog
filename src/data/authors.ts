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

export const authorRegistry: Record<string, AuthorProfile> = {
	// Add recurring authors here, then reference them from posts with:
	// authors:
	//   - id: "your-id"
	//
	// your-id: {
	//   name: "Your Name",
	//   github: "your-github-id",
	// },
};

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
