import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	standalone: false,
	selector: 'hero-portrait',
	styleUrls: [`../../../css/component/collection/hero-portrait.component.scss`],
	template: `
		<div class="hero-portrait" [ngClass]="{ missing: missing }">
			<div class="perspective-wrapper" rotateOnMouseOver>
				<img [src]="image" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPortraitComponent {
	@Input() set heroPortrait(value: ReferenceCard | CollectionReferenceCard) {
		this.missing = (value as CollectionReferenceCard).numberOwned === 0;
		this.image = this.i18n.getCardImage(value.id, { isHeroSkin: true });
	}

	missing: boolean;
	image: string;

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
