export interface DuelsTier {
	readonly label: string;
	readonly tooltip: string;
	readonly items: readonly DuelsTierItem[];
}

export interface DuelsTierItem {
	readonly cardId: string;
	readonly icon: string;
	readonly secondaryClassIcon?: string;
}
