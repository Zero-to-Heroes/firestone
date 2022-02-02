import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionTwitchComponent } from '@components/decktracker/overlay/twitch/abstract-subscription-twitch.component';
import { TwitchPreferencesService } from '@components/decktracker/overlay/twitch/twitch-preferences.service';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { getAllCardsInGame } from '@services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '@services/cards-facade.service';
import { groupByFunction } from '@services/utils';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
	selector: 'battlegrounds-minions-tiers-twitch',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
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
	extends AbstractSubscriptionTwitchComponent
	implements AfterContentInit, OnDestroy {
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
		private readonly allCards: CardsFacadeService,
		private readonly prefs: TwitchPreferencesService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.tiers$ = this._availableRaces.asObservable().pipe(
			this.mapData((races) => {
				const cardsInGame = getAllCardsInGame(races, this.allCards);
				console.log('cardsInGame', cardsInGame, this.allCards);
				const result = this.buildTiers(cardsInGame);
				console.log('result', result);
				return result;
			}),
		);
		this.currentTurn$ = this._currentTurn.asObservable().pipe(
			tap((info) => console.debug('currentTurn', info)),
			this.mapData((currentTurn) => currentTurn),
		);
		this.showGoldenCards$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.showMinionsListGoldenCards),
		);
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
		}));
	}
}

interface Tier {
	tavernTier: number;
	cards: readonly ReferenceCard[];
}
