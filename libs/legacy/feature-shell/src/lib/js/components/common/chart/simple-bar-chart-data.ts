export interface SimpleBarChartData {
	readonly data: readonly SimpleBarChartDataElement[];
}

export interface SimpleBarChartDataElement {
	readonly label: string;
	readonly value: number;
	readonly rawValue?: number;
}
