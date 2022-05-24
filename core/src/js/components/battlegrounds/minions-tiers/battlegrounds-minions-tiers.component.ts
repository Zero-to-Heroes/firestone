import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	Renderer2,
	ViewEncapsulation,
} from '@angular/core';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Observable } from 'rxjs';
import { getAllCardsInGame } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
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
		<div class="battlegrounds-minions-tiers scalable">
			<battlegrounds-minions-tiers-view
				[tiers]="tiers$ | async"
				[currentTurn]="currentTurn$ | async"
				[tavernTier]="tavernTier$ | async"
				[showMinionsList]="showMinionsList$ | async"
				[showTribesHighlight]="showTribesHighlight$ | async"
				[highlightedMinions]="highlightedMinions$ | async"
				[highlightedTribes]="highlightedTribes$ | async"
				[enableMouseOver]="enableMouseOver$ | async"
				[showGoldenCards]="showGoldenCards$ | async"
				[showTurnNumber]="showTurnNumber$ | async"
			></battlegrounds-minions-tiers-view>
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
	tavernTier$: Observable<number>;
	showTribesHighlight$: Observable<boolean>;
	showMinionsList$: Observable<boolean>;
	showTurnNumber$: Observable<boolean>;
	enableMouseOver$: Observable<boolean>;
	showGoldenCards$: Observable<boolean>;

	constructor(
		private readonly init_DebugService: DebugService,
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
					const result = this.buildTiers(cardsInGame);
					return result;
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
		this.tavernTier$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.currentGame?.getMainPlayer()?.getCurrentTavernTier())
			.pipe(this.mapData(([tavernTier]) => tavernTier));
		this.showTribesHighlight$ = this.listenForBasicPref$((prefs) => prefs.bgsShowTribesHighlight);
		this.showMinionsList$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableMinionListOverlay);
		this.showTurnNumber$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableTurnNumbertOverlay);
		this.enableMouseOver$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableMinionListMouseOver);
		this.showGoldenCards$ = this.listenForBasicPref$((prefs) => prefs.bgsMinionListShowGoldenCard);
		this.listenForBasicPref$((prefs) => prefs.bgsMinionsListScale).subscribe((scale) => {
			// this.el.nativeElement.style.setProperty('--bgs-banned-tribe-scale', scale / 100);
			const element = this.el.nativeElement.querySelector('.scalable');
			this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
		});
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
