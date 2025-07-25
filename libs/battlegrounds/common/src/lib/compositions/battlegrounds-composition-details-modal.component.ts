import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { capitalizeFirstLetter } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsMetaCompCard, BgsMetaCompStatTierItem } from './meta-comp.model';

@Component({
	selector: 'battlegrounds-composition-details-modal',
	styleUrls: ['./battlegrounds-composition-details-modal.component.scss'],
	template: `
		<div class="modal-overlay" (click)="closeModal()">
			<div class="modal-content" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<h2 class="composition-name">{{ compName }}</h2>
					<button class="close-button" (click)="closeModal()">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#window-control_close" />
						</svg>
					</button>
				</div>

				<div class="modal-body" scrollable>
					<div class="composition-overview">
						<div class="background-cards">
							<div class="background-image" *ngFor="let card of coreCardArts">
								<img [src]="card" />
							</div>
						</div>

						<div class="stats-grid">
							<div class="stat-item">
								<div
									class="stat-label"
									[fsTranslate]="'app.battlegrounds.compositions.columns.first-percent'"
								></div>
								<div class="stat-value">{{ firstPercent | number: '1.1-1' }}</div>
							</div>
							<div class="stat-item">
								<div
									class="stat-label"
									[fsTranslate]="'app.battlegrounds.compositions.columns.position'"
								></div>
								<div class="stat-value">{{ averagePlacement }}</div>
							</div>
							<div class="stat-item" *ngIf="expertRating">
								<div
									class="stat-label"
									[fsTranslate]="'app.battlegrounds.compositions.columns.expert-rating'"
								></div>
								<div class="stat-value expert-rating {{ expertRating?.toLowerCase() }}">
									{{ expertRating }}
								</div>
							</div>
							<div class="stat-item" *ngIf="expertDifficulty">
								<div
									class="stat-label"
									[fsTranslate]="'app.battlegrounds.compositions.columns.expert-difficulty'"
								></div>
								<div class="stat-value expert-difficulty {{ expertDifficulty?.toLowerCase() }}">
									{{ expertDifficulty }}
								</div>
							</div>
							<div class="stat-item">
								<div class="stat-label" [fsTranslate]="'app.decktracker.meta.games-header'"></div>
								<div class="stat-value">{{ dataPoints }}</div>
							</div>
						</div>
					</div>

					<div class="cards-section">
						<div class="cards-group" *ngIf="coreCards?.length">
							<h3 [fsTranslate]="'app.battlegrounds.compositions.columns.core-cards'"></h3>
							<div class="cards-container">
								<div class="card-item" *ngFor="let card of coreCards">
									<card-on-board
										class="card"
										[entity]="card.entity"
										[cardTooltip]="card.cardId"
										[cardTooltipBgs]="true"
									>
									</card-on-board>
								</div>
							</div>
						</div>

						<div class="cards-group" *ngIf="addonCards?.length">
							<h3 [fsTranslate]="'app.battlegrounds.compositions.columns.addon-cards'"></h3>
							<div class="cards-container">
								<div class="card-item" *ngFor="let card of addonCards">
									<card-on-board
										class="card"
										[entity]="card.entity"
										[cardTooltip]="card.cardId"
										[cardTooltipBgs]="true"
									>
									</card-on-board>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCompositionDetailsModalComponent {
	@Input() closeHandler: () => void;

	@Input() set composition(value: BgsMetaCompStatTierItem) {
		if (!value) return;

		this.compName = value.name;
		this.firstPercent = value.firstPercent * 100;
		this.expertRating = capitalizeFirstLetter(value.expertRating);
		this.expertDifficulty = capitalizeFirstLetter(value.expertDifficulty);
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
		});
		this.averagePlacement = this.buildValue(value.averagePlacement);
		this.coreCards = value.coreCards;
		this.addonCards = value.addonCards;
		this.coreCardArts =
			value.coreCards
				?.slice(0, 5)
				.map((card) => `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.png`) || [];
	}

	compName: string;
	dataPoints: string;
	firstPercent: number;
	expertRating: string | null;
	expertDifficulty: string | null;
	coreCards: readonly BgsMetaCompCard[];
	addonCards: readonly BgsMetaCompCard[];
	averagePlacement: string;
	coreCardArts: string[];

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	closeModal() {
		if (this.closeHandler) {
			this.closeHandler();
		}
	}

	private buildValue(value: number): string {
		return value == null
			? '-'
			: value === 0
			? '0'
			: value.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  });
	}
}
