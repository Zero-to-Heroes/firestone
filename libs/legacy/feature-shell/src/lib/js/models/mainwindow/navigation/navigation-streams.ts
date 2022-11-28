import { StreamsCategoryType } from '../streams/streams.type';

export class NavigationStreams {
	readonly selectedCategoryId: StreamsCategoryType = 'live-streams';
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';

	public update(base: NavigationStreams): NavigationStreams {
		return Object.assign(new NavigationStreams(), this, base);
	}
}
