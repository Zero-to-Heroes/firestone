import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { MemoryMercenariesMap } from '../../../../models/memory/memory-mercenaries-info';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleTeam,
} from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { MercenariesReferenceData } from '../../../../services/mercenaries/mercenaries-state-builder.service';
import { getHeroRole } from '../../../../services/mercenaries/mercenaries-utils';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { buildMercenariesTasksList } from '../../../../services/ui-store/mercenaries-ui-helper';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';
import { Task } from './mercenaries-team-root..component';

@Component({
	selector: 'mercenaries-out-of-combat-player-team',
	styleUrls: [],
	template: ` <mercenaries-team-root
		[team]="team$ | async"
		[tasks]="tasks$ | async"
		[side]="'out-of-combat-player'"
		[showTasksExtractor]="showTasksExtractor"
		[scaleExtractor]="scaleExtractor"
	></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOutOfCombatPlayerTeamComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	showTasksExtractor = (prefs: Preferences) => prefs.mercenariesShowTaskButton;
	scaleExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayScale;

	team$: Observable<MercenariesBattleTeam>;
	tasks$: Observable<readonly Task[]>;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.tasks$ = this.store
			.listen$(
				([main, nav, prefs]) => main.mercenaries.referenceData,
				([main, nav, prefs]) => main.mercenaries.collectionInfo?.Visitors,
			)
			.pipe(
				filter(([referenceData, visitors]) => !!referenceData && !!visitors?.length),
				map(([referenceData, visitors]) => buildMercenariesTasksList(referenceData, visitors, this.allCards)),
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting tasks in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.team$ = combineLatest(
			this.store.listenMercenariesOutOfCombat$(([state, prefs]) => state),
			this.store.listen$(
				([main, nav, prefs]) => main.currentScene,
				([main, nav, prefs]) => main.mercenaries?.referenceData,
				([main, nav, prefs]) => main.mercenaries?.mapInfo,
			),
		).pipe(
			debounceTime(50),
			filter(
				([[state], [currentScene, referenceData, mapInfo]]) =>
					!!referenceData && !!mapInfo?.Map?.PlayerTeam?.length,
			),
			map(
				([[state], [currentScene, referenceData, mapInfo]]) =>
					[currentScene === SceneMode.LETTUCE_MAP ? mapInfo.Map : null, referenceData] as [
						MemoryMercenariesMap,
						MercenariesReferenceData,
					],
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([mapInfo, referenceData]) =>
				MercenariesBattleTeam.create({
					mercenaries:
						mapInfo?.PlayerTeam?.map((playerTeamInfo) => {
							const refMerc = referenceData.mercenaries.find((merc) => merc.id === playerTeamInfo.Id);
							if (!refMerc) {
								console.warn('could not find reference merc', playerTeamInfo.Id);
								return null;
							}
							const mercCard = this.allCards.getCardFromDbfId(refMerc.cardDbfId);
							return BattleMercenary.create({
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
									...(playerTeamInfo.TreasureCardDbfIds ?? []).map((treasureDbfId) => {
										return BattleAbility.create({
											cardId: this.allCards.getCardFromDbfId(treasureDbfId).id,
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
				}),
			),
			filter((team) => !!team),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting team in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
	}
}
