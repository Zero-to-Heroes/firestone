import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	ViewRef,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { MemoryVisitor, SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter, startWith } from 'rxjs/operators';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleTeam,
} from '../../../models/mercenaries/mercenaries-battle-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { MercenariesMemoryCacheService } from '../../../services/mercenaries/mercenaries-memory-cache.service';
import {
	MercenariesReferenceData,
	MercenariesReferenceDataService,
} from '../../../services/mercenaries/mercenaries-reference-data.service';
import { getHeroRole } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { buildMercenariesTasksList } from '../../../services/ui-store/mercenaries-ui-helper';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { Task } from '../../mercenaries/overlay/teams/mercenaries-team-root..component';

@Component({
	selector: 'mercs-quests-widget',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/overlays/quests/quests-widget-view.component.scss',
		'../../../../css/component/overlays/quests/mercs-quests-widget.component.scss',
	],
	template: `
		<!-- We need to have interactivity with the list for the "create" button, so the 
		mouse detection is at the parent's level -->
		<div class="quests-widget" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
			<div
				class="widget-icon"
				*ngIf="showQuests$ | async"
				(click)="onMouseLeave()"
				(mousedown)="onMouseLeave()"
				(mouseup)="onMouseLeave()"
			>
				<img src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mercs_quests_icon.png" />
			</div>
			<mercs-tasks-list
				class="task-list"
				[ngClass]="{
					visible: showTaskList$ | async,
					right: showRight$ | async,
					bottom: showBottom$ | async
				}"
				[tasks]="tasks$ | async"
			></mercs-tasks-list>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsQuestsWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	tasks$: Observable<readonly Task[]>;
	showQuests$: Observable<boolean>;
	showRight$: Observable<boolean>;
	showBottom$: Observable<boolean>;
	showTaskList$: Observable<boolean>;

	private showWidget$$ = new BehaviorSubject<boolean>(false);
	private showRight$$ = new BehaviorSubject<boolean>(false);
	private showBottom$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly mercenariesCollection: MercenariesMemoryCacheService,
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
		private readonly scene: SceneService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mercenariesCollection, this.mercenariesReferenceData, this.scene, this.prefs);

		const team$ = this.store
			.listenMercenaries$(([battleState, prefs]) => battleState)
			.pipe(
				filter(([battleState]) => !!battleState),
				this.mapData(([battleState]) =>
					battleState.playerTeam.update({
						...battleState.playerTeam,
						mercenaries:
							battleState.playerTeam.mercenaries?.filter((merc) => !merc.isDead || !merc.creatorCardId) ??
							[],
					}),
				),
				startWith(null),
			);
		const oocTeam$ = combineLatest([
			this.scene.currentScene$$,
			this.mercenariesReferenceData.referenceData$$,
			this.mercenariesCollection.memoryMapInfo$$,
		]).pipe(
			filter(([currentScene, referenceData, mapInfo]) => !!referenceData?.mercenaryLevels),
			this.mapData(([currentScene, referenceData, refMapInfo]) => {
				const mapInfo = currentScene === SceneMode.LETTUCE_MAP ? refMapInfo?.Map : null;
				return MercenariesBattleTeam.create({
					mercenaries:
						mapInfo?.PlayerTeam?.map((playerTeamInfo) => {
							const refMerc = referenceData.mercenaries.find((merc) => merc.id === playerTeamInfo.Id);
							if (!refMerc) {
								console.warn('could not find reference merc', playerTeamInfo.Id);
								return null;
							}
							const mercCard = this.allCards.getCardFromDbfId(refMerc.cardDbfId);
							return BattleMercenary.create({
								mercenaryId: refMerc?.id,
								cardId: mercCard.id,
								role: getHeroRole(mercCard.mercenaryRole),
								level: playerTeamInfo.Level,
								isDead: (mapInfo.DeadMercIds ?? []).includes(playerTeamInfo.Id),
								abilities: [
									...playerTeamInfo.Abilities.map((ability) => {
										return BattleAbility.create({
											cardId: ability.CardId,
										});
									}),
									...(playerTeamInfo.Treasures ?? []).map((treasure) => {
										const refTreasure = referenceData.mercenaryTreasures?.find(
											(t) => t.id === treasure.TreasureId,
										);
										return BattleAbility.create({
											cardId: this.allCards.getCardFromDbfId(refTreasure?.cardId).id,
											isTreasure: true,
										});
									}),
								],
								equipment: (playerTeamInfo.Equipments ?? [])
									.filter((equip) => equip.Equipped)
									.map((equip) => {
										const refEquipment = refMerc.equipments?.find(
											(e) => e.equipmentId === equip.Id,
										);
										return BattleEquipment.create({
											cardId: this.allCards.getCardFromDbfId(refEquipment?.cardDbfId)?.id,
											level: equip.Tier,
										});
									})
									.pop(),
							});
						}) ?? [],
				});
			}),
			startWith(null),
		);

		// We use separate observables to reduce the quantity of equality checking we have to do
		const referenceData$: Observable<[MercenariesReferenceData, readonly MemoryVisitor[]]> = combineLatest([
			this.mercenariesReferenceData.referenceData$$,
			this.mercenariesCollection.memoryCollectionInfo$$,
		]).pipe(
			filter(([referenceData, collectionInfo]) => !!referenceData && !!collectionInfo?.Visitors?.length),
			this.mapData(([referenceData, collectionInfo]) => [referenceData, collectionInfo?.Visitors ?? []]),
		);
		const activeMercIds$ = combineLatest([team$, oocTeam$]).pipe(
			this.mapData(([team, oocTeam]) =>
				[...(team?.mercenaries ?? []), ...(oocTeam?.mercenaries ?? [])].map((m) => m.mercenaryId),
			),
		);
		this.tasks$ = combineLatest([referenceData$, activeMercIds$]).pipe(
			filter(([[referenceData, visitors], activeMercIds]) => !!referenceData && !!visitors?.length),
			this.mapData(
				([[referenceData, visitors], activeMercIds]) => {
					const result = buildMercenariesTasksList(
						referenceData,
						visitors,
						this.allCards,
						this.i18n,
						activeMercIds,
					);
					return result;
				},
				// Every time we run here, we should have new data, so don't recheck equality
				(a, b) => false,
			),
		);
		this.showQuests$ = combineLatest([
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						showQuests: prefs.mercsShowQuestsWidget,
						showWhenEmpty: prefs.showQuestsWidgetWhenEmpty,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.tasks$,
		]).pipe(
			this.mapData(([{ showQuests, showWhenEmpty }, quests]) => {
				return showQuests && (!!quests?.length || showWhenEmpty);
			}),
		);
		this.showTaskList$ = this.showWidget$$.asObservable().pipe(this.mapData((info) => info));
		this.showRight$ = this.showRight$$.asObservable().pipe(this.mapData((info) => info));
		this.showBottom$ = this.showBottom$$.asObservable().pipe(this.mapData((info) => info));

		// Because we await
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseEnter() {
		this.showWidget$$.next(true);
		const rect = this.el.nativeElement.getBoundingClientRect();
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		this.showRight$$.next(rect.x < windowWidth / 2);
		this.showBottom$$.next(rect.y < windowHeight / 2);
	}

	onMouseLeave() {
		this.showWidget$$.next(false);
	}
}
