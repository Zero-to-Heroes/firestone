import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { TwitchPreferencesService } from '@components/decktracker/overlay/twitch/twitch-preferences.service';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { getAllCardsInGame, getEffectiveTribes } from '@services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '@services/cards-facade.service';
import { groupByFunction } from '@services/utils';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { Tier } from '../../../battlegrounds/minions-tiers/battlegrounds-minions-tiers-view.component';
import { AbstractSubscriptionTwitchResizableComponent } from './abstract-subscription-twitch-resizable.component';

@Component({
	selector: 'battlegrounds-minions-tiers-twitch',
	styleUrls: [
		`../../../../../css/global/cdk-overlay.scss`,
		'../../../../../css/component/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component.scss',
		'../../../../../css/component/decktracker/overlay/twitch/battlegrounds-minions-tiers-twitch.component.scss',
	],
	template: `
		<div class="root" cdkDrag (cdkDragStarted)="startDragging()" (cdkDragReleased)="stopDragging()">
			<battlegrounds-minions-tiers-view
				class="scalable"
				[tiers]="tiers$ | async"
				[currentTurn]="currentTurn$ | async"
				[showTurnNumber]="true"
				[showMinionsList]="true"
				[showTribesHighlight]="false"
				[enableMouseOver]="true"
				[showGoldenCards]="showGoldenCards$ | async"
			></battlegrounds-minions-tiers-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsTiersTwitchOverlayComponent
	extends AbstractSubscriptionTwitchResizableComponent
	implements AfterContentInit, OnDestroy, AfterViewInit
{
	tiers$: Observable<readonly Tier[]>;
	currentTurn$: Observable<number>;
	showGoldenCards$: Observable<boolean>;

	_availableRaces = new BehaviorSubject<readonly Race[]>([]);
	_currentTurn = new BehaviorSubject<number>(null);

	@Input() set availableRaces(value: readonly Race[]) {
		this._availableRaces.next(value);
	}
	@Input() set currentTurn(value: number) {
		this._currentTurn.next(value);
	}

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr, prefs, el, renderer);
	}

	ngAfterContentInit() {
		this.tiers$ = this._availableRaces.asObservable().pipe(
			this.mapData((races) => {
				const cardsInGame = getAllCardsInGame(races, this.allCards);
				const result = this.buildTiers(cardsInGame);
				return result;
			}),
		);
		this.currentTurn$ = this._currentTurn.asObservable().pipe(this.mapData((currentTurn) => currentTurn));
		this.showGoldenCards$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.showMinionsListGoldenCards),
		);
	}

	ngAfterViewInit(): void {
		super.listenForResize();
	}

	startDragging() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async stopDragging() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
			groupingFunction: (card: ReferenceCard) => getEffectiveTribes(card, false),
			type: 'standard',
		}));
	}
}
