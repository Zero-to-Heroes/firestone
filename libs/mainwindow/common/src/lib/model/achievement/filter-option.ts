import { VisualAchievement } from '@firestone/achievements/common';

export interface FilterOption {
	readonly label: string;
	readonly value: string;
	readonly filterFunction: (achievement: VisualAchievement) => boolean;
	readonly emptyStateIcon: string;
	readonly emptyStateTitle: string;
	readonly emptyStateText: string;
}
