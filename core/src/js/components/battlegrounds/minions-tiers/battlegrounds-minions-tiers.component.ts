import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { getAllCardsInGame } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-minions-tiers',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component.scss',
	],
	template: `
		<div class="battlegrounds-minions-tiers scalable" (mouseleave)="onTavernMouseLeave()">
			<div class="tiers-container">
				<ng-container *ngIf="{ tiers: tiers$ | async, currentTurn: currentTurn$ | async } as value">
					<div class="logo-container" *ngIf="value.currentTurn && (showTurnNumber$ | async)">
						<div class="background-main-part"></div>
						<div class="background-second-part"></div>
						<div
							class="turn-number"
							[owTranslate]="'battlegrounds.battle.turn'"
							[translateParams]="{ value: value.currentTurn }"
						></div>
					</div>
					<ng-container *ngIf="showMinionsList$ | async">
						<ul class="tiers">
							<div
								class="tier"
								*ngFor="let currentTier of value.tiers; trackBy: trackByFn"
								[ngClass]="{
									'selected': displayedTier && displayedTier.tavernTier === currentTier.tavernTier,
									'locked': isLocked(currentTier)
								}"
								(mouseover)="onTavernMouseOver(currentTier)"
								(click)="onTavernClick(currentTier)"
							>
								<img class="icon" src="assets/images/bgs/star.png" />
								<div class="number">{{ currentTier.tavernTier }}</div>
							</div>
						</ul>
						<bgs-minions-list
							*ngFor="let tier of value.tiers; trackBy: trackByFn"
							class="minions-list"
							[ngClass]="{
								'active':
									tier.tavernTier === displayedTier?.tavernTier ||
									tier.tavernTier === lockedTier?.tavernTier
							}"
							[cards]="tier.cards"
							[showTribesHighlight]="showTribesHighlight$ | async"
							[highlightedMinions]="highlightedMinions$ | async"
							[highlightedTribes]="highlightedTribes$ | async"
						></bgs-minions-list>
					</ng-container>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMinionsTiersOverlayComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy {
	private static readonly WINDOW_WIDTH = 1300;

	tiers$: Observable<readonly Tier[]>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMinions$: Observable<readonly string[]>;
	currentTurn$: Observable<number>;
	showTribesHighlight$: Observable<boolean>;
	showMinionsList$: Observable<boolean>;
	showTurnNumber$: Observable<boolean>;

	private enableMouseOver: boolean;

	displayedTier: Tier;
	lockedTier: Tier;

	private prefSubscription: Subscription;

	constructor(
		private readonly init_DebugService: DebugService,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.tiers$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main?.currentGame?.availableRaces)
			.pipe(
				this.mapData(([races]) => {
					const cardsInGame = getAllCardsInGame(races, this.allCards);
					return this.buildTiers(cardsInGame);
				}),
			);
		this.highlightedTribes$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.highlightedTribes)
			.pipe(this.mapData(([tribes]) => tribes));
		this.highlightedMinions$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.highlightedMinions)
			.pipe(this.mapData(([tribes]) => tribes));
		this.currentTurn$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.currentGame?.currentTurn)
			.pipe(this.mapData(([currentTurn]) => currentTurn));
		this.showTribesHighlight$ = this.store
			.listenBattlegrounds$(([main, prefs]) => prefs.bgsShowTribesHighlight)
			.pipe(this.mapData(([info]) => info));
		this.showMinionsList$ = this.store
			.listenBattlegrounds$(([main, prefs]) => prefs.bgsEnableMinionListOverlay)
			.pipe(this.mapData(([info]) => info));
		this.showTurnNumber$ = this.store
			.listenBattlegrounds$(([main, prefs]) => prefs.bgsEnableTurnNumbertOverlay)
			.pipe(this.mapData(([info]) => info));
		this.prefSubscription = this.store
			.listenBattlegrounds$(([main, prefs]) => prefs.bgsEnableMinionListMouseOver)
			.pipe(
				distinctUntilChanged(),
				tap((info) => cdLog('emitting prefSubscription in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			)
			.subscribe(([info]) => (this.enableMouseOver = info));
		this.store
			.listen$(([main, nav, prefs]) => prefs.bgsMinionsListScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((scale) => {
				// this.el.nativeElement.style.setProperty('--bgs-banned-tribe-scale', scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.prefSubscription?.unsubscribe();
	}

	trackByFn(index: number, tavernTier: Tier) {
		return tavernTier?.tavernTier;
	}

	onTavernClick(tavernTier: Tier) {
		this.displayedTier = tavernTier;
		if (this.isLocked(tavernTier)) {
			this.lockedTier = undefined;
			this.displayedTier = undefined;
		} else {
			this.lockedTier = tavernTier;
			this.displayedTier = undefined;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseOver(tavernTier: Tier) {
		if (this.lockedTier || !this.enableMouseOver) {
			return;
		}

		this.displayedTier = tavernTier;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseLeave() {
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

	private buildTiers(cardsInGame: readonly ReferenceCard[]): readonly Tier[] {
		if (!cardsInGame?.length) {
			return [];
		}

		const groupedByTier: { [tierLevel: string]: readonly ReferenceCard[] } = groupByFunction(
			(card: ReferenceCard) => '' + card.techLevel,
		)(cardsInGame);
		return Object.keys(groupedByTier).map((tierLevel) => ({
			tavernTier: parseInt(tierLevel),
			cards: groupedByTier[tierLevel],
		}));
	}
}

interface Tier {
	tavernTier: number;
	cards: readonly ReferenceCard[];
}
