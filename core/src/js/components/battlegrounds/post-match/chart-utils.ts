import { ChartDataSets } from 'chart.js';

export const areEqualDataSets = (newChartData: ChartDataSets[], existingChartData: ChartDataSets[]): boolean => {
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

const areEqualDataSet = (newDataSet: ChartDataSets, existingDataSet: ChartDataSets): boolean => {
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
