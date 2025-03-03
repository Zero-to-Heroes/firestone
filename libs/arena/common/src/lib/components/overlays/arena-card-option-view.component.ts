import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { combineLatest, takeUntil } from 'rxjs';
import { ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD } from '../../services/arena-card-stats.service';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-option-view',
	styleUrls: ['./arena-card-option-view.component.scss'],
	template: `
		<div class="info-container scalable">
			<div class="stats impact">
				<div class="stat winrate draw">
					<span class="label" [fsTranslate]="'app.arena.draft.card-drawn-impact'"></span>
					<span class="value {{ drawWinrateClass }}" [helpTooltip]="drawnImpactTooltip">{{
						drawImpact
					}}</span>
				</div>
				<div class="stat winrate deck">
					<span class="label" [fsTranslate]="'app.arena.draft.card-deck-impact'"></span>
					<span class="value {{ deckWinrateClass }}" [helpTooltip]="deckImpactTooltip">{{ deckImpact }}</span>
				</div>
			</div>
			<div class="stats pick">
				<div class="stat pickrate">
					<span class="label" [fsTranslate]="'app.arena.card-stats.header-pickrate'"></span>
					<span class="value">{{ pickrate }}</span>
				</div>
				<div class="stat pickrate-delta">
					<span class="label" [helpTooltip]="pickRateImpactTooltip">{{ pickRateHighWinsLabel }}</span>
					<span class="value">{{ pickRateHighWins }}</span>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardOptionViewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set card(value: ArenaCardOption | null) {
		this.drawnWinrate = value?.drawnWinrate == null ? '-' : (100 * value.drawnWinrate).toFixed(1) + '%';
		this.deckWinrate = value?.deckWinrate == null ? '-' : (100 * value.deckWinrate).toFixed(1) + '%';
		this.drawImpact = value?.drawnImpact == null ? '-' : (100 * value.drawnImpact).toFixed(2);
		this.deckImpact = value?.deckImpact == null ? '-' : (100 * value.deckImpact).toFixed(2);
		this.drawWinrateClass = value?.drawnImpact == null ? '' : value.drawnImpact > 0 ? 'positive' : 'negative';
		this.deckWinrateClass = value?.deckImpact == null ? '' : value.deckImpact > 0 ? 'positive' : 'negative';
		this.pickrate = value?.pickRate == null ? '-' : (100 * value.pickRate).toFixed(1) + '%';
		this.pickRateHighWins = value?.pickRateHighWins == null ? '-' : (100 * value.pickRateHighWins).toFixed(1) + '%';
		this.drawnImpactTooltip = this.i18n.translateString(`app.arena.draft.card-drawn-impact-tooltip`, {
			drawWinrate: this.drawnWinrate,
		});
		this.deckImpactTooltip = this.i18n.translateString(`app.arena.draft.card-deck-impact-tooltip`, {
			deckWinrate: this.deckWinrate,
		});
	}

	drawnWinrate: string;
	deckWinrate: string;
	drawImpact: string;
	deckImpact: string;
	drawWinrateClass: string;
	deckWinrateClass: string;
	pickrate: string;
	pickRateHighWins: string;
	drawnImpactTooltip: string | null;
	deckImpactTooltip: string | null;

	pickRateHighWinsLabel = this.i18n.translateString(`app.arena.card-stats.header-pickrate-high-wins-short`, {
		value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
	});
	pickRateImpactTooltip = this.i18n.translateString(`app.arena.card-stats.header-pickrate-high-wins-tooltip`, {
		value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaDraftOverlayScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(async ([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = await this.getScalable();
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async getScalable(): Promise<ElementRef<HTMLElement>> {
		let element = this.el.nativeElement.querySelector('.scalable');
		let retriesLeft = 10;
		while (!element && retriesLeft > 0) {
			await sleep(200);
			element = this.el.nativeElement.querySelector('.scalable');
			retriesLeft--;
		}
		return element;
	}
}
