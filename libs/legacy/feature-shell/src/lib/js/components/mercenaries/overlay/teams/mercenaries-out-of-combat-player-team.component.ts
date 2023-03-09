import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MercenariesMapType, SceneMode } from '@firestone-hs/reference-data';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleTeam,
} from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { getHeroRole } from '../../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'mercenaries-out-of-combat-player-team',
	styleUrls: [],
	template: ` <mercenaries-team-root
		[team]="team$ | async"
		[side]="'out-of-combat-player'"
		[scaleExtractor]="scaleExtractor"
		[tooltipPosition]="tooltipPosition"
	></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOutOfCombatPlayerTeamComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	@Input() tooltipPosition: CardTooltipPositionType = 'left';

	scaleExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayScale;

	team$: Observable<MercenariesBattleTeam>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
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
				const result = MercenariesBattleTeam.create({
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
										const mythicModifier =
											refMapInfo.Map.MapType === MercenariesMapType.TYPE_BOSS_RUSH
												? ability.MythicModifier ?? 0
												: 0;
										return BattleAbility.create({
											cardId: ability.CardId,
											nameData1: ability.Tier + mythicModifier,
										});
									}),
									...(playerTeamInfo.Treasures ?? []).map((treasure) => {
										const refTreasure = referenceData.mercenaryTreasures?.find(
											(t) => t.id === treasure.TreasureId,
										);
										return BattleAbility.create({
											cardId: this.allCards.getCard(refTreasure?.cardId).id,
											isTreasure: true,
											nameData1: (treasure.Scalar ?? 0) + 1,
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
										const mythicModifier =
											refMapInfo.Map.MapType === MercenariesMapType.TYPE_BOSS_RUSH
												? equip.MythicModifier ?? 0
												: 0;
										return BattleEquipment.create({
											cardId: this.allCards.getCard(refTier?.cardDbfId)?.id,
											level: equip.Tier,
											nameData1: equip.Tier + mythicModifier,
										});
									})
									.pop(),
							});
						}) ?? [],
				});
				console.debug('ooc team', result, currentScene, referenceData, refMapInfo);
				return result;
			}),
		);
	}
}
