export interface FilterOption {
    readonly label: string;
    readonly value: string;
    readonly filterFunction: (VisualAchievement) => boolean;
}