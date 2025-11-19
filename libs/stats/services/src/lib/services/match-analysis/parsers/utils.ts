export const toTimestamp = (ts: string): Date => {
	const result = new Date();
	const split = ts.split(':');
	let hoursFromXml = parseInt(split[0]);
	if (hoursFromXml >= 24) {
		result.setDate(result.getDate() + 1);
		hoursFromXml -= 24;
	}
	result.setHours(hoursFromXml);
	result.setMinutes(parseInt(split[1]));
	result.setSeconds(parseInt(split[2].split('.')[0]));
	const milliseconds = parseInt(split[2].split('.')[1]) / 1000;
	result.setMilliseconds(milliseconds);
	return result;
};
