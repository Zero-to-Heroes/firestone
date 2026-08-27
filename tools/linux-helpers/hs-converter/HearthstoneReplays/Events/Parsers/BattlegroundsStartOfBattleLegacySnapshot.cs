using HearthstoneReplays.Parser;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using HearthstoneReplays.Parser.ReplayData.GameActions;

namespace HearthstoneReplays.Events.Parsers
{
    internal class BattlegroundsStartOfBattleLegacySnapshot
    {

        private static List<string> COMPETING_BATTLE_START_HERO_POWERS = new List<string>() {
            RebornRites,
            SwattingInsects,
        };

        // We want to send the board states before these hero powers trigger
        private static List<string> START_OF_COMBAT_HERO_POWER = new List<string>() {
            //TeronGorefiend_RapidReanimation
            RapidReanimation_ImpendingDeathEnchantment,
            WaxWarband,
            // We need to send the board state before it triggers, because the simulator needs to handle it, so that
            // it is not broken if Ozumat + Tavish (or other hero power that is managed by the simulator) happen
            Ozumat_Tentacular,
            TamsinRoame_FragrantPhylactery,
            EmbraceYourRage,
            FlobbidinousFloop_GloriousGloop_BGDUO_HERO_101p,
        };

        private static List<string> TAVISH_HERO_POWERS = new List<string>() {
            AimLeftToken,
            AimRightToken,
            AimLowToken,
            AimHighToken,
        };

        private static List<string> START_OF_COMBAT_MINION_EFFECT = new List<string>() {
            //RedWhelp_BGS_019,
            //RedWhelp_TB_BaconUps_102,
            PrizedPromoDrake_BG21_014,
            PrizedPromoDrake_BG21_014_G,
            CorruptedMyrmidon_BG23_012,
            CorruptedMyrmidon_BG23_012_G,
            MantidQueen_BG22_402,
            MantidQueen_BG22_402_G,
            InterrogatorWhitemane_BG24_704,
            InterrogatorWhitemane_BG24_704_G,
            Soulsplitter_BG25_023,
            Soulsplitter_BG25_023_G,
            AmberGuardian_BG24_500,
            AmberGuardian_BG24_500_G,
            ChoralMrrrglr_BG26_354,
            ChoralMrrrglr_BG26_354_G,
            //SanctumRester_BG26_356,
            //SanctumRester_BG26_356_G,
            CarbonicCopy_BG27_503,
            CarbonicCopy_BG27_503_G,
            HawkstriderHerald_BG27_079,
            HawkstriderHerald_BG27_079_G,
            AudaciousAnchor_BG28_904,
            AudaciousAnchor_BG28_904_G,
            DiremuckForager_BG27_556,
            DiremuckForager_BG27_556_G,
            PilotedWhirlOTron_BG21_HERO_030_Buddy,
            PilotedWhirlOTron_BG21_HERO_030_Buddy_G,
            IrateRooster_BG29_990,
            IrateRooster_BG29_990_G,
            MisfitDragonling_BG29_814,
            MisfitDragonling_BG29_814_G,
            ThousandthPaperDrake_BG29_810,
            ThousandthPaperDrake_BG29_810_G,
            YulonFortuneGranter_BG29_811,
            YulonFortuneGranter_BG29_811_G,
            //HoardingHatespawn_BG29_872,
            //HoardingHatespawn_BG29_872_G,
            TheUninvitedGuest_BG29_875,
            TheUninvitedGuest_BG29_875_G,
            Sandy_BGDUO_125,
            Sandy_BGDUO_125_G,
        };

