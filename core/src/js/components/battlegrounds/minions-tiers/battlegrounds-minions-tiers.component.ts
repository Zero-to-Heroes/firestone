import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../models/preferences';
import { getAllCardsInGame } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { FeatureFlags } from '../../../services/feature-flags';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { groupByFunction } from '../../../services/utils';

@Component({
	selector: 'battlegrounds-minions-tiers',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component.scss',
	],
	template: `
		<div class="battlegrounds-minions-tiers overlay-container-parent battlegrounds-theme">
			<div class="tiers-container" *ngIf="showMinionsList">
				<ul class="tiers">
					<tavern-level-icon
						class="tavern"
						*ngFor="let currentTier of tiers; trackBy: trackByFn"
						[ngClass]="{
							'selected': displayedTier && displayedTier.tavernTier === currentTier.tavernTier,
							'locked': isLocked(currentTier)
						}"
						[level]="currentTier.tavernTier"
						(mouseover)="onTavernMouseOver(currentTier)"
						(click)="onTavernClick(currentTier)"
						(mouseleave)="onTavernMouseLeave(currentTier)"
					></tavern-level-icon>
				</ul>
				<bgs-minions-list
					*ngIf="displayedTier || lockedTier"
					[cards]="(displayedTier || lockedTier).cards"
				></bgs-minions-list>
			</div>
			<tribes-highlight
				class="tribe-highlight"
				*ngIf="showTribesHighlight"
				[cards]="cardsInGame"
				[highlightedTribes]="highlightedTribes"
			>
			</tribes-highlight>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMinionsTiersOverlayComponent implements AfterViewInit, OnDestroy {
	windowId: string;

	state: BattlegroundsState;
	highlightedTribes: readonly Race[];
	cardsInGame: readonly ReferenceCard[];
	tiers: readonly Tier[];
	displayedTier: Tier;
	lockedTier: Tier;
	showTribesHighlight: boolean;
	showMinionsList: boolean;

	private gameInfoUpdatedListener: (message: any) => void;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	private storeSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
		private allCards: AllCardsService,
	) {
		this.init();
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;

		const storeBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
		this.storeSubscription = storeBus.subscribe(async (newState: BattlegroundsState) => {
			if (!newState) {
				return;
			}
			//console.log('got state', newState);
			await this.allCards.initializeCardsDb();
			await this.updateAvailableCards(newState);
			//console.log('available cards', this.cardsInGame);
			this.tiers = this.buildTiers(newState);
			this.highlightedTribes = newState.highlightedTribes;
			//console.log('updating tiers', this.tiers, newState, this.cardsInGame);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			this.setDisplayPreferences(event.preferences);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		this.setDisplayPreferences(await this.prefs.getPreferences());
		await this.changeWindowSize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.deckSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
	}

	trackByFn(tavernTier: Tier) {
		return tavernTier?.tavernTier;
	}

	onTavernClick(tavernTier: Tier) {
		this.displayedTier = tavernTier;
		if (this.isLocked(tavernTier)) {
			this.lockedTier = undefined;
		} else {
			this.lockedTier = tavernTier;
			this.displayedTier = undefined;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseOver(tavernTier: Tier) {
		if (this.lockedTier) {
			return;
		}

		this.displayedTier = tavernTier;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseLeave(tavernTier: Tier) {
		if (this.lockedTier) {
			return;
		}
		this.displayedTier = undefined;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	isLocked(tavernTier: Tier) {
		return this.lockedTier && tavernTier && this.lockedTier.tavernTier === tavernTier.tavernTier;
	}

	private updateAvailableCards(state: BattlegroundsState) {
		if (!state?.currentGame?.availableRaces?.length) {
			return;
		}

		if (!this.allCards.getCards()?.length) {
			return;
		}

		this.cardsInGame = getAllCardsInGame(state.currentGame.availableRaces, this.allCards);
	}

	private buildTiers(state: BattlegroundsState): readonly Tier[] {
		const groupedByTier: { [tierLevel: string]: readonly ReferenceCard[] } = groupByFunction(
			(card: ReferenceCard) => '' + card.techLevel,
		)(this.cardsInGame);
		return Object.keys(groupedByTier).map(tierLevel => ({
			tavernTier: parseInt(tierLevel),
			cards: groupedByTier[tierLevel],
		}));
	}

	private setDisplayPreferences(preferences: Preferences) {
		this.showMinionsList = FeatureFlags.ENABLE_BG_MINIONS_LIST && preferences.bgsEnableMinionListOverlay;
		this.showTribesHighlight = FeatureFlags.ENABLE_BG_TRIBE_HIGHLIGHT && preferences.bgsShowTribesHighlight;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}

		const gameWidth = gameInfo.width;
		const height = gameInfo.height;
		const width = 400;
		await this.ow.changeWindowSize(this.windowId, width, height);
		const dpi = gameInfo.logicalWidth / gameWidth;
		const newLeft = dpi * (gameWidth - width);
		await this.ow.changeWindowPosition(this.windowId, newLeft - 15, 15);
		//console.log('changing size', width, height, newLeft, gameInfo);
	}

	private async init() {
		await this.allCards.initializeCardsDb();
	}
}

interface Tier {
	tavernTier: number;
	cards: readonly ReferenceCard[];
}
