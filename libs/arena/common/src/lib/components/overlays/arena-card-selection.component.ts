import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	CARDS_HIGHLIGHT_SERVICE_TOKEN,
	CardsFacadeService,
	ICardsHighlightService,
	ILocalizationService,
} from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { ArenaCardStatsService } from '../../services/arena-card-stats.service';
import {
	ARENA_DRAFT_MANAGER_SERVICE_TOKEN,
	IArenaDraftManagerService,
} from '../../services/arena-draft-manager.interface';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-selection',
	styleUrls: ['./arena-card-selection.component.scss'],
	template: `
		<div class="root" *ngIf="showing$ | async">
			<arena-card-option
				class="option"
				*ngFor="let option of options$ | async; trackBy: trackByFn"
				[card]="option"
				[pickNumber]="(pickNumber$ | async)!"
				(mouseenter)="onMouseEnter(option.cardId)"
				(mouseleave)="onMouseLeave(option.cardId, $event)"
			>
			</arena-card-option>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showing$: Observable<boolean>;
	pickNumber$: Observable<number>;
	options$: Observable<readonly ArenaCardOption[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		// Provided in the app
		@Inject(ARENA_DRAFT_MANAGER_SERVICE_TOKEN) private readonly draftManager: IArenaDraftManagerService,
		@Inject(CARDS_HIGHLIGHT_SERVICE_TOKEN) private readonly cardsHighlightService: ICardsHighlightService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.draftManager.isReady();
		await this.arenaCardStats.isReady();
		await this.prefs.isReady();
		console.debug('[arena-card-selection] ready');

		// TODO: load the context of the current class
		// So this means storing somewhere the current draft info (including the decklist)
		// this.updateClassContext();
		this.options$ = combineLatest([this.draftManager.cardOptions$$, this.arenaCardStats.cardStats$$]).pipe(
			this.mapData(
				([options, stats]) =>
					options?.map((option) => {
						const stat = stats?.find((s) => s.cardId === option);
						const drawnWinrate = !stat?.stats?.drawn ? null : stat.stats.drawnThenWin / stat.stats.drawn;
						return {
							cardId: option,
							drawnWinrate: drawnWinrate,
						} as ArenaCardOption;
					}) ?? [],
			),
		);
		this.showing$ = this.options$.pipe(this.mapData((options) => options.length > 0));
		this.pickNumber$ = this.draftManager.currentDeck$$.pipe(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.mapData((deck: any /*DeckInfoFromMemory*/) => deck?.DeckList?.length ?? 0),
		);

		this.cardsHighlightService.initForDuels();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseEnter(cardId: string) {
		console.debug('mouseenter', cardId);
		this.cardsHighlightService.onMouseEnter(cardId, 'duels');
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		this.cardsHighlightService.onMouseLeave(cardId);
	}

	trackByFn(index: number, item: ArenaCardOption) {
		return index;
	}
}
