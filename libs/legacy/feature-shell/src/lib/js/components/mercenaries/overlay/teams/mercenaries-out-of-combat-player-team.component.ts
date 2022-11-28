import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../../directives/card-tooltip-position.type';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleTeam,
} from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { getHeroRole } from '../../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { buildMercenariesTasksList } from '../../../../services/ui-store/mercenaries-ui-helper';
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
		[tooltipPosition]="tooltipPosition"
	></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOutOfCombatPlayerTeamComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	@Input() tooltipPosition: CardTooltipPositionType = 'left';

	showTasksExtractor = (prefs: Preferences) => prefs.mercenariesShowTaskButton;
	scaleExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayScale;

	team$: Observable<MercenariesBattleTeam>;
	tasks$: Observable<readonly Task[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.team$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.currentScene,
				([main, nav, prefs]) => main.mercenaries?.getReferenceData(),
				([main, nav, prefs]) => main.mercenaries?.mapInfo,
			),
		).pipe(
			filter(([[currentScene, referenceData, mapInfo]]) => !!referenceData),
			this.mapData(([[currentScene, referenceData, refMapInfo]]) => {
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
										const refTier = refEquipment.tiers.find((t) => t.tier === equip.Tier);
										return BattleEquipment.create({
											cardId: this.allCards.getCard(refTier?.cardDbfId)?.id,
											level: equip.Tier,
										});
									})
									.pop(),
							});
						}) ?? [],
				});
			}),
		);
		this.tasks$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.mercenaries.getReferenceData(),
				([main, nav, prefs]) => main.mercenaries.collectionInfo?.Visitors,
			),
			this.team$,
		).pipe(
			filter(([[referenceData, visitors], team]) => !!referenceData && !!visitors?.length),
			this.mapData(([[referenceData, visitors], team]) =>
				buildMercenariesTasksList(
					referenceData,
					visitors,
					this.allCards,
					this.i18n,
					team?.mercenaries?.map((m) => m.mercenaryId),
				),
			),
		);
	}
}
