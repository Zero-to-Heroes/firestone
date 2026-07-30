using HearthstoneReplays.Parser;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Runtime.InteropServices;
using System;
using static HearthstoneReplays.Events.Parsers.BattlegroundsActivePlayerBoardParser;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using HearthstoneReplays.Parser.ReplayData.Meta;
using static HearthstoneReplays.Events.Parsers.BattlegroundsPlayerBoardParser;
using HearthstoneReplays.Events.Parsers.Utils;
using HearthstoneReplays.Events.Cards;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsPlayerBoardParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }
        private BattlegroundsStartOfBattleLegacySnapshot Snapshot;

        // Shared between PTL and GS
        private static bool IsGSReadyForBattle = false;
        private static bool IsPTLReadyForBattle = false;

        public BattlegroundsPlayerBoardParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
            this.Snapshot = new BattlegroundsStartOfBattleLegacySnapshot(ParserState, helper);
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            // Use PTL to be able to "see the future", even if it means the info will be delayed
            // Using PTL instead of GS will add a few seconds delay, but it shouldn't be too much
            //return stateType == StateType.PowerTaskList && IsApplyOnNewNode(node, stateType);
            return IsApplyOnNewNode(node, stateType);
        }

        public bool IsApplyOnNewNode(Node node, StateType stateType)
        {
            //return StateFacade.IsBattlegrounds()
            //        && node.Type == typeof(TagChange)
            //        && (node.Object as TagChange).Name == (int)GameTag.BG_BATTLE_STARTING
            //        && (node.Object as TagChange).Value == 0;
            // This seems to always trigger a few seconds before the BATTLE_STARTING tag change, without any significant
            // data being produced
            // Doesn't work, since the GameState battle happens right after BACON_CHOSEN_BOARD_SKIN_ID is set, so this means
            // we completely miss the GameState features.
            // Trying to make this work by postponing the sending of the "BACON_CHOSEN_BOARD_SKIN_ID" log line, so that it arrives
            // between the moment the GameState battle ends and the PTL battle starts
            // In Duos, because of the teammate there can be some more latency between the various steps
            if (StateFacade.IsBattlegrounds() || StateFacade.IsBattlegroundsDuos())
            {
                return stateType == StateType.PowerTaskList
                    && node.Type == typeof(TagChange)
                    && (node.Object as TagChange).Name == (int)GameTag.BG_BATTLE_STARTING
                    && (node.Object as TagChange).Value == 0;
            }
            // Other attempt: look for the "battle over" event from GameState, and then start the battle sim on PTL
            // This caused a lot of sim fails, so it is clearly bugged, but I believe we could investigate why, and 
            // fix it. Would be nice to have sims run a few seconds early
            //else if (StateFacade.IsBattlegrounds())
            //{
            //    DateTime timestamp = DateTime.MinValue;
            //    var isStartOfBattle = stateType == StateType.PowerTaskList
            //        && node.Type == typeof(TagChange)
            //        && (node.Object as TagChange).Name == (int)GameTag.BACON_CHOSEN_BOARD_SKIN_ID
            //        && (node.Object as TagChange).Value != 0;
            //    if (isStartOfBattle)
            //    {
            //        timestamp = (node.Object as TagChange).TimeStamp;
            //        Logger.Log($"[debug] {timestamp} IsPTLReadyForBattle? {IsPTLReadyForBattle}", node.CreationLogLine);
            //        IsPTLReadyForBattle = true;
            //    }

            //    var isGettingReadyForBattle = stateType == StateType.GameState
            //        && node.Type == typeof(TagChange)
            //        && (((node.Object as TagChange).Name == (int)GameTag.BOARD_VISUAL_STATE && (node.Object as TagChange).Value == 1)
            //            || ((node.Object as TagChange).Name == (int)GameTag.STATE && (node.Object as TagChange).Value == (int)State.COMPLETE));
            //    if (isGettingReadyForBattle)
            //    {
            //        timestamp = (node.Object as TagChange).TimeStamp;
            //        Logger.Log($"[debug] {timestamp} IsGSReadyForBattle? {IsGSReadyForBattle}", node.CreationLogLine);
            //        IsGSReadyForBattle = true;
            //    }

            //    if (IsGSReadyForBattle && IsPTLReadyForBattle)
            //    {
            //        return true;
            //    }
            //}
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            IsPTLReadyForBattle = false;
            IsGSReadyForBattle = false;
            Logger.Log("Starting to build player boards", node.CreationLogLine);
            var tagChange = node.Object as TagChange;
            var opponent = StateFacade.OpponentPlayer;
            var player = StateFacade.LocalPlayer;

            var playerBoard = BattlegroundsPlayerBoardParser.CreateProviderFromAction(player.PlayerId, player.Id, false, player, GameState, StateFacade);
            var opponentBoard = BattlegroundsPlayerBoardParser.CreateProviderFromAction(opponent.PlayerId, opponent.Id, true, player, GameState, StateFacade);

            GameState.BgsHasSentNextOpponent = false;
            Logger.Log("Player boards built", "");

            var result = new List<GameEventProvider>();
            result.Add(GameEventProvider.Create(
                   tagChange.TimeStamp,
                   "BATTLEGROUNDS_PLAYER_BOARD",
                   () =>
                   {
                       Logger.Log("Providing player board events " + tagChange.TimeStamp + " " + node.CreationLogLine,
                           $"player: {string.Join("'", playerBoard.Board.Select(e => e.CardId).ToList())} " +
                           $"opponent: {string.Join("'", opponentBoard.Board.Select(e => e.CardId).ToList())}");
                       return new GameEvent
                       {
                           Type = "BATTLEGROUNDS_PLAYER_BOARD",
                           Value = new
                           {
                               PlayerBoard = playerBoard,
                               OpponentBoard = opponentBoard,
                           }
                       };
                   },
                   true,
                   node
               ));
            return result;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }

        internal static PlayerBoard CreateProviderFromAction(int playerPlayerId, int playerEntityId, bool isOpponent, Player mainPlayer, GameState GameState, StateFacade StateFacade)
        {
            if (isOpponent)
            {
                Logger.Log($"Building opponent board for playerPlayerId={playerPlayerId}, playerEntityId={playerEntityId}", "");
            }

            //Dictionary<int, FullEntity> currentEntitiesCopy = new Dictionary<int, FullEntity>(GameState.CurrentEntities);
            var currentEntities = GameState.CurrentEntities.Values;

            var potentialHeroes = currentEntities
                .Where(entity =>
                    entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO &&
                    // Issue: when the player is a ghost, it can be in the REMOVEDFROMGAME zone
                    entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                    entity.GetEffectiveController() == playerPlayerId &&
                    // Here we accept to face the ghost
                    !entity.IsBaconBartender() && !entity.IsBaconEnchantment())
                .ToList();

            // When reconnecting, sometimes we have multiple heroes in play
            var hero = potentialHeroes.LastOrDefault()?.Clone();
            var cardId = hero?.CardId;
            // We do this, otherwise we always have the same playerId, which is either the "main player" or the "opponent player" defined
            // at the start. However, we are interested in getting the actual player
            int playerId = hero?.GetTag(GameTag.PLAYER_ID) ?? playerPlayerId;

            if (BgsUtils.IsBaconGhost(cardId) || (hero?.IsBaconBartender() ?? false))
            {
                // This can be weird. If we're in Duos, and the active fighter (our teammate) is a ghost, the LINKED_ENTITY links back
                // to our own player entity, and not the teammate's??
                //var linkedEntityId = hero.GetTag(GameTag.LINKED_ENTITY);
                //var linkedEntity = GameState.CurrentEntities.GetValueOrDefault(linkedEntityId);
                var heroesForTargetPlayerId = currentEntities
                    .Where(entity =>
                        entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO &&
                        entity.GetTag(GameTag.PLAYER_ID) == playerId &&
                        !entity.IsBaconBartender() &&
                        !entity.IsBaconEnchantment() &&
                        !entity.IsBaconGhost())
                    .ToList();

                var linkedEntity = heroesForTargetPlayerId.LastOrDefault();
                if (linkedEntity != null)
                {
                    hero = linkedEntity;
                    cardId = hero.CardId;
                    playerId = hero.GetTag(GameTag.PLAYER_ID);
                }
            }

            // Happens in the first encounter
            if (cardId == null)
            {
                var activePlayer = GameState.CurrentEntities[StateFacade.LocalPlayer.Id];
                var opponentPlayerId = activePlayer.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);
                hero = currentEntities
                    .FirstOrDefault(data => data.GetTag(GameTag.PLAYER_ID) == opponentPlayerId)
                    ?.Clone();
                cardId = hero?.CardId;
                playerId = hero?.GetTag(GameTag.PLAYER_ID) ?? playerId;
            }

            if (isOpponent)
            {
                GameState.BgsCurrentBattleOpponent = cardId;
                GameState.BgsCurrentBattleOpponentPlayerId = playerId;
            }

            if (cardId != null)
            {
                // We don't use the game state builder here because we really need the full entities
                var board = currentEntities
                    .Where(entity =>
                        entity.GetEffectiveController() == playerPlayerId &&
                        entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                        entity.TakesBoardSpace() &&
                        // Because when the opponent is the ghost, we don't always know which ones are actually attached to it
                        // Also, when reconnecting, we sometimes get artifacts for the opponent's board, so restricting the list
                        // to the ones who only just appeared removes a lot of issues
                        (!isOpponent || entity.GetTag(GameTag.NUM_TURNS_IN_PLAY) <= 1))
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .Select(entity => EnhanceEntities(entity.Clone(), GameState, StateFacade))
                    .ToList();
                var secrets = currentEntities
                    .Where(entity =>
                        entity.GetEffectiveController() == playerPlayerId &&
                        entity.GetTag(GameTag.ZONE) == (int)Zone.SECRET &&
                        entity.GetTag(GameTag.BACON_IS_BOB_QUEST) != 1 &&
                        entity.GetTag(GameTag.QUEST) != 1 &&
                        entity.GetTag(GameTag.SIDE_QUEST) != 1)
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .Select(entity => BuildEntityWithCardIdFromTheFuture(entity.Clone(), StateFacade.GsState.GameState))
                    .ToList();
                var hand = currentEntities
                    .Where(entity =>
                        entity.GetEffectiveController() == playerPlayerId &&
                        entity.GetTag(GameTag.ZONE) == (int)Zone.HAND)
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .Select(entity => entity.Clone())
                    .Select(entity => AddEchantments(GameState.CurrentEntities, entity))
                    .ToList();

                if (isOpponent)
                {
                    // Look for all the cards that are in hand at the start of the fight, and that are "copied" by bassgil
                    // We can't use the final stats as they are, as it would include damage + stats change over the course of
                    // the fight
                    // We might be able to simply remove the damage, and use the buffed stats as the base stats. It won't be 
                    // perfect, but probably good enough
                    //var boardCardIds = board.Select(e => e.CardId).ToList();
                    //var handEntityIds = hand.Select(e => e.Id).ToList();
                    hand = hand.Select(e => GetEntitySpawnedFromHand(e.Id, board, StateFacade) ?? e).ToList();
                }

                var finalBoard = board.Select(entity => AddEchantments(GameState.CurrentEntities, entity)).ToList();
                if (finalBoard.Count > 7)
                {
                    Logger.Log("Too many entities on board", "");
                }

                var questRewardRawEntities = currentEntities
                    .Where(entity =>
                        entity.GetEffectiveController() == playerPlayerId &&
                        entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                        entity.GetTag(GameTag.CARDTYPE) == (int)CardType.BATTLEGROUND_QUEST_REWARD)
                    .Select(entity => entity.Clone());
                var questRewards = questRewardRawEntities
                    .Select(entity => entity.CardId)
                    .ToList();
                var questRewardEntities = questRewardRawEntities
                    .Select(entity => new QuestReward
                    {
                        CardId = entity.CardId,
                        AvengeCurrent = 0,
                        AvengeDefault = 0,
                        ScriptDataNum1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0)
                    })
                    .ToList();
                var questEntities = currentEntities
                    .Where(entity =>
                        entity.GetEffectiveController() == playerPlayerId &&
                        entity.GetTag(GameTag.ZONE) == (int)Zone.SECRET &&
                        entity.GetTag(GameTag.CARDTYPE) == (int)CardType.SPELL &&
                        entity.GetTag(GameTag.QUEST) == 1)
                    .Select(entity => new QuestEntity
                    {
                        CardId = entity.CardId,
                        RewardDbfId = entity.GetTag(GameTag.QUEST_REWARD_DATABASE_ID, 0),
                        ProgressCurrent = entity.GetTag(GameTag.QUEST_PROGRESS, 0),
                        ProgressTotal = entity.GetTag(GameTag.QUEST_PROGRESS_TOTAL, 0),
                    })
                    .ToList();

                List<TrinketEntity> trinkets = BuildTrinkets(playerPlayerId, GameState);

                BgsPlayerGlobalInfo globalInfo = BuildGlobalInfo(playerPlayerId, playerEntityId, finalBoard, GameState, StateFacade);


                var heroPowerEntities = currentEntities
                    .Where(entity =>
                        entity.GetEffectiveController() == playerPlayerId &&
                        entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                        entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO_POWER)
                    .Select(entity => entity.Clone())
                    .ToList();
                if (heroPowerEntities.Count == 0)
                {
                    Logger.Log("WARNING: could not find hero power", "");
                }

                List<BgsHeroPower> heroPowers = heroPowerEntities
                    .Select(hp => new BgsHeroPower()
                    {
                        CardId = hp?.CardId,
                        EntityId = hp?.Entity ?? -1,
                        Used = hp?.GetTag(GameTag.BACON_HERO_POWER_ACTIVATED) == 1,
                        Info = hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0,
                        Info2 = hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2) ?? 0,
                        Info3 = hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_3) ?? 0,
                        Info4 = hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_4) ?? 0,
                        Info5 = hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_5) ?? 0,
                        Info6 = hp?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_6) ?? 0,
                        ScoreValue1 = hp?.GetTag(GameTag.SCORE_VALUE_1, 0) ?? 0,                        
                        ScoreValue2 = hp?.GetTag(GameTag.SCORE_VALUE_2, 0) ?? 0,                        
                        ScoreValue3 = hp?.GetTag(GameTag.SCORE_VALUE_3, 0) ?? 0,                        
                        Locked = hp?.GetTag(GameTag.LOCK_VISUAL) ?? 0,
                        CreatedEntity = null,
                    })
                    .ToList();

                UpdateEmbraceYourRageTarget(StateFacade, heroPowers);
                UpdateRebornRitesTarget(StateFacade, heroPowers);
                UpdateLockAndLoadMinion(StateFacade, heroPowers);

                return new PlayerBoard()
                {
                    Hero = hero,
                    HeroPowers = heroPowers,
                    HeroPowerCardId = heroPowerEntities.FirstOrDefault()?.CardId,
                    HeroPowerEntityId = heroPowerEntities.FirstOrDefault()?.Entity ?? -1,
                    HeroPowerUsed = heroPowerEntities.FirstOrDefault()?.GetTag(GameTag.BACON_HERO_POWER_ACTIVATED) == 1,
                    HeroPowerInfo = heroPowerEntities.FirstOrDefault()?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0,
                    HeroPowerInfo2 = heroPowerEntities.FirstOrDefault()?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2) ?? 0,
                    HeroPowerCreatedEntity = null,
                    CardId = cardId,
                    PlayerId = playerId,
                    PlayerEntityId = playerEntityId,
                    Board = finalBoard,
                    QuestEntities = questEntities,
                    QuestRewards = questRewards,
                    QuestRewardEntities = questRewardEntities,
                    Secrets = secrets,
                    Hand = hand,
                    Trinkets = trinkets,
                    GlobalInfo = globalInfo,
                };
            }
            return null;
        }

        public static List<TrinketEntity> BuildTrinkets(int playerPlayerId, GameState gameState)
        {
            var debugTrinkets = gameState.CurrentEntities.Values
                .Where(entity =>
                    entity.GetEffectiveController() == playerPlayerId &&
                    entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                    entity.GetCardType() == (int)CardType.BATTLEGROUND_TRINKET)
                .ToList();
            var debug = debugTrinkets.Any(t => t.Entity == 9529);
            return gameState.CurrentEntities.Values
                .Where(entity =>
                    entity.GetEffectiveController() == playerPlayerId &&
                    entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                    entity.GetCardType() == (int)CardType.BATTLEGROUND_TRINKET)
                .Select(entity => new TrinketEntity
                {
                    cardId = entity.CardId,
                    entityId = entity.Entity,
                    scriptDataNum1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
                    scriptDataNum2 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0),
                    scriptDataNum6 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_6, 0),
                })
                .OrderBy(trinket => trinket.scriptDataNum6)
                .ToList();
        }

        internal static BgsPlayerGlobalInfo BuildGlobalInfo(int playerId, int playerEntityId, List<BgsPlayerBoardEntity> board, GameState GameState, StateFacade StateFacade)
        {
            var currentEntities = GameState.CurrentEntities.Values.ToList();
            var currentEntitiesGs = StateFacade.GsState.GameState.CurrentEntities.Values.ToList();
            var eternalKnightBonus = GetPlayerEnchantmentValue(playerId, CardIds.EternalKnightPlayerEnchantEnchantment, currentEntities);
            var tavernSpellsCastThisGame = GetPlayerTag(playerEntityId, GameTag.TAVERN_SPELLS_PLAYED_THIS_GAME, currentEntities);
            var spellsCastThisGame = GetPlayerTag(playerEntityId, GameTag.NUM_SPELLS_PLAYED_THIS_GAME, currentEntities);
            // Includes Anub'arak, Nerubian Deathswarmer
            var undeadAttackBonus = GetPlayerEnchantmentValue(playerId, CardIds.UndeadBonusAttackPlayerEnchantDntEnchantment, currentEntities);
            var hauntedCarapaceAttackBonus = GetPlayerEnchantmentValue(playerId, CardIds.HauntedCarapacePlayerEnchantDntEnchantment_BG33_112pe, currentEntities);
            var hauntedCarapaceHealthBonus = GetPlayerEnchantmentValue(playerId, CardIds.HauntedCarapacePlayerEnchantDntEnchantment_BG33_112pe, currentEntities, GameTag.TAG_SCRIPT_DATA_NUM_2);
            var goldrinnBuffAtk = GetPlayerEnchantmentValue(playerId, CardIds.GoldrinnPlayerEnchantEnchantment_BGS_018pe, currentEntities)
                + GetPlayerEnchantmentValue(playerId, CardIds.TimewarpedGoldrinnPlayerEnchantDntEnchantment_BG34_Giant_362pe, currentEntities);
            var goldrinnBuffHealth = GetPlayerEnchantmentValue(playerId, CardIds.GoldrinnPlayerEnchantEnchantment_BGS_018pe, currentEntities, GameTag.TAG_SCRIPT_DATA_NUM_2)
                + GetPlayerEnchantmentValue(playerId, CardIds.TimewarpedGoldrinnPlayerEnchantDntEnchantment_BG34_Giant_362pe, currentEntities, GameTag.TAG_SCRIPT_DATA_NUM_2);
            var astralAutomatonBonus = GetPlayerEnchantmentValue(playerId, CardIds.AstralAutomatonPlayerEnchantDntEnchantment_BG_TTN_401pe, currentEntities);
            var beetleArmy = GetTupleEnchantmentValue(playerId, CardIds.BeetleArmyPlayerEnchantDntEnchantment_BG31_808pe, currentEntities);
            var sanlyanScribesDeadThisGame = GetTupleEnchantmentValue(playerId, CardIds.SanlaynScribePlayerEnchantDntEnchantment_BGDUO31_208pe, currentEntities);
            var deepBluesPlayed = GetPlayerEnchantmentValue(playerId, CardIds.DeepBlueCroonerPlayerEnchantDntEnchantment, currentEntities);
            // Looks like the enchantment isn't used anymore, at least for the opponent?
            var frostlingBonus = GetPlayerTag(playerEntityId, GameTag.BACON_ELEMENTALS_PLAYED_THIS_GAME, currentEntities);
            var piratesPlayedThisGame = GetPlayerTag(playerEntityId, GameTag.BACON_PIRATES_PLAYED_THIS_GAME, currentEntities);
            var piratesSummonedThisGame = GetPlayerTag(playerEntityId, GameTag.BACON_PIRATES_SUMMONED_THIS_GAME, currentEntities);
            var beastsSummonedThisGame = GetPlayerTag(playerEntityId, GameTag.BACON_BEASTS_SUMMONED_THIS_GAME, currentEntities);
            var magnetizedThisGame = GetPlayerTag(playerEntityId, GameTag.BACON_NUM_MAGNETIZE_THIS_GAME, currentEntities);
            var elementalHealthBuff = GetPlayerTag(playerEntityId, GameTag.BACON_ELEMENTAL_BUFFHEALTHVALUE, currentEntities);
            var elementalAttackBuff = GetPlayerTag(playerEntityId, GameTag.BACON_ELEMENTAL_BUFFATKVALUE, currentEntities);
            var tavernSpellHealthBuff = GetPlayerTag(playerEntityId, GameTag.TAVERN_SPELL_HEALTH_INCREASE, currentEntities);
            var tavernSpellAttackBuff = GetPlayerTag(playerEntityId, GameTag.TAVERN_SPELL_ATTACK_INCREASE, currentEntities);
            var goldSpentThisGame = GetPlayerTag(playerEntityId, GameTag.BACON_GOLD_SPENT_THIS_GAME, currentEntities);
            //if (goldSpentThisGame == 0)
            //{
            //    // For opponent
            //    goldSpentThisGame = GetPlayerTag(playerEntityId, GameTag.BACON_GOLD_SPENT_THIS_GAME, currentEntities);
            //}
            var debugPlayerEntity = currentEntities.Find(e => e.Entity == playerEntityId);
            var debugTags = debugPlayerEntity.TagsHistory.Where(t => t.Name == (int)GameTag.TAVERN_SPELL_ATTACK_INCREASE).ToList();
            var bloodGemEnchant = currentEntities
                .Where(entity =>
                    entity.GetEffectiveController() == playerId &&
                    // Don't use the PLAY zone, as it could cause issues with teammate state in Duos? To be tested
                    entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                    entity.CardId == CardIds.BloodGemPlayerEnchantEnchantment)
                .LastOrDefault();
            var bloodGemAttackBonus = bloodGemEnchant?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0) ?? 0;
            var bloodGemHealthBonus = bloodGemEnchant?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0) ?? 0;
            var battlecriesTriggeredThisGame = GetPlayerTag(playerEntityId, GameTag.BATTLECRIES_TRIGGERED_THIS_GAME, currentEntities);
            var friendlyMinionsDeadLastCombat = GetPlayerTag(playerEntityId, GameTag.NUM_FRIENDLY_MINIONS_THAT_DIED_LAST_TURN, currentEntities);
            var volumizerAttackBuff = GetPlayerTag(playerEntityId, GameTag.BACON_VOLUMIZER_ATTACK_BUFF, currentEntities);
            var volumizerHealthBuff = GetPlayerTag(playerEntityId, GameTag.BACON_VOLUMIZER_HEALTH_BUFF, currentEntities);
            var whelpAttackBuff = GetPlayerEnchantmentValue(playerId, CardIds.WhelpBuffPlayerEnchantDntEnchantment_BG34_402pe, currentEntities);
            var whelpHealthBuff = GetPlayerEnchantmentValue(playerId, CardIds.WhelpBuffPlayerEnchantDntEnchantment_BG34_402pe, currentEntities, GameTag.TAG_SCRIPT_DATA_NUM_2);

            var debug2 = board.Any(e => e.Entity == 18254);

            var choralEnchantments = currentEntitiesGs
                .Where(e => e.CardId == CardIds.ChoralMrrrglr_ChorusEnchantment && board.Select(b => b.Id).Contains(e.GetTag(GameTag.ATTACHED)))
                .ToList();
            var choralEnchantment = choralEnchantments.FirstOrDefault();
            var choralSource = choralEnchantment == null ? null : GameState.CurrentEntities.GetValueOrDefault(choralEnchantment.GetTag(GameTag.CREATOR));
            var isChoralPremium = choralSource?.GetTag(GameTag.PREMIUM) == 1;
            var choralAttackBuff = (choralEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0) ?? 0) / (isChoralPremium ? 2 : 1);
            var choralHealthBuff = (choralEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0) ?? 0) / (isChoralPremium ? 2 : 1);

            return new BgsPlayerGlobalInfo()
            {
                EternalKnightsDeadThisGame = eternalKnightBonus,
                TavernSpellsCastThisGame = tavernSpellsCastThisGame,
                UndeadAttackBonus = undeadAttackBonus,
                HauntedCarapaceAttackBonus = hauntedCarapaceAttackBonus,
                HauntedCarapaceHealthBonus = hauntedCarapaceHealthBonus,
                FrostlingBonus = frostlingBonus,
                PiratesSummonedThisGame = piratesSummonedThisGame,
                BeastsSummonedThisGame = beastsSummonedThisGame,
                MagnetizedThisGame = magnetizedThisGame,
                AstralAutomatonsSummonedThisGame = astralAutomatonBonus,
                PiratesPlayedThisGame = piratesPlayedThisGame,
                BloodGemAttackBonus = bloodGemAttackBonus,
                BloodGemHealthBonus = bloodGemHealthBonus,
                ChoralAttackBuff = choralAttackBuff,
                ChoralHealthBuff = choralHealthBuff,
                BeetleAttackBuff = beetleArmy.Item1,
                BeetleHealthBuff = beetleArmy.Item2,
                ElementalHealthBuff = elementalHealthBuff,
                ElementalAttackBuff = elementalAttackBuff,
                TavernSpellHealthBuff = tavernSpellHealthBuff,
                TavernSpellAttackBuff = tavernSpellAttackBuff,
                BattlecriesTriggeredThisGame = battlecriesTriggeredThisGame,
                FriendlyMinionsDeadLastCombat = friendlyMinionsDeadLastCombat,
                SanlaynScribesDeadThisGame = sanlyanScribesDeadThisGame?.Item1 ?? 0,
                SpellsCastThisGame = spellsCastThisGame,
                GoldSpentThisGame = goldSpentThisGame,
                GoldrinnBuffAtk = goldrinnBuffAtk,
                GoldrinnBuffHealth = goldrinnBuffHealth,
                WhelpAttackBuff = whelpAttackBuff,
                WhelpHealthBuff = whelpHealthBuff,
                DeepBluesPlayed = deepBluesPlayed,
                VolumizerAttackBuff = volumizerAttackBuff,
                VolumizerHealthBuff = volumizerHealthBuff,
            };
        }

        internal static void UpdateEmbraceYourRageTarget(StateFacade stateFacade, List<BgsHeroPower> heroPowers)
        {
            foreach (var heroPower in heroPowers)
            {
                bool heroPowerUsed = heroPower.Used;
                string heroPowerCardId = heroPower.CardId;
                int? heroPowerEntityId = heroPower.EntityId;
                if (heroPowerUsed && heroPowerCardId == CardIds.EmbraceYourRage)
                {
                    var entities = stateFacade.GsState.GameState.CurrentEntities.Values.ToList();
                    var createdEntity = entities
                        .Where(e => e.GetTag(GameTag.CREATOR) == heroPowerEntityId && e.GetCardType() == (int)CardType.MINION)
                        .Reverse()
                        .FirstOrDefault();
                    heroPower.Info = createdEntity?.CardId;
                    return;
                }
            }
        }

        internal static void UpdateLockAndLoadMinion(StateFacade stateFacade, List<BgsHeroPower> heroPowers)
        {
            foreach (var heroPower in heroPowers)
            {
                bool heroPowerUsed = heroPower.Used;
                string heroPowerCardId = heroPower.CardId;
                int? heroPowerEntityId = heroPower.EntityId;
                if (heroPowerUsed && heroPowerCardId == CardIds.LockAndLoadToken_BG22_HERO_000p_Alt)
                {
                    var entities = stateFacade.GsState.GameState.CurrentEntities.Values.ToList();
                    // Ptl works for the player, but not for the opponent
                    var createdEntity = stateFacade.PtlState.GameState.CurrentEntities.Values.ToList()
                        .Where(e => e.GetTag(GameTag.CREATOR) == heroPowerEntityId && e.GetCardType() == (int)CardType.MINION)
                        .Reverse()
                        .FirstOrDefault();
                    if (createdEntity != null)
                    {
                        // Using GsState means that enchantments will probably be already removed from game
                        var withEnchants = AddEchantments(
                            stateFacade.PtlState.GameState.CurrentEntities,
                            createdEntity
                        );
                        heroPower.Info = withEnchants;
                    }
                    else
                    {
                        // Probably not enough, as it will include all the changes from the combat itself, then revert back to vanilla
                        // Let's update this with future bug reports
                        var createdEntity2 = stateFacade.GsState.GameState.CurrentEntities.Values.ToList()
                            .Where(e => e.GetTag(GameTag.CREATOR) == heroPowerEntityId && e.GetCardType() == (int)CardType.MINION)
                            .Reverse()
                            .FirstOrDefault();
                        var clone = createdEntity2.Clone();
                        var takeUntilTag = GameTag.COPIED_FROM_ENTITY_ID;
                        OverrideTagWithHistory(clone, GameTag.HEALTH, takeUntilTag);
                        OverrideTagWithHistory(clone, GameTag.ATK, takeUntilTag);
                        OverrideTagWithHistory(clone, GameTag.LITERALLY_UNPLAYABLE, takeUntilTag);
                        OverrideTagWithHistory(clone, GameTag.UNPLAYABLE_VISUALS, takeUntilTag);
                        OverrideTagWithHistory(clone, GameTag.REBORN, takeUntilTag);
                        var withEnchants = AddEchantments(
                            stateFacade.GsState.GameState.CurrentEntities,
                            clone,
                            true
                        );
                        heroPower.Info = withEnchants;
                    }
                    return;
                }
            }
        }

        internal static void UpdateRebornRitesTarget(StateFacade stateFacade, List<BgsHeroPower> heroPowers)
        {
            foreach (var heroPower in heroPowers)
            {
                bool heroPowerUsed = heroPower.Used;
                string heroPowerCardId = heroPower.CardId;
                int? heroPowerEntityId = heroPower.EntityId;
                int heroPowerInfo = heroPower.Info is int intValue ? intValue : 0;
                if (heroPowerUsed && heroPowerCardId == CardIds.RebornRites && heroPowerInfo <= 0)
                {
                    var heroPowerEntity = stateFacade.PtlState.GameState.CurrentEntities.GetValueOrDefault(heroPowerEntityId ?? -1);
                    if (heroPowerEntity == null)
                    {
                        return;
                    }

                    var targetEntityId = heroPowerEntity.GetTag(GameTag.CARD_TARGET);
                    if (targetEntityId > 0)
                    {
                        heroPower.Info = targetEntityId;
                        return;
                    }
                }
            }
        }

        internal static FullEntity BuildEntityWithCardIdFromTheFuture(FullEntity entity, GameState gsState)
        {
            if (entity.CardId != null && entity.CardId.Length > 0)
            {
                return entity;
            }
            var entityFromTheFuture = gsState.CurrentEntities.GetValueOrDefault(entity.Entity);
            if (entityFromTheFuture.CardId == null || entityFromTheFuture.CardId.Length == 0)
            {
                return entity;
            }
            entity.CardId = entityFromTheFuture.CardId;
            return entity;
        }

        internal static FullEntity EnhanceEntities(FullEntity entity, GameState gameState, StateFacade StateFacade)
        {
            switch (entity.CardId)
            {
                case LovesickBalladist_BG26_814:
                case LovesickBalladist_BG26_814_G:
                    return EnhanceLovesickBalladist(entity, StateFacade);
                case TimewarpedNelliesShipToken_BG34_Giant_074t:
                case TimewarpedNelliesShip_BG34_Giant_074t_G:
                    return TimewarpedNelliesShip.EnhanceEntity(entity, StateFacade);
                default:
                    return entity;
            }
        }

        internal static FullEntity EnhanceLovesickBalladist(FullEntity entity, StateFacade StateFacade)
        {
            var serenadedEnchantments = StateFacade.GsState.Replay.Games[StateFacade.GsState.Replay.Games.Count - 1]
                .FilterGameData(typeof(ShowEntity))
                .Select(d => d as ShowEntity)
                .Where(e =>
                    e.CardId == CardIds.LovesickBalladist_SerenadedEnchantment &&
                    e.GetTag(GameTag.CREATOR) == entity.Id &&
                    e.GetTag(GameTag.ATTACHED) > 0)
                .ToList();
            // Make sure to take the last one so we are not polluted by values from previous fights
            var latestEnchantment = serenadedEnchantments.LastOrDefault();
            var latestEnchantmentId = latestEnchantment?.Entity;
            if (latestEnchantmentId == null)
            {
                return entity;
            }


            var buffEnchantmentValue = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(latestEnchantmentId.Value)
                ?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0;
            if (buffEnchantmentValue > 0)
            {
                var baseVale = entity.CardId == LovesickBalladist_BG26_814
                    ? buffEnchantmentValue
                    : buffEnchantmentValue / 2;
                entity.SetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, baseVale);
            }
            return entity;
        }

        private static void OverrideTagWithHistory(FullEntity entity, GameTag tag, GameTag takeUntilTag = GameTag.SHOW_ENTITY_START)
        {
            var tags = entity.TagsHistory
                // When a minion is summoned from hand in combat, there is a SHOW_ENTITY node with the buffed value,
                // which includes the buffs from combat
                .TakeWhile(t => t.Name != (int)takeUntilTag)
                .Where(t => t.Name == (int)tag)
                .ToList();
            var tagInHand = tags.Count == 1
                ? tags[0].Value
                : tags
                    // Because the first value is the "default" value
                    // If the card in hand has no enchantments whatsoever, we should still have a "reset" at the end
                    .Skip(1)
                    .FirstOrDefault()?.Value;
            entity.SetTag(tag, tagInHand ?? entity.GetTag(tag, 0));
        }

        internal static BgsPlayerBoardEntity GetEntitySpawnedFromHand(int id, List<FullEntity> board, StateFacade StateFacade)
        {
            var entityInHand = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(id);
            var clone = entityInHand.Clone();

            // This seems to have changed with 29.2. Now, the entity is created in hand with its base values,
            // enchantments are reapplied, and a tag change occurs at the end with the new value
            // I don't have many data points yet, so there might be other tags to update, and there might be
            // circumstances in which this doesn't work (e.g. if multiple tags are applied)
            // ISSUE: if the buff is a buff that occurs in combat (and not a buff that happens on the setup phase),
            // it will still be detected
            OverrideTagWithHistory(clone, GameTag.HEALTH);
            OverrideTagWithHistory(clone, GameTag.ATK);
            OverrideTagWithHistory(clone, GameTag.LITERALLY_UNPLAYABLE);
            OverrideTagWithHistory(clone, GameTag.UNPLAYABLE_VISUALS);
            OverrideTagWithHistory(clone, GameTag.DIVINE_SHIELD);
            OverrideTagWithHistory(clone, GameTag.VENOMOUS);
            OverrideTagWithHistory(clone, GameTag.REBORN);
            OverrideTagWithHistory(clone, GameTag.TAUNT);

            var debug = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(1315);
            var enchantments = StateFacade.GsState.GameState.CurrentEntities.Values
                .Where(entity => entity.GetTag(GameTag.ATTACHED) == id)
                // Not sure why it can be REMOVEDFROMGAME
                //.Where(entity => entity.GetTag(GameTag.ZONE) != (int)Zone.REMOVEDFROMGAME)
                //.ToList();
                //var debug = StateFacade.GsState.GameState.CurrentEntities.Values
                //    .Where(entity => entity.GetTag(GameTag.ATTACHED) == id)
                .ToList();
            if (enchantments.Any(e => e.CardId == ExpeditionPlans_UnplayableEnchantment))
            {
                clone.SetTag(GameTag.UNPLAYABLE_VISUALS, 1);
            }
            clone
                .SetTag(GameTag.DAMAGE, 0)
                .SetTag(GameTag.ZONE, (int)Zone.HAND);

            var withEnchants = AddEchantments(StateFacade.GsState.GameState.CurrentEntities, clone, true);

            return withEnchants;
        }

        internal static int GetPlayerEnchantmentValue(int playerId, string enchantment, List<FullEntity> currentEntities, GameTag gameTag = GameTag.TAG_SCRIPT_DATA_NUM_1)
        {
            return currentEntities
                .Where(entity =>
                    entity.GetEffectiveController() == playerId &&
                    entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                    entity.CardId == enchantment)
                .FirstOrDefault()
                ?.GetTag(gameTag) ?? 0;
        }

        internal static Tuple<int, int> GetTupleEnchantmentValue(int playerId, string enchantment, List<FullEntity> currentEntities)
        {
            var ench = currentEntities
                .Where(entity =>
                    entity.GetEffectiveController() == playerId &&
                    entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY &&
                    entity.CardId == enchantment)
                .FirstOrDefault();
            return new Tuple<int, int>(ench?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0, ench?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2) ?? 0);
        }

        internal static int GetPlayerTag(int playerEntityId, GameTag tag, List<FullEntity> currentEntities)
        {
            return currentEntities.Find(e => e.Entity == playerEntityId)?.GetTag(tag, 0) ?? 0;
        }

        internal static BgsPlayerBoardEntity AddEchantments(Dictionary<int, FullEntity> currentEntities, FullEntity fullEntity, bool allowRemovedFromGame = false)
        {
            var debug = fullEntity.Id == 8608;
            // For some reason, Teron's RapidReanimation enchantment is sometimes in the GRAVEYARD zone
            List<Enchantment> enchantments = BuildEnchantments(currentEntities, fullEntity, allowRemovedFromGame);
            BgsPlayerBoardEntity result = new BgsPlayerBoardEntity()
            {
                CardId = fullEntity.CardId,
                Entity = fullEntity.Entity,
                Id = fullEntity.Id,
                Tags = fullEntity.GetTagsCopy(),
                TimeStamp = fullEntity.TimeStamp,
                Enchantments = enchantments,
                DynamicInfo = fullEntity.DynamicInfo,
            };
            return result;
        }

        private static List<Enchantment> BuildEnchantments(Dictionary<int, FullEntity> currentEntities, FullEntity fullEntity, bool allowRemovedFromGame = false)
        {
            var debug = fullEntity.Entity == 14064;
            var enchantmentEntities = BuildEnchantmentEntities(currentEntities, fullEntity, allowRemovedFromGame);
            var enchantments = enchantmentEntities
                .Select(entity => new Enchantment
                {
                    EntityId = entity.Id,
                    CardId = entity.CardId,
                    TagScriptDataNum1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1),
                    TagScriptDataNum2 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2),
                })
                .ToList();
            List<Enchantment> additionalEnchantments = BuildAdditionalEnchantments(fullEntity, enchantmentEntities, currentEntities);
            enchantments.AddRange(additionalEnchantments);
            return enchantments;
        }

        private static List<FullEntity> BuildEnchantmentEntities(Dictionary<int, FullEntity> currentEntities, FullEntity fullEntity, bool allowRemovedFromGame = false)
        {
            if (fullEntity == null)
            {
                return new List<FullEntity>();
            }

            var debug = fullEntity.Id == 12471;
            var enchantmentEntities = currentEntities.Values
                .Where(entity => entity.GetTag(GameTag.ATTACHED) == fullEntity.Id
                    && (allowRemovedFromGame || entity.GetTag(GameTag.ZONE) != (int)Zone.REMOVEDFROMGAME))
                .ToList();
            // Recursive enchantments in case of magnetic
            var newEnchantEntities = new List<FullEntity>();
            foreach (var enchant in enchantmentEntities)
            {
                if (enchant.GetTag(GameTag.MAGNETIC) == 1)
                {
                    var subEnchants = BuildEnchantmentEntities(currentEntities, currentEntities.GetValueOrDefault(enchant.GetTag(GameTag.CREATOR)), allowRemovedFromGame)
                        .Where(e => e.GetTag(GameTag.MAGNETIC) == 1)
                        .ToList();
                    newEnchantEntities.AddRange(subEnchants);
                }
            }
            enchantmentEntities.AddRange(newEnchantEntities);
            return enchantmentEntities;
        }

        internal class PlayerBoard
        {
            public FullEntity Hero { get; set; }
            public List<BgsHeroPower> HeroPowers { get; set; }
            public string HeroPowerCardId { get; set; }
            public int HeroPowerEntityId { get; set; }
            public bool HeroPowerUsed { get; set; }
            public dynamic HeroPowerInfo { get; set; }
            // Used for Tavish damage for instance
            public int HeroPowerInfo2 { get; set; }
            public string HeroPowerCreatedEntity { get; set; }
            public string CardId { get; set; }
            public int PlayerId { get; set; }
            public int PlayerEntityId { get; set; }
            public List<QuestEntity> QuestEntities { get; set; }
            public List<string> QuestRewards { get; set; }
            public List<QuestReward> QuestRewardEntities { get; set; }
            public List<BgsPlayerBoardEntity> Board { get; set; }
            public List<FullEntity> Secrets { get; set; }
            public List<TrinketEntity> Trinkets { get; set; }
            public List<BgsPlayerBoardEntity> Hand { get; set; }
            public BgsPlayerGlobalInfo GlobalInfo { get; set; }
        }

        internal class BgsHeroPower
        {
            public string CardId { get; set; }
            public int EntityId { get; set; }
            public bool Used { get; set; }
            public dynamic Info { get; set; }
            public int Info2 { get; set; }
            public int Info3 { get; set; }
            public int Info4 { get; set; }
            public int Info5 { get; set; }
            public int Info6 { get; set; }
            public int ScoreValue1 { get; set; }
            public int ScoreValue2 { get; set; }
            public int ScoreValue3 { get; set; }
            public int Locked { get; set; }
            public string CreatedEntity { get; set; }
        }

        internal class BgsPlayerBoardEntity
        {
            public string CardId;
            public int Entity;
            public int Id;
            public List<Tag> Tags;
            public DateTime TimeStamp;
            public List<Enchantment> Enchantments;
            public List<object> DynamicInfo;
        }

        public class BgsPlayerGlobalInfo
        {
            public int EternalKnightsDeadThisGame { get; set; }
            public int TavernSpellsCastThisGame { get; set; }
            public int SpellsCastThisGame { get; set; }
            public int PiratesPlayedThisGame { get; set; }
            public int PiratesSummonedThisGame { get; set; }
            public int BeastsSummonedThisGame { get; set; }
            public int UndeadAttackBonus { get; set; }
            public int HauntedCarapaceAttackBonus { get; set; }
            public int HauntedCarapaceHealthBonus { get; set; }
            public int FrostlingBonus { get; set; }
            public int AstralAutomatonsSummonedThisGame { get; set; }
            public int BloodGemAttackBonus { get; set; }
            public int BloodGemHealthBonus { get; set; }
            public int ChoralHealthBuff { get; set; }
            public int ChoralAttackBuff { get; set; }
            public int BeetleAttackBuff { get; set; }
            public int BeetleHealthBuff { get; set; }
            public int ElementalHealthBuff { get; set; }
            public int ElementalAttackBuff { get; set; }
            public int TavernSpellHealthBuff { get; set; }
            public int TavernSpellAttackBuff { get; set; }
            public int BattlecriesTriggeredThisGame { get; set; }
            public int FriendlyMinionsDeadLastCombat { get; set; }
            public int MagnetizedThisGame { get; set; }
            public int SanlaynScribesDeadThisGame { get; set; }
            public int GoldSpentThisGame { get; set; }
            public int GoldrinnBuffAtk { get; set; }
            public int GoldrinnBuffHealth { get; set; }
            public int DeepBluesPlayed { get; set; }
            public int VolumizerAttackBuff { get; set; }
            public int VolumizerHealthBuff { get; set; }
            public int WhelpAttackBuff { get; set; }
            public int WhelpHealthBuff { get; set; }

        }

        internal class QuestReward
        {
            public string CardId;
            public int AvengeCurrent;
            public int AvengeDefault;
            public int ScriptDataNum1;
        }

        internal class QuestEntity
        {
            public string CardId;
            public int RewardDbfId;
            public int ProgressCurrent;
            public int ProgressTotal;
        }

        public class TrinketEntity
        {
            public string cardId;
            public int entityId;
            public int scriptDataNum1;
            public int scriptDataNum2;
            public int scriptDataNum6;
        }
    }
}

