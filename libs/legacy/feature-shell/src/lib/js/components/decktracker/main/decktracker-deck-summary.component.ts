import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { getDefaultHeroDbfIdForClass } from '@firestone-hs/reference-data';
import { DeckSummary } from '@firestone/constructed/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { StatGameFormatType } from '@firestone/stats/data-access';
import { BehaviorSubject, combineLatest, filter, Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import {
	ChangeVisibleApplicationEvent,
	ConstructedSetDeckGroupNameEvent,
	DecktrackerDeleteDeckEvent,
	HideDeckSummaryEvent,
	RestoreDeckSummaryEvent,
	SelectDeckDetailsEvent,
} from '@firestone/mainwindow/common';

@Component({
	standalone: false,
	selector: 'decktracker-deck-summary',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-summary.component.scss`,
	],
	template: `
		<div
			class="decktracker-deck-summary"
			tabindex="0"
			[ngClass]="{ hidden: hidden, 'multi-class-version-group': versionGroupHasMultipleClasses }"
			(click)="selectDeck($event)"
		>
			<div class="deck-title-row" *ngIf="!editingGroupName; else groupNameEditTpl">
				<div class="deck-name" [helpTooltip]="deckNameTooltip">{{ deckName }}</div>
			</div>
			<ng-template #groupNameEditTpl>
				<div class="group-name-edit-wrap" (click)="$event.stopPropagation()">
					<input
						#groupNameInput
						type="text"
						class="group-name-input"
						[value]="groupNameDraft"
						(input)="onGroupNameDraftInput($event)"
						(keydown)="onGroupNameKeydown($event)"
						(blur)="commitGroupNameEdit()"
					/>
				</div>
			</ng-template>
			<div class="deck-image" *ngIf="!versionGroupHasMultipleClasses" aria-hidden="true">
				<img class="skin" [src]="skin$ | async" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/hero_frame.png"
				/>
				<img class="decoration {{ format }}" *ngIf="decoration" [src]="decoration" />
			</div>
			<div class="stats">
				<div
					class="text total-games"
					[fsTranslate]="'app.decktracker.deck-summary.total-games'"
					[translateParams]="{ value: totalGames }"
					[attr.aria-label]="'app.decktracker.deck-summary.total-games' | fsTranslate: { value: totalGames }"
				></div>
				<div
					class="text win-rate"
					*ngIf="winRatePercentage != null"
					[fsTranslate]="'app.decktracker.deck-summary.winrate'"
					[translateParams]="{ value: winRatePercentage }"
					[attr.aria-label]="
						'app.decktracker.deck-summary.winrate' | fsTranslate: { value: winRatePercentage }
					"
				></div>
				<div
					class="last-used"
					*ngIf="totalGames > 0"
					[fsTranslate]="'app.decktracker.deck-summary.last-used'"
					[translateParams]="{ value: lastUsed }"
					[attr.aria-label]="'app.decktracker.deck-summary.last-used' | fsTranslate: { value: lastUsed }"
				></div>
				<div
					class="last-used"
					*ngIf="totalGames == 0"
					[fsTranslate]="'app.decktracker.deck-summary.created-on'"
					[translateParams]="{ value: lastUsed }"
					[attr.aria-label]="'app.decktracker.deck-summary.created-on' | fsTranslate: { value: lastUsed }"
				></div>
			</div>
			<div class="buttons">
				<button
					class="move-button"
					[helpTooltip]="'app.decktracker.deck-summary.move-button-tooltip' | fsTranslate"
					aria-hidden="true"
				>
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#move"></use>
					</svg>
				</button>
				<button
					*ngIf="showGroupNameEdit"
					type="button"
					class="rename-group-button"
					inlineSVG="assets/svg/rename.svg"
					[helpTooltip]="'app.decktracker.decks.group-name-edit-tooltip' | fsTranslate"
					(click)="startGroupNameEdit($event)"
				></button>
				<copy-deckstring
					class="copy-button"
					[copyText]="'decktracker.deck-name.copy-deckstring-label' | fsTranslate"
					[showTooltip]="true"
					[origin]="'decktracker-main-window'"
					[deckName]="deckName"
					[deckstring]="deckstring"
					(click)="$event.stopPropagation()"
				></copy-deckstring>
				<button
					class="close-button"
					[helpTooltip]="'app.decktracker.deck-summary.archive-button-tooltip' | fsTranslate"
					(mousedown)="hideDeck($event)"
					*ngIf="!hidden"
				>
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#hide"></use>
					</svg>
				</button>
				<button
					class="restore-button"
					[helpTooltip]="'app.decktracker.deck-summary.restore-button-tooltip' | fsTranslate"
					(mousedown)="restoreDeck($event)"
					*ngIf="hidden"
				>
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#show"></use>
					</svg>
				</button>
				<button
					class="delete-button"
					[helpTooltip]="deleteDeckTooltip"
					confirmationTooltip
					[askConfirmation]="true"
					[confirmationTitle]="'app.duels.deck-stat.delete-deck-confirmation-title' | fsTranslate"
					[confirmationText]="'app.duels.deck-stat.delete-deck-confirmation-text' | fsTranslate"
					[validButtonText]="'app.duels.deck-stat.delete-deck-confirmation-ok' | fsTranslate"
					[cancelButtonText]="'app.duels.deck-stat.delete-deck-confirmation-cancel' | fsTranslate"
					(onConfirm)="deleteDeck()"
					inlineSVG="assets/svg/bin.svg"
				></button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckSummaryComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	skin$: Observable<string>;

	@Input() set deck(value: DeckSummary) {
		this._deck = value;
		this.deckName = value.deckName || this.i18n.translateString('app.decktracker.deck-summary.default-deck-name');
		this.deckstring = value.deckstring;
		this.format = value.format;
		this.deckNameTooltip = `${this.deckName} (${this.i18n.translateString('global.format.' + this.format)})`;
		this.totalGames = value.totalGames ?? 0;
		this.winRatePercentage =
			value.winRatePercentage != null
				? parseFloat('' + value.winRatePercentage).toLocaleString(this.i18n.formatCurrentLocale(), {
						minimumIntegerDigits: 1,
						maximumFractionDigits: 2,
					})
				: null;
		this.lastUsed = value.lastUsedTimestamp ? this.buildLastUsedDate(value.lastUsedTimestamp) : 'N/A';

		this.skin$$.next(value.skin);
		this.hidden = value.hidden;
		this.decoration = this.buildDecoration(value.format);
		this.versionGroupHasMultipleClasses = !!value.versionGroupHasMultipleClasses;
		this.showGroupNameEdit = (value.allVersions?.length ?? 0) > 1;
		this.deckSkinContext$$.next({ versionGroupHasMultipleClasses: this.versionGroupHasMultipleClasses });
	}

	@ViewChild('groupNameInput') groupNameInput: ElementRef<HTMLInputElement>;

	_deck: DeckSummary;
	deckName: string;
	deckstring: string;
	deckNameTooltip: string;
	deckNameClass: string;
	totalGames: number;
	winRatePercentage: string;
	lastUsed: string;
	hidden: boolean;
	decoration: string;
	format: StatGameFormatType;
	versionGroupHasMultipleClasses = false;
	showGroupNameEdit = false;
	editingGroupName = false;
	groupNameDraft = '';

	deleteDeckTooltip = this.i18n.translateString('app.duels.deck-stat.delete-deck-tooltip');

	private closingByEscape = false;
	private skin$$ = new BehaviorSubject<string | null>(null);
	private deckSkinContext$$ = new BehaviorSubject<{ versionGroupHasMultipleClasses: boolean }>({
		versionGroupHasMultipleClasses: false,
	});

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.skin$ = combineLatest([
			this.skin$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.replaysShowClassIcon)),
			this.deckSkinContext$$,
		]).pipe(
			filter(([skin]) => !!skin),
			this.mapData(([skin, showClassIcon, ctx]) => {
				const useRealPortrait = !showClassIcon || ctx.versionGroupHasMultipleClasses;
				if (useRealPortrait) {
					return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${skin}.jpg`;
				}
				const card = this.allCards.getCard(skin);
				const defaultHero = getDefaultHeroDbfIdForClass(card.classes?.[0]);
				const defaultHeroCard = this.allCards.getCard(defaultHero);
				return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${defaultHeroCard.id}.jpg`;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	hideDeck(event: MouseEvent) {
		this.mainWindowStateFacade.send(new HideDeckSummaryEvent(this._deck.deckstring));
		event.stopPropagation();
		event.preventDefault();
	}

	restoreDeck(event: MouseEvent) {
		this.mainWindowStateFacade.send(new RestoreDeckSummaryEvent(this._deck.deckstring));
		event.stopPropagation();
		event.preventDefault();
	}

	deleteDeck() {
		console.log('[deck-delete] deleting deck', this._deck?.deckstring);
		this.mainWindowStateFacade.send(new DecktrackerDeleteDeckEvent(this._deck?.deckstring));
	}

	selectDeck(event: MouseEvent) {
		console.debug('[deck-summary] selectDeck', event);
		event.stopPropagation();
		event.preventDefault();
		const tag = (event.target as HTMLElement)?.tagName;
		if (tag === 'BUTTON' || tag === 'COPY-DECKSTRING' || tag === 'INPUT') {
			return;
		}
		this.mainWindowStateFacade.send(new ChangeVisibleApplicationEvent('decktracker'));
		this.mainWindowStateFacade.send(new SelectDeckDetailsEvent(this._deck.deckstring));
	}

	startGroupNameEdit(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.groupNameDraft = this._deck.versionGroupName ?? this.deckName;
		this.editingGroupName = true;
		this.cdr.markForCheck();
		setTimeout(() => this.groupNameInput?.nativeElement?.focus(), 0);
	}

	onGroupNameDraftInput(event: Event) {
		this.groupNameDraft = (event.target as HTMLInputElement).value;
	}

	onGroupNameKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			this.commitGroupNameEdit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			this.closingByEscape = true;
			this.editingGroupName = false;
			this.cdr.markForCheck();
			setTimeout(() => (this.closingByEscape = false), 0);
		}
	}

	commitGroupNameEdit() {
		if (this.closingByEscape) {
			return;
		}
		this.editingGroupName = false;
		const trimmed = this.groupNameDraft.trim();
		const prev = (this._deck.versionGroupName ?? '').trim();
		if (trimmed !== prev) {
			this.mainWindowStateFacade.send(new ConstructedSetDeckGroupNameEvent(this._deck.deckstring, trimmed));
		}
		this.cdr.markForCheck();
	}

	private buildLastUsedDate(lastUsedTimestamp: number): string {
		const date = new Date(lastUsedTimestamp);
		return date
			.toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			})
			.replace(/\s+г\./, ''); //truncate date in russian
	}

	private buildDecoration(gameFormat: StatGameFormatType) {
		switch (gameFormat) {
			case 'classic':
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Classic.png`;
			case 'twist':
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Twist.webp`;
			case 'wild':
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Wild.png`;
			default:
				return null;
		}
	}
}
