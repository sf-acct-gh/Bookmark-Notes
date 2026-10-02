export interface Bookmark {
	id: string;
	name: string;
	url: string;
	notes: string;
}

export interface Section {
	id: string;
	name: string;
	bookmarks: Bookmark[];
}

export interface Workspace {
	id: string;
	name: string;
	sections: Section[];
}

export interface BookmarkData {
	workspaces: Workspace[];
}

export interface DuplicateUrlMatch {
	sectionId: string;
	sectionName: string;
	bookmarkId: string;
	bookmarkName: string;
}

export interface BookmarkFormValue {
	name: string;
	url: string;
	notes: string;
	sectionId: string;
}
