import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	selector: 'bgs-card-tooltip',
	styleUrls: [`../../../css/component/battlegrounds/bgs-card-tooltip.component.scss`],
	template: `
		<div class="container" [ngClass]="{ 'hidden': !_visible }">
			<img [src]="image" class="card" />
			<card-stats [cardId]="cardId" [attack]="attack" [health]="health" [autoFontResize]="false"> </card-stats>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsCardTooltipComponent {
	_entity: Entity;
	_visible: boolean;

	image: string;
	cardId: string;
	attack: number;
	health: number;

	@Input() set config(value: Entity) {
		if (value === this._entity) {
			return;
		}
		this._entity = value;
		this.cardId = value.cardID;
		this.attack = this._entity.getTag(GameTag.ATK);
		this.health = this._entity.getTag(GameTag.HEALTH);
		this.image = this.i18n.getCardImage(this._entity.cardID, {
			isBgs: true,
			isPremium: this._entity.getTag(GameTag.PREMIUM) === 1,
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set visible(value: boolean) {
		if (value === this._visible) {
			return;
		}

		this._visible = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef, private readonly i18n: LocalizationFacadeService) {}
}
