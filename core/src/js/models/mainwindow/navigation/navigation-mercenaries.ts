import { NonFunctionProperties } from '../../../services/utils';
import { MercenariesCategoryId } from '../../mercenaries/mercenary-category-id.type';

export class NavigationMercenaries {
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';
	readonly selectedCategoryId: MercenariesCategoryId = 'mercenaries-personal-hero-stats';
	readonly selectedHeroId: string;
	readonly selectedDetailsMercId: number;
	readonly selectedCompositionId: string;
	readonly heroSearchString: string;

	public update(base: Partial<NonFunctionProperties<NavigationMercenaries>>): NavigationMercenaries {
		return Object.assign(new NavigationMercenaries(), this, base);
	}

	public getPageName(): string {
		return this.selectedCategoryId;
	}
}
