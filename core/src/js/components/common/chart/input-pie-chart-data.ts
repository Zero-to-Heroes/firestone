export interface InputPieChartData {
	readonly label: string;
	readonly data: number;
	readonly color: string;
}

export interface InputPieChartOptions {
	readonly padding: {
		readonly top: number;
		readonly left: number;
		readonly right: number;
		readonly bottom: number;
	};
	readonly showAllLabels: boolean;
	readonly aspectRatio: number;
}
