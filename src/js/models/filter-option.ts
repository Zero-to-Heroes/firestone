export interface FilterOption {
	readonly label: string;
	readonly value: string;
	readonly filterFunction: (VisualAchievement) => boolean;
	readonly emptyStateIcon: string;
	readonly emptyStateTitle: string;
	readonly emptyStateText: string;
}
