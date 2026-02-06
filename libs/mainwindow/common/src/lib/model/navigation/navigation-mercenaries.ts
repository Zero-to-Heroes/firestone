import { MercenariesCategoryId } from '@firestone/shared/common/service';
import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class NavigationMercenaries {
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';
	readonly selectedCategoryId: MercenariesCategoryId = 'mercenaries-personal-hero-stats';
	readonly selectedHeroId: string;
	readonly selectedDetailsMercId: number;
	readonly selectedCompositionId: string;

	public update(base: Partial<NonFunctionProperties<NavigationMercenaries>>): NavigationMercenaries {
		return Object.assign(new NavigationMercenaries(), this, base);
	}

	public getPageName(): string {
		return this.selectedCategoryId;
	}
}
