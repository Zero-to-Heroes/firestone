/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { CardIds, CardType, GameTag, getEffectiveTribes, ReferenceCard } from '@firestone-hs/reference-data';
import { Entity, EntityAsJS } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

const SPECIAL_STATUS_TOKENS = [CardIds.AvatarOfNzoth_FishOfNzothToken, CardIds.Menagerist_AmalgamToken];
@Component({
	standalone: false,
	selector: 'bgs-simulator-minion-selection',
	styleUrls: [`./bgs-selection-popup.scss`, `./bgs-simulator-minion-selection.component.scss`],
	template: `
		<div class="container">
			<div class="content-container" cdkTrapFocus cdkTrapFocusAutoCapture>
				<button class="i-30 close-button" tabindex="-1" (mousedown)="close()">
					<svg class="svg-icon-fill">
						<use
							xmlns:xlink="https://www.w3.org/1999/xlink"
							xlink:href="assets/svg/sprite.svg#window-control_close"
						></use>
					</svg>
				</button>

				<div class="title" [fsTranslate]="'battlegrounds.sim.update-minion-title'"></div>
				<div class="current-hero">
					<div *ngIf="card" class="hero-portrait-frame">
						<bgs-card-tooltip [config]="card" [visible]="true"></bgs-card-tooltip>
					</div>
					<div *ngIf="!card" class="hero-portrait-frame empty">
						<div class="empty-hero" inlineSVG="assets/svg/bg_empty_minion_full.svg"></div>
					</div>
					<div class="abilities" [ngClass]="{ disabled: !card }">
						<div class="stats">
							<fs-numeric-input-with-arrows
								class="input attack"
								[label]="'global.hs-terms.attack' | fsTranslate"
								[value]="attack"
								(fsModelUpdate)="onAttackChanged($event)"
							>
							</fs-numeric-input-with-arrows>
							<fs-numeric-input-with-arrows
								class="input health"
								[label]="'global.hs-terms.health' | fsTranslate"
								[value]="health"
								[minValue]="1"
								(fsModelUpdate)="onHealthChanged($event)"
							>
							</fs-numeric-input-with-arrows>
						</div>
						<div class="attributes">
							<checkbox
								[label]="'global.hs-terms.golden' | fsTranslate"
								[value]="premium"
								(valueChanged)="onPremiumChanged($event)"
							></checkbox>
							<checkbox
								[label]="'global.hs-terms.divine-shield' | fsTranslate"
								[value]="divineShield"
								(valueChanged)="onDivineShieldChanged($event)"
							></checkbox>
							<checkbox
								[label]="'global.hs-terms.venomous' | fsTranslate"
								[value]="venomous"
								(valueChanged)="onVenomousChanged($event)"
							></checkbox>
							<checkbox
								[label]="'global.hs-terms.poisonous' | fsTranslate"
								[value]="poisonous"
								(valueChanged)="onPoisonousChanged($event)"
							></checkbox>
							<checkbox
								[label]="'global.hs-terms.reborn' | fsTranslate"
								[value]="reborn"
								(valueChanged)="onRebornChanged($event)"
							></checkbox>
							<checkbox
								[label]="'global.hs-terms.taunt' | fsTranslate"
								[value]="taunt"
								(valueChanged)="onTauntChanged($event)"
							></checkbox>
							<checkbox
								[label]="'global.hs-terms.stealth' | fsTranslate"
								[value]="stealth"
								(valueChanged)="onStealthChanged($event)"
							></checkbox>
							<checkbox
								[label]="'global.hs-terms.windfury' | fsTranslate"
								[value]="windfury"
								(valueChanged)="onWindfuryChanged($event)"
							></checkbox>
							<checkbox
								[label]="'battlegrounds.sim.summon-mechs' | fsTranslate"
								[value]="summonMechs"
								(valueChanged)="onSummonMechsChanged($event)"
								[helpTooltip]="'battlegrounds.sim.summon-mechs-tooltip' | fsTranslate"
							></checkbox>
							<checkbox
								[label]="'battlegrounds.sim.summon-plants' | fsTranslate"
								[value]="summonPlants"
								(valueChanged)="onSummonPlantsChanged($event)"
								[helpTooltip]="'battlegrounds.sim.summon-plants-tooltip' | fsTranslate"
							></checkbox>
							<fs-numeric-input-with-arrows
								class="input sneed"
								[label]="'battlegrounds.sim.sneed-deathrattle' | fsTranslate"
								[helpTooltip]="'battlegrounds.sim.sneed-deathrattle-tooltip' | fsTranslate"
								[value]="sneeds"
								[minValue]="0"
								(fsModelUpdate)="onSneedChanged($event)"
							>
							</fs-numeric-input-with-arrows>
						</div>
					</div>
				</div>
				<div class="hero-selection">
					<div class="search">
						<div class="header" [fsTranslate]="'battlegrounds.sim.minions-selection-title'"></div>
						<bgs-sim-minion-tribe-filter class="filter tribe-filter"></bgs-sim-minion-tribe-filter>
						<bgs-sim-minion-tier-filter class="filter tier-filter"></bgs-sim-minion-tier-filter>
						<label class="search-label" [ngClass]="{ 'search-active': !!searchString.value?.length }">
							<div class="icon" inlineSVG="assets/svg/search.svg"></div>
							<input
								[formControl]="searchForm"
								(mousedown)="preventDrag($event)"
								tabindex="0"
								cdkFocusInitial
								[autofocus]="true"
								[placeholder]="'battlegrounds.sim.search-minion-placeholder' | fsTranslate"
							/>
						</label>
						<preference-toggle
							class="show-buddies-button"
							field="bgsShowBuddiesInSimulatorSelection"
							[label]="'battlegrounds.sim.show-buddies-button-title' | fsTranslate"
						></preference-toggle>
					</div>
					<div class="heroes" scrollable>
						<div
							*ngFor="let minion of allMinions; trackBy: trackByMinion"
							class="hero-portrait-frame"
							[ngClass]="{ selected: minion.id === cardId }"
							(click)="selectMinion(minion)"
							[cardTooltip]="minion.id"
							[cardTooltipBgs]="true"
						>
							<img class="icon" [src]="minion.icon" />
						</div>
					</div>
				</div>
				<div class="controls">
					<div
						class="button"
						(click)="validate()"
						[ngClass]="{ disabled: !card }"
						[fsTranslate]="'battlegrounds.sim.select-button'"
					></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorMinionSelectionComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	@Input() closeHandler: () => void;
	@Input() applyHandler: (newEntity: BoardEntity) => void;
	@Input() entityId: number;
	@Input() set currentMinion(value: BoardEntity | null) {
		this._entity = value;
		this.updateValues();
	}

	searchForm = new FormControl();

	card: Entity | null;

	// allMinions$: Observable<readonly Minion[]>;
	allMinions: readonly Minion[] = [];

	cardId: string;
	premium: boolean;
	divineShield: boolean;
	venomous: boolean;
	poisonous: boolean;
	reborn: boolean;
	taunt: boolean;
	attack: number;
	health: number;
	stealth: boolean;
	windfury: boolean;
	summonMechs: boolean;
	summonPlants: boolean;
	sneeds = 0;
	scriptDataNum1: number;
	scriptDataNum2: number;

	searchString = new BehaviorSubject<string | null>(null);

	private ref: ReferenceCard;
	private _entity: BoardEntity | null;
	private subscription: Subscription;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		this.cdr.detach();
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		const showBuddies$: Observable<boolean> = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowBuddiesInSimulatorSelection),
		);
		combineLatest([
			this.searchString.asObservable(),
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					tribeFilter: prefs.bgsActiveSimulatorMinionTribeFilter,
					tierFilter: prefs.bgsActiveSimulatorMinionTierFilter,
				})),
			),
			showBuddies$,
		])
			.pipe(
				debounceTime(200),
				this.mapData(([searchString, { tribeFilter, tierFilter }, showBuddies]) => {
					const result = this.allCards
						.getCards()
						.filter((card) => card.isBaconPool || SPECIAL_STATUS_TOKENS.includes(card.id as CardIds))
						.filter((card) => card.type?.toUpperCase() === CardType[CardType.MINION])
						// .filter((card) => card.battlegroundsPremiumDbfId || TOKEN_CARD_IDS.includes(card.id as CardIds))
						.filter((card) => !EXCLUDED_CARD_IDS.includes(card.id as CardIds))
						.filter((card) =>
							showBuddies ? true : !card.mechanics?.includes(GameTag[GameTag.BACON_BUDDY]),
						)
						.filter(
							(card) =>
								!tribeFilter ||
								tribeFilter === 'all' ||
								getEffectiveTribes(card, true).some((r) => r.toLowerCase() === tribeFilter),
						)
						.filter((card) => !tierFilter || tierFilter === 'all' || card.techLevel === +tierFilter)
						.filter(
							(card) =>
								!searchString?.length ||
								card.name.toLowerCase().includes(searchString.toLowerCase()) ||
								card.text?.toLowerCase().includes(searchString.toLowerCase()) ||
								card.mechanics?.some((m) => m.toLowerCase().includes(searchString.toLowerCase())),
						)
						.map((card) => ({
							id: card.id,
							icon: this.i18n.getCardImage(card.id, { isBgs: true })!,
							name: card.name,
							tier: card.techLevel ?? 0,
						}))
						.sort(sortByProperties((minion: Minion) => [minion.tier, minion.name]));
					return result;
				}),
			)
			.subscribe((minions) => {
				this.allMinions = [];
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
				setTimeout(() => {
					this.allMinions = minions;
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				});
			});
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroyed$))
			.subscribe((data) => {
				this.searchString.next(data);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});

		// To bind the async pipes
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		super.ngOnDestroy();
		this.subscription?.unsubscribe();
	}

	@HostListener('document:keyup', ['$event'])
	handleKeyboardControl(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.ctrlKey || event.shiftKey || event.altKey)) {
			this.validate();
		} else if (event.key === 'Enter' && !!this.allMinions?.length) {
			this.selectMinion(this.allMinions[0]);
		} else if (event.key === 'Escape') {
			this.close();
		}
	}

	onPremiumChanged(value: boolean) {
		this.premium = value;
		if (value) {
			this.cardId = this.ref.battlegroundsNormalDbfId
				? this.ref.id
				: // Default when the card doesn't have a golden version
				  this.allCards.getCard(this.ref.battlegroundsPremiumDbfId!).id ?? this.cardId;
		} else {
			this.cardId = this.ref.battlegroundsPremiumDbfId
				? this.ref.id
				: this.allCards.getCard(this.ref.battlegroundsNormalDbfId!).id ?? this.cardId;
		}
		// Check if the user changed the stats of the base card. If not, we just use the stats
		// from the premium card instead
		const areStatsUpdated = this.attack !== this.ref.attack || this.health !== this.ref.health;
		this.ref = this.allCards.getCard(this.cardId);
		if (!areStatsUpdated) {
			this.attack = this.ref.attack ?? 0;
			this.health = this.ref.health ?? 0;
		}
		// Don't change the existing customization
		this.updateCard();
	}

	onDivineShieldChanged(value: boolean) {
		this.divineShield = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onWindfuryChanged(value: boolean) {
		this.windfury = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onStealthChanged(value: boolean) {
		this.stealth = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSummonMechsChanged(value: boolean) {
		this.summonMechs = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSummonPlantsChanged(value: boolean) {
		this.summonPlants = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onVenomousChanged(value: boolean) {
		this.venomous = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onPoisonousChanged(value: boolean) {
		this.poisonous = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onRebornChanged(value: boolean) {
		this.reborn = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTauntChanged(value: boolean) {
		this.taunt = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onAttackChanged(value: number) {
		this.attack = value;
		this.updateCard();
	}

	onHealthChanged(value: number) {
		this.health = value;
		this.updateCard();
	}

	onSneedChanged(value: number) {
		this.sneeds = value;
		this.updateCard();
	}

	onDataScript1Changed(value: number) {
		this.scriptDataNum1 = value;
		this.updateCard();
	}

	onDataScript2Changed(value: number) {
		this.scriptDataNum2 = value;
		this.updateCard();
	}

	selectMinion(minion: Minion) {
		this.cardId = minion.id;
		this.ref = this.allCards.getCard(this.cardId);
		this.premium = !!this.ref.premium;
		this.attack = this.ref.attack ?? 0;
		this.health = this.ref.health ?? 0;
		this.divineShield = this.ref.mechanics?.includes(GameTag[GameTag.DIVINE_SHIELD]);
		this.venomous = this.ref.mechanics?.includes(GameTag[GameTag.VENOMOUS]);
		this.poisonous = this.ref.mechanics?.includes(GameTag[GameTag.POISONOUS]);
		this.reborn = this.ref.mechanics?.includes(GameTag[GameTag.REBORN]);
		this.taunt = this.ref.mechanics?.includes(GameTag[GameTag.TAUNT]);
		this.stealth = this.ref.mechanics?.includes(GameTag[GameTag.STEALTH]);
		this.windfury =
			this.ref.mechanics?.includes(GameTag[GameTag.WINDFURY]) ||
			this.ref.mechanics?.includes(GameTag[GameTag.MEGA_WINDFURY]);
		// The cards that summon 1/1s as part of their normal abilities are already handled in the sim
		this.updateCard();
	}

	close() {
		this.closeHandler();
	}

	validate() {
		this.applyHandler({
			entityId: this.entityId,
			cardId: this.cardId,
			attack: this.attack,
			health: this.health,
			divineShield: this.divineShield,
			venomous: this.venomous,
			poisonous: this.poisonous,
			scriptDataNum1: this.scriptDataNum1,
			scriptDataNum2: this.scriptDataNum2,
			taunt: this.taunt,
			reborn: this.reborn,
			stealth: this.stealth,
			windfury: this.windfury,
			enchantments: [
				this.summonMechs
					? { cardId: CardIds.ReplicatingMenace_ReplicatingMenaceEnchantment_BG_BOT_312e }
					: null,
				this.summonPlants ? { cardId: CardIds.LivingSpores_LivingSporesEnchantment } : null,
				...(this.sneeds > 0
					? [...Array(this.sneeds).keys()].map((i) => ({
							cardId: CardIds.SneedsReplicator_ReplicateEnchantment,
					  }))
					: []),
				...(this._entity?.enchantments ?? []).filter((e) =>
					this.summonMechs
						? e
						: e.cardId !== CardIds.ReplicatingMenace_ReplicatingMenaceEnchantment_BG_BOT_312e,
				),
			].filter((e) => !!e),
		} as BoardEntity);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	trackByMinion(index: number, item: Minion) {
		return item.id;
	}

	private async updateValues() {
		if (!this._entity) {
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}

		this.cardId = this._entity.cardId;
		this.ref = this.allCards.getCard(this.cardId);
		this.premium = !!this.ref.premium;
		this.attack = this._entity.attack;
		this.health = this._entity.health;
		this.divineShield = !!this._entity.divineShield;
		this.venomous = !!this._entity.venomous;
		this.poisonous = !!this._entity.poisonous;
		this.scriptDataNum1 = this._entity.scriptDataNum1 ?? 0;
		this.scriptDataNum2 = this._entity.scriptDataNum2 ?? 0;
		this.reborn = !!this._entity.reborn;
		this.taunt = !!this._entity.taunt;
		this.stealth = !!this._entity.stealth;
		this.windfury = !!this._entity.windfury;
		this.summonMechs = !!this._entity.enchantments
			?.map((e) => e.cardId)
			.includes(CardIds.ReplicatingMenace_ReplicatingMenaceEnchantment_BG_BOT_312e);
		this.summonPlants = !!this._entity.enchantments
			?.map((e) => e.cardId)
			.includes(CardIds.LivingSpores_LivingSporesEnchantment);
		this.sneeds =
			this._entity.enchantments
				?.map((e) => e.cardId)
				.filter((cardId) => cardId === CardIds.SneedsReplicator_ReplicateEnchantment).length ?? 0;
		this.updateCard();
	}

	private updateCard() {
		this.card = !this.cardId?.length
			? null
			: Entity.fromJS({
					cardID: this.cardId,
					tags: {
						[GameTag[GameTag.ATK]]: this.attack ?? 0,
						[GameTag[GameTag.HEALTH]]: this.health ?? 0,
						[GameTag[GameTag.PREMIUM]]: this.premium ? 1 : 0,
					},
			  } as EntityAsJS);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface Minion {
	id: string;
	icon: string;
	name: string;
	tier: number;
}

const TOKEN_CARD_IDS = [CardIds.AvatarOfNzoth_FishOfNzothToken, CardIds.Menagerist_AmalgamToken];

const EXCLUDED_CARD_IDS = [
	CardIds.CattlecarpOfNzoth_TB_BaconShop_HP_105t_SKIN_A,
	CardIds.CattlecarpOfNzoth_TB_BaconShop_HP_105t_SKIN_A_G,
];
