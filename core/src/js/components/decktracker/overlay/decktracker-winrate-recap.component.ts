import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { StatsRecap } from '../../../models/decktracker/stats-recap';
import { formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'decktracker-winrate-recap',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-winrate-recap.component.scss',
	],
	template: `
		<div class="winrate-recap" *ngIf="wins + losses > 0">
			<div class="recap text" [helpTooltip]="tooltip">
				<div class="value">{{ text }}</div>
			</div>
			<div class="recap winrate">
				<div class="value">
					{{ winrate != null ? winrate.toFixed(1) + '%' : '-' }}
				</div>
			</div>
			<div class="recap details">
				<div class="value wins">{{ wins }}</div>
				<div class="value separator">/</div>
				<div class="value losses">{{ losses }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerWinrateRecapComponent implements OnDestroy {
	text: string;
	tooltip: string;
	winrate: number;
	wins: number;
	losses: number;

	private _stats: StatsRecap;
	private _type: 'matchup' | 'deck';

	@Input() set stats(value: StatsRecap) {
		if (value === this._stats) {
			return;
		}
		this._stats = value;
		this.updateInfo();
	}

	@Input() set type(value: 'matchup' | 'deck') {
		if (value === this._type) {
			return;
		}
		this._type = value;
		this.updateInfo();
	}

	constructor(private readonly cdr: ChangeDetectorRef, private readonly i18n: LocalizationFacadeService) {}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this._stats = null;
	}

	private updateInfo() {
		if (!this._stats || !this._type) {
			return;
		}

		this.winrate = this._stats.winratePercent;
		this.wins = this._stats.totalWins || 0;
		this.losses = this._stats.totalLosses || 0;
		const dateFrom = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' }).format(
			this._stats.dateFrom,
		);
		if (this._type === 'deck') {
			this.text = "Deck's winrate";
			this.tooltip = "This deck's winrate in ranked since " + dateFrom;
		} else {
			const readableClass = formatClass(this._stats.opponentClass, this.i18n);
			this.text = 'VS. ' + readableClass;
			this.tooltip = "This deck's winrate in ranked against " + readableClass + ' since ' + dateFrom;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
