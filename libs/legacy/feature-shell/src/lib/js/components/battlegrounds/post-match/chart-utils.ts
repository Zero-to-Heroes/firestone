import { ChartData, ChartType } from 'chart.js';

export const areEqualDataSets = <T extends ChartType>(
	newChartData: ChartData<T>['datasets'],
	existingChartData: ChartData<T>['datasets'],
): boolean => {
	if (!newChartData?.length || !existingChartData?.length) {
		return false;
	}

	if (newChartData.length !== existingChartData.length) {
		return false;
	}

	for (let i = 0; i < newChartData.length; i++) {
		const newData = newChartData[i];
		const existingData = existingChartData[i];
		if (!areEqualDataSet(newData, existingData)) {
			return false;
		}
	}

	return true;
};

const areEqualDataSet = <T extends ChartType>(
	newDataSet: ChartData<T>['datasets'][0],
	existingDataSet: ChartData<T>['datasets'][0],
): boolean => {
	if (!newDataSet?.data?.length || !existingDataSet?.data?.length) {
		return false;
	}

	if (newDataSet.data.length !== existingDataSet.data.length) {
		return false;
	}

	for (let i = 0; i < newDataSet.data.length; i++) {
		const newData = newDataSet.data[i];
		const existingData = existingDataSet.data[i];
		if (newData !== existingData) {
			return false;
		}
	}

	return true;
};
