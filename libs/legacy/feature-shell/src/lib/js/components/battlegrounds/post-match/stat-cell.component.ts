import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { ShowReplayEvent } from '../../../services/mainwindow/store/events/replays/show-replay-event';
import { OverwolfService } from '../../../services/overwolf.service';

declare let amplitude: any;

@Component({
	selector: 'stat-cell',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/stat-cell.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="entry cell" [ngClass]="{ 'new-record': isNewRecord }">
			<div
				class="record-icon"
				[helpTooltip]="'app.battlegrounds.personal-stats.records.record-broken-tooltip' | owTranslate"
			>
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#new_record" />
				</svg>
			</div>
			<div class="label" [helpTooltip]="tooltipText">{{ label }}</div>
			<div class="filler"></div>
			<div class="hero">
				<img
					*ngIf="_heroCardId"
					[helpTooltip]="
						'app.battlegrounds.personal-stats.records.rows.best-stat-hero'
							| owTranslate: { heroName: getCardName(_heroCardId) }
					"
					[src]="heroImage"
					class="portrait"
				/>
				<img
					*ngIf="heroIcon"
					[helpTooltip]="
						'app.battlegrounds.personal-stats.records.rows.best-stat-hero'
							| owTranslate: { heroName: getCardName(heroIcon) }
					"
					[src]="'https://static.zerotoheroes.com/hearthstone/cardart/256x/' + heroIcon + '.jpg'"
					class="portrait"
				/>
			</div>
			<div
				class="replay"
				*ngIf="reviewId"
				(click)="showReplay()"
				[helpTooltip]="'app.battlegrounds.personal-stats.records.rows.watch-replay-tooltip' | owTranslate"
			>
				<div class="watch-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
					</svg>
				</div>
			</div>
			<div class="value">{{ value }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCellComponent implements AfterViewInit {
	@Input() label: string;
	@Input() value: number | string;
	@Input() isNewRecord: boolean;
	@Input() tooltipText: string;
	@Input() heroIcon: string;
	@Input() reviewId: string;

	@Input() set heroCardId(value: string) {
		this._heroCardId = value;
		this.heroImage = this.i18n.getCardImage(this._heroCardId, { isBgs: true });
	}

	_heroCardId: string;
	heroImage: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	showReplay() {
		amplitude.getInstance().logEvent('click-on-record-broken-replay');
		this.stateUpdater.next(new ShowReplayEvent(this.reviewId));
	}

	getCardName(cardId: string): string {
		return this.cards.getCard(cardId)?.name || 'this hero';
	}
}
