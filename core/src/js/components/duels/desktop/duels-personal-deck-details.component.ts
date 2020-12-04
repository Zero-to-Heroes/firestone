import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import {
	DuelsDeckSummary,
	HeroPowerDuelsDeckStatInfo,
	LootDuelsDeckStatInfo,
	SignatureTreasureDuelsDeckStatInfo,
	TreasureDuelsDeckStatInfo,
} from '../../../models/duels/duels-personal-deck';
import { DuelsState } from '../../../models/duels/duels-state';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-personal-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-personal-deck-details.component.scss`,
	],
	template: `
		<div class="duels-personal-deck-details">
			<div class="deck-list-container starting">
				<copy-deckstring class="copy-deckcode" [deckstring]="decklist" title="Copy deck code">
				</copy-deckstring>
				<deck-list class="deck-list" [deckstring]="decklist"></deck-list>
			</div>
			<div class="stats" scrollable>
				<div class="section hero-powers">
					<div class="title">Hero Powers</div>
					<ul class="list powers">
						<li *ngFor="let power of heroPowers; trackBy: trackById" class="element">
							<img class="icon" [src]="power.icon" [cardTooltip]="power.heroPowerCardId" />
							<div class="stat pick-rate">
								<div class="header">Pick rate</div>
								<div class="value">{{ power.pickRate.toFixed(1) }}%</div>
							</div>
							<div class="stat avg-wins">
								<div class="header">Avg. wins</div>
								<div class="value">{{ power.avgWins.toFixed(1) }}</div>
							</div>
						</li>
					</ul>
				</div>
				<div class="section signature-treasure">
					<div class="title">Signature Treasures</div>
					<ul class="list signature-treasures">
						<li *ngFor="let treasure of signatureTreasures; trackBy: trackById" class="element">
							<img class="icon" [src]="treasure.icon" [cardTooltip]="treasure.signatureTreasureCardId" />
							<div class="stat pick-rate">
								<div class="header">Pick rate</div>
								<div class="value">{{ treasure.pickRate.toFixed(1) }}%</div>
							</div>
							<div class="stat avg-wins">
								<div class="header">Avg. wins</div>
								<div class="value">{{ treasure.avgWins.toFixed(1) }}</div>
							</div>
						</li>
					</ul>
				</div>
				<div class="section treasure">
					<div class="title">Treasures</div>
					<ul class="list treasures">
						<li *ngFor="let treasure of treasures; trackBy: trackById" class="element">
							<img class="icon" [src]="treasure.icon" [cardTooltip]="treasure.cardId" />
							<div class="stat pick-rate">
								<div class="header">Pick rate</div>
								<div class="value">{{ treasure.pickRate.toFixed(1) }}%</div>
							</div>
							<div class="stat avg-wins">
								<div class="header">Avg. wins</div>
								<div class="value">{{ treasure.avgWins.toFixed(1) }}</div>
							</div>
						</li>
					</ul>
				</div>
				<div class="section loot">
					<div class="title">Cards picked</div>
					<ul class="list loot">
						<li *ngFor="let loot of loots; trackBy: trackById" class="element">
							<img class="icon" [src]="loot.icon" [cardTooltip]="loot.cardId" />
							<div class="stat pick-rate">
								<div class="header">Pick rate</div>
								<div class="value">{{ loot.pickRate.toFixed(1) }}%</div>
							</div>
							<div class="stat avg-wins">
								<div class="header">Avg. wins</div>
								<div class="value">{{ loot.avgWins.toFixed(1) }}</div>
							</div>
						</li>
					</ul>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDeckDetailsComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		this._state = value;
		// If I don't do this angular protests with "cannot read property 'destroyed' of null when changing views"
		this.heroPowers = [];
		this.signatureTreasures = [];
		this.treasures = [];
		this.loots = [];
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => this.updateValues());
	}

	@Input() set navigation(value: NavigationDuels) {
		this._navigation = value;
		this.heroPowers = [];
		this.signatureTreasures = [];
		this.treasures = [];
		this.loots = [];
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => this.updateValues());
	}

	deck: DuelsDeckSummary;
	decklist: string;
	heroPowers: readonly HeroPower[];
	signatureTreasures: readonly SignatureTreasure[];
	treasures: readonly Treasure[];
	loots: readonly Loot[];

	private _state: DuelsState;
	private _navigation: NavigationDuels;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	trackById(index, item: HeroPower | SignatureTreasure | Treasure | Loot) {
		return item.id;
	}

	private updateValues() {
		if (!this._state?.playerStats?.deckStats || !this._navigation) {
			return;
		}

		this.deck = this._state.playerStats.personalDeckStats.find(
			deck => deck.initialDeckList === this._navigation.selectedPersonalDeckstring,
		);
		if (!this.deck) {
			return;
		}
		// console.log('setting deck', this.deck);
		this.decklist = this.deck.initialDeckList;

		this.heroPowers = this.deck.heroPowerStats.map(power => {
			return {
				...power,
				id: this.deck.initialDeckList + 'power' + power.heroPowerCardId,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${power.heroPowerCardId}.jpg`,
				pickRate:
					(100 * this.deck.runs.filter(run => run.heroPowerCardId === power.heroPowerCardId).length) /
					this.deck.runs.length,
				avgWins: power.averageWinsPerRun,
			};
		});

		this.signatureTreasures = this.deck.signatureTreasureStats.map(treasure => {
			return {
				...treasure,
				id: this.deck.initialDeckList + 'signature-treasure' + treasure.signatureTreasureCardId,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${treasure.signatureTreasureCardId}.jpg`,
				pickRate:
					(100 *
						this.deck.runs.filter(run => run.signatureTreasureCardId === treasure.signatureTreasureCardId)
							.length) /
					this.deck.runs.length,
				avgWins: treasure.averageWinsPerRun,
			};
		});

		this.treasures = this.deck.treasureStats.map(treasure => {
			const offered = this.deck.runs
				.map(run => run.steps)
				.reduce((a, b) => a.concat(b), [])
				.filter(step => (step as DuelsRunInfo).bundleType === 'treasure')
				.map(step => step as DuelsRunInfo)
				.filter(step => [step.option1, step.option2, step.option3].includes(treasure.cardId));
			const picked = offered.filter(
				step =>
					(step.chosenOptionIndex === 1 && step.option1 === treasure.cardId) ||
					(step.chosenOptionIndex === 2 && step.option2 === treasure.cardId) ||
					(step.chosenOptionIndex === 3 && step.option3 === treasure.cardId),
			);
			// console.log('offered', offered, 'picked', picked);
			return {
				...treasure,
				id: this.deck.initialDeckList + 'treasure' + treasure.cardId,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${treasure.cardId}.jpg`,
				pickRate: (100 * picked.length) / offered.length,
				avgWins: treasure.averageWinsPerRun,
			};
		});

		this.loots = this.deck.lootStats.map(loot => {
			const choices = this.deck.runs
				.map(run => run.steps)
				.reduce((a, b) => a.concat(b), [])
				.filter(step => (step as DuelsRunInfo).bundleType === 'loot')
				.map(step => step as DuelsRunInfo)
				.filter(step =>
					[...step.option1Contents, ...step.option2Contents, ...step.option3Contents].includes(loot.cardId),
				);
			const picked = choices.filter(
				step =>
					(step.chosenOptionIndex === 1 && step.option1Contents.includes(loot.cardId)) ||
					(step.chosenOptionIndex === 2 && step.option2Contents.includes(loot.cardId)) ||
					(step.chosenOptionIndex === 3 && step.option3Contents.includes(loot.cardId)),
			);
			return {
				...loot,
				id: this.deck.initialDeckList + 'loot' + loot.cardId,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${loot.cardId}.jpg`,
				pickRate: (100 * picked.length) / choices.length,
				avgWins: loot.averageWinsPerRun,
			};
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface HeroPower extends HeroPowerDuelsDeckStatInfo {
	readonly id: string;
	readonly icon: string;
	readonly pickRate: number;
	readonly avgWins: number;
}

interface SignatureTreasure extends SignatureTreasureDuelsDeckStatInfo {
	readonly id: string;
	readonly icon: string;
	readonly pickRate: number;
	readonly avgWins: number;
}

interface Treasure extends TreasureDuelsDeckStatInfo {
	readonly id: string;
	readonly icon: string;
	readonly pickRate: number;
	readonly avgWins: number;
}

interface Loot extends LootDuelsDeckStatInfo {
	readonly id: string;
	readonly icon: string;
	readonly pickRate: number;
	readonly avgWins: number;
}