        private static List<string> START_OF_COMBAT_QUEST_REWARD_EFFECT = new List<string>() {
            EvilTwin,
            StaffOfOrigination_BG24_Reward_312,
            TheSmokingGun,
            StolenGold,
            UpperHand_BG28_573,
            ToxicTumbleweed_BG28_641,
        };

        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsStartOfBattleLegacySnapshot(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool IsApplyOnNewNode(Node node)
        {
            var isAction = StateFacade.IsBattlegrounds()
                && GameState.GetGameEntity() != null
                && GameState.GetGameEntity().GetTag(GameTag.TURN) % 2 == 0
                && GameState.BgsCurrentBattleOpponent == null
                && node.Type == typeof(Action);
            if (!isAction)
            {
                return false;
            }

            var actionEntityId = (node.Object as Action).Entity;
            var actionEntity = GameState.CurrentEntities[actionEntityId];
            if (!GameState.CurrentEntities.ContainsKey(actionEntityId))
            {
                return false;
            }

            string actionCardId = null;
            var isCorrectActionData = ((node.Object as Action).Type == (int)BlockType.ATTACK
                // Why do we want deaths? Can there be a death without an attack or trigger first? AFAIK sacrifices like Tamsin's hero
                // power is the only option?
                //|| (node.Object as Action).Type == (int)BlockType.DEATHS
                // Basically trigger as soon as we can, and just leave some room for the Lich King's hero power
                // Here we assume that hero powers are triggered first, before Start of Combat events
                // The issue is if two hero powers (including the Lich King) compete, which is the case when Al'Akir triggers first for instance
                || ((node.Object as Action).Type == (int)BlockType.TRIGGER
                        // Here we don't want to send the boards when the hero power is triggered, because we want the 
                        // board state to include the effect of the hero power, since the simulator can't guess
                        // what its outcome is (Embrace Your Rage) or what minion it targets (Reborn Rites)
                        && !COMPETING_BATTLE_START_HERO_POWERS.Contains((actionCardId = actionEntity.CardId))
                        && !IsTavishPreparation(node)
                        && (
                                // This was introduced to wait until the damage is done to each hero before sending the board state. However,
                                // forcing the entity to be the root entity means that sometimes we send the info way too late.
                                actionCardId == CardIds.Baconshop8playerenchantEnchantment
                                // This condition has been introduced to solve an issue when the Wingmen hero power triggers. In that case, the parent action of attacks
                                // is not a TB_BaconShop_8P_PlayerE, but the hero power action itself.
                                || actionEntity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO_POWER
                                // Here we want the boards to be send before the minions start of combat effects happen, because
                                // we want the simulator to include their random effects inside the simulation
                                || START_OF_COMBAT_MINION_EFFECT.Contains(actionCardId)
                                || START_OF_COMBAT_HERO_POWER.Contains(actionCardId)
                                || START_OF_COMBAT_QUEST_REWARD_EFFECT.Contains(actionCardId)
                            )
                    )
            );
            if (!isCorrectActionData)
            {
                return false;
            }

            // Check that we have enough information on the opponent to avoid sending the data too soon
            var haveHeroesAllRequiredData = GameState.CurrentEntities.Values
                .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                // Here we accept to face the ghost
                .Where(entity => !entity.IsBaconBartender() && !entity.IsBaconEnchantment())
                //.Select(entity => entity.IsBaconGhost() 
                //    ? GetGhostBaseEntity(entity)
                //    : entity)
                .All(entity => entity.IsBaconGhost()
                    ? (GetGhostBaseEntity(entity)?.GetTag(GameTag.COPIED_FROM_ENTITY_ID) ?? 0) > 0
                    : entity.GetTag(GameTag.PLAYER_TECH_LEVEL) > 0);
            //var debugList = GameState.CurrentEntities.Values
            //    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
            //    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
            //    // Here we accept to face the ghost
            //    .Where(entity => entity.CardId != BartenderBob
            //        && entity.CardId != BaconphheroHeroic)
            //    .ToList();
            var debug = node.CreationLogLine.Contains("BLOCK_START BlockType=ATTACK Entity=[entityName=Passenger id=506");
            if (!haveHeroesAllRequiredData)
            {
                return false;
            }

            return true;
        }

        private FullEntity GetGhostBaseEntity(FullEntity ghostEntity)
        {
            var mainPlayer = StateFacade.LocalPlayer;
            var playerEntity = GameState.CurrentEntities.Values
                .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                .Where(entity => entity.GetEffectiveController() == mainPlayer.PlayerId)
                .Where(entity => !entity.IsBaconBartender()
                    && !entity.IsBaconGhost()
                    && !entity.IsBaconEnchantment())
                .OrderBy(entity => entity.Id)
                .LastOrDefault();
            var nextOpponentPlayerId = playerEntity.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);
            var nextOpponentCandidates = GameState.CurrentEntities.Values
                .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == nextOpponentPlayerId)
                .Where(entity => !entity.IsBaconBartender()
                    && !entity.IsBaconGhost()
                    && !entity.IsBaconEnchantment())
                .ToList();
            var nextOpponent = nextOpponentCandidates == null || nextOpponentCandidates.Count == 0 ? null : nextOpponentCandidates[0];
            return nextOpponent ?? ghostEntity;
        }

        private bool IsTavishPreparation(Node node)
        {
            if (node.Type != typeof(Action))
            {
                return false;
            }
            var action = node.Object as Action;
            if (action.Type != (int)BlockType.TRIGGER)
            {
                return false;
            }
            if (!GameState.CurrentEntities.ContainsKey(action.Entity))
            {
                return false;
            }
            var entity = GameState.CurrentEntities[action.Entity];
            if (!TAVISH_HERO_POWERS.Contains(entity.CardId))
            {
                return false;
            }
            // When we're triggering Tavish in battle, the BLOCK also contains a tag change (earlier)
            var parent = node.Parent;
            if (parent.Type != typeof(Action))
            {
                return false;
            }
            var parentAction = parent.Object as Action;
            if (parentAction.Type != (int)BlockType.TRIGGER)
            {
                return false;
            }


            var isInCombat = parentAction.Data
                .Where(data => data.GetType() == typeof(TagChange))
                .Select(data => data as TagChange)
                // Undocumented tag
                .Where(data => data.Name == 2029)
                .FirstOrDefault() != null;
            return !isInCombat;
        }
    }
}
