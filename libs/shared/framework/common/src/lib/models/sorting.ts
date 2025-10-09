export interface SortCriteria<T> {
	readonly criteria: T;
	readonly direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc';

export const invertDirection = (direction: SortDirection): SortDirection => {
	switch (direction) {
		case 'asc':
			return 'desc';
		case 'desc':
			return 'asc';
		default:
			return 'desc';
	}
};
