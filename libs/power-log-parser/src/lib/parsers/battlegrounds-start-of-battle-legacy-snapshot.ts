import { BlockType, CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Action, FullEntity, Node } from '../models';
import { TagChange } from '../models/tag';
import { GameState } from '../state/game-state';
import { ParserState } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsStartOfBattleLegacySnapshot {
	private static COMPETING_BATTLE_START_HERO_POWERS: string[] = [
		CardIds.RebornRites,
		CardIds.SwattingInsects,
	];

	private static START_OF_COMBAT_HERO_POWER: string[] = [
		CardIds.RapidReanimation_ImpendingDeathEnchantment,
		CardIds.WaxWarband,
		CardIds.Ozumat_Tentacular,
		CardIds.TamsinRoame_FragrantPhylactery,
		CardIds.EmbraceYourRage,
		CardIds.FlobbidinousFloop_GloriousGloop_BGDUO_HERO_101p,
	];

	private static TAVISH_HERO_POWERS: string[] = [
		CardIds.AimLeftToken,
		CardIds.AimRightToken,
		CardIds.AimLowToken,
		CardIds.AimHighToken,
	];

	private static START_OF_COMBAT_MINION_EFFECT: string[] = [
		CardIds.PrizedPromoDrake_BG21_014,
		CardIds.PrizedPromoDrake_BG21_014_G,
		CardIds.CorruptedMyrmidon_BG23_012,
		CardIds.CorruptedMyrmidon_BG23_012_G,
		CardIds.MantidQueen_BG22_402,
		CardIds.MantidQueen_BG22_402_G,
		CardIds.InterrogatorWhitemane_BG24_704,
		CardIds.InterrogatorWhitemane_BG24_704_G,
		CardIds.Soulsplitter_BG25_023,
		CardIds.Soulsplitter_BG25_023_G,
		CardIds.AmberGuardian_BG24_500,
		CardIds.AmberGuardian_BG24_500_G,
		CardIds.ChoralMrrrglr_BG26_354,
		CardIds.ChoralMrrrglr_BG26_354_G,
		CardIds.CarbonicCopy_BG27_503,
		CardIds.CarbonicCopy_BG27_503_G,
		CardIds.HawkstriderHerald_BG27_079,
		CardIds.HawkstriderHerald_BG27_079_G,
		CardIds.AudaciousAnchor_BG28_904,
		CardIds.AudaciousAnchor_BG28_904_G,
		CardIds.DiremuckForager_BG27_556,
		CardIds.DiremuckForager_BG27_556_G,
		CardIds.PilotedWhirlOTron_BG21_HERO_030_Buddy,
		CardIds.PilotedWhirlOTron_BG21_HERO_030_Buddy_G,
		CardIds.IrateRooster_BG29_990,
		CardIds.IrateRooster_BG29_990_G,
		CardIds.MisfitDragonling_BG29_814,
		CardIds.MisfitDragonling_BG29_814_G,
		CardIds.ThousandthPaperDrake_BG29_810,
		CardIds.ThousandthPaperDrake_BG29_810_G,
		CardIds.YulonFortuneGranter_BG29_811,
		CardIds.YulonFortuneGranter_BG29_811_G,
		CardIds.TheUninvitedGuest_BG29_875,
		CardIds.TheUninvitedGuest_BG29_875_G,
		CardIds.Sandy_BGDUO_125,
		CardIds.Sandy_BGDUO_125_G,
	];

	private static START_OF_COMBAT_QUEST_REWARD_EFFECT: string[] = [
		CardIds.EvilTwin,
		CardIds.StaffOfOrigination_BG24_Reward_312,
		CardIds.TheSmokingGun,
		CardIds.StolenGold,
		CardIds.UpperHand_BG28_573,
		CardIds.ToxicTumbleweed_BG28_641,
	];

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	IsApplyOnNewNode(node: Node): boolean {
		const isAction =
			this.StateFacade.IsBattlegrounds() &&
			this.GameState.GetGameEntity() != null &&
			this.GameState.GetGameEntity()!.GetTag(GameTag.TURN) % 2 === 0 &&
			this.GameState.BgsCurrentBattleOpponent == null &&
			node.Type === Action;
		if (!isAction) {
			return false;
		}

		const actionEntityId = (node.Object as Action).Entity;
		if (!this.GameState.CurrentEntities.has(actionEntityId)) {
			return false;
		}
		const actionEntity = this.GameState.CurrentEntities.get(actionEntityId)!;

		let actionCardId: string | null = null;
		const isCorrectActionData =
			(node.Object as Action).Type === (BlockType.ATTACK as number) ||
			((node.Object as Action).Type === (BlockType.TRIGGER as number) &&
				!BattlegroundsStartOfBattleLegacySnapshot.COMPETING_BATTLE_START_HERO_POWERS.includes(
					(actionCardId = actionEntity.CardId),
				) &&
				!this.IsTavishPreparation(node) &&
				((actionCardId ?? actionEntity.CardId) === CardIds.Baconshop8playerenchantEnchantment ||
					actionEntity.GetTag(GameTag.CARDTYPE) === (CardType.HERO_POWER as number) ||
					BattlegroundsStartOfBattleLegacySnapshot.START_OF_COMBAT_MINION_EFFECT.includes(
						actionCardId ?? actionEntity.CardId,
					) ||
					BattlegroundsStartOfBattleLegacySnapshot.START_OF_COMBAT_HERO_POWER.includes(
						actionCardId ?? actionEntity.CardId,
					) ||
					BattlegroundsStartOfBattleLegacySnapshot.START_OF_COMBAT_QUEST_REWARD_EFFECT.includes(
						actionCardId ?? actionEntity.CardId,
					)));
		if (!isCorrectActionData) {
			return false;
		}

		const haveHeroesAllRequiredData = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.filter((entity) => !entity.IsBaconBartender() && !entity.IsBaconEnchantment())
			.every((entity) =>
				entity.IsBaconGhost()
					? (this.GetGhostBaseEntity(entity)?.GetTag(GameTag.COPIED_FROM_ENTITY_ID) ?? 0) > 0
					: entity.GetTag(GameTag.PLAYER_TECH_LEVEL) > 0,
			);

		return haveHeroesAllRequiredData;
	}

	private GetGhostBaseEntity(ghostEntity: FullEntity): FullEntity | null {
		const mainPlayer = this.StateFacade.LocalPlayer;
		const playerEntity = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.filter((entity) => entity.GetEffectiveController() === mainPlayer!.PlayerId)
			.filter(
				(entity) =>
					!entity.IsBaconBartender() && !entity.IsBaconGhost() && !entity.IsBaconEnchantment(),
			)
			.sort((a, b) => a.Id - b.Id)
			.pop() ?? null;
		if (playerEntity == null) {
			return ghostEntity;
		}
		const nextOpponentPlayerId = playerEntity.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);
		const nextOpponentCandidates = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((entity) => entity.GetTag(GameTag.PLAYER_ID) === nextOpponentPlayerId)
			.filter(
				(entity) =>
					!entity.IsBaconBartender() && !entity.IsBaconGhost() && !entity.IsBaconEnchantment(),
			);
		const nextOpponent =
			nextOpponentCandidates == null || nextOpponentCandidates.length === 0
				? null
				: nextOpponentCandidates[0];
		return nextOpponent ?? ghostEntity;
	}

	private IsTavishPreparation(node: Node): boolean {
		if (node.Type !== Action) {
			return false;
		}
		const action = node.Object as Action;
		if (action.Type !== (BlockType.TRIGGER as number)) {
			return false;
		}
		if (!this.GameState.CurrentEntities.has(action.Entity)) {
			return false;
		}
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		if (!BattlegroundsStartOfBattleLegacySnapshot.TAVISH_HERO_POWERS.includes(entity.CardId)) {
			return false;
		}
		const parent = node.Parent;
		if (parent == null || parent.Type !== Action) {
			return false;
		}
		const parentAction = parent.Object as Action;
		if (parentAction.Type !== (BlockType.TRIGGER as number)) {
			return false;
		}

		const isInCombat =
			parentAction.Data.filter((data): data is TagChange => data instanceof TagChange).find(
				(data) => data.Name === 2029,
			) != null;
		return !isInCombat;
	}
}
