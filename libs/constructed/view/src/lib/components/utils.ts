export const buildColor = (
	goodColor: string,
	badColor: string,
	value: number | null,
	maxGood: number,
	minBad: number,
	debug?,
): string => {
	if (value === null) {
		return badColor;
	}

	const percentage = Math.max(0, Math.min(1, (value - minBad) / (maxGood - minBad)));
	const color = interpolateColors(badColor, goodColor, percentage, debug);
	return color;
};

const interpolateColors = (color1Hsl: string, color2Hsl: string, percentage: number, debug): string => {
	const h1 = parseInt(color1Hsl.substring(4, color1Hsl.indexOf(',')), 10);
	const s1 = parseInt(color1Hsl.substring(color1Hsl.indexOf(',') + 1, color1Hsl.lastIndexOf(',')), 10);
	const l1 = parseInt(color1Hsl.substring(color1Hsl.lastIndexOf(',') + 1, color1Hsl.length - 1), 10);
	const h2 = parseInt(color2Hsl.substring(4, color2Hsl.indexOf(',')), 10);
	const s2 = parseInt(color2Hsl.substring(color2Hsl.indexOf(',') + 1, color2Hsl.lastIndexOf(',')), 10);
	const l2 = parseInt(color2Hsl.substring(color2Hsl.lastIndexOf(',') + 1, color2Hsl.length - 1), 10);
	const h = h1 + Math.round((h2 - h1) * percentage);
	const s = s1 + Math.round((s2 - s1) * percentage);
	const l = l1 + Math.round((l2 - l1) * percentage);
	return `hsl(${h}, ${s}%, ${l}%)`;
};
