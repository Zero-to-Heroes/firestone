export class ChartUtils {
	public static async colorFor(cardId: string): Promise<string> {
		// const heroArt = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
		// console.log('getting vibrant palette for', heroArt);
		// try {
		// 	// const vibrant = new Vibrant(heroArt, {
		// 	// 	colorCount: 1,
		// 	// });
		// 	const palette = await Vibrant.from(heroArt)
		// 		// .maxColorCount(1)
		// 		.getPalette();
		// 	console.log('getting palette for', palette);
		// 	return palette.Vibrant.hex;
		// } catch (e) {
		// 	console.error('issue trying to get vibrant', heroArt, e);
		// }
		return 'red';
	}
}
