import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { getHeroRole, getShortMercHeroName } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { MercenaryCompositionInfo, MercenaryCompositionInfoBench } from './mercenary-info';

@Component({
	selector: 'mercenaries-composition-stat',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-composition-stat.component.scss`,
	],
	template: `
		<!-- Unused -->
		<!-- <div class="mercenaries-composition-stat" [ngClass]="{ 'show-merc-names': _showMercNames }" (click)="select()">
			<div class="heroes-container " [ngClass]="{ 'starter': !!starterHeroes?.length }">
				<div class="portrait" *ngFor="let hero of starterHeroes" [cardTooltip]="hero.cardId">
					<img class="icon" [src]="hero.portraitUrl" />
					<img class="frame" [src]="hero.frameUrl" />
					<div class="name">{{ hero.name }}</div>
				</div>
			</div>
			<div class="heroes-container bench" *ngIf="!!benchHeroes?.length">
				<div class="portrait" *ngFor="let hero of benchHeroes" [cardTooltip]="hero.cardId">
					<img class="icon" [src]="hero.portraitUrl" />
					<img class="frame" [src]="hero.frameUrl" />
				</div>
			</div>
			<div class="stats">
				<div class="item winrate">
					<div class="values">
						<div class="value player">{{ buildPercents(globalWinrate) }}</div>
					</div>
				</div>
				<div class="item winrate">
					<div class="values">
						<div class="value player">{{ buildValue(globalTotalMatches, 0) }}</div>
					</div>
				</div>
			</div>
		</div> -->
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesCompositionStatComponent {
	@Input() set showMercNames(value: boolean) {
		this._showMercNames = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set stat(value: MercenaryCompositionInfo | MercenaryCompositionInfoBench) {
		if (!value) {
			return;
		}

		this.id = value.id;
		this.starterHeroes = value.heroCardIds.map((cardId) => ({
			cardId: cardId,
			name: getShortMercHeroName(cardId, this.cards),
			portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
			frameUrl: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${getHeroRole(
				this.cards.getCard(cardId).mercenaryRole,
			)}.png`,
		}));
		this.benchHeroes = this.hasBench(value)
			? value.benches[0].heroCardIds.map((cardId) => ({
					cardId: cardId,
					portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
					frameUrl: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${getHeroRole(
						this.cards.getCard(cardId).mercenaryRole,
					)}.png`,
			  }))
			: null;
		this.globalWinrate = value.globalWinrate;
		this.globalTotalMatches = value.globalTotalMatches;
	}

	_showMercNames: boolean;
	starterHeroes: readonly Hero[];
	benchHeroes: readonly Hero[];
	globalWinrate: number;
	globalTotalMatches: number;

	private id: string;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly cards: CardsFacadeService,
		private readonly store: AppUiStoreFacadeService,
	) {}

	select() {
		// this.store.send(new MercenariesSelectCompositionEvent(this.id));
	}

	buildPercents(value: number): string {
		if (value === 100) {
			return '100%';
		}
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(decimal);
	}

	private hasBench(
		value: MercenaryCompositionInfo | MercenaryCompositionInfoBench,
	): value is MercenaryCompositionInfo {
		return !!(value as MercenaryCompositionInfo)?.benches?.length;
	}
}

interface Hero {
	readonly cardId: string;
	readonly portraitUrl: string;
	readonly frameUrl: string;
}
