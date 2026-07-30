using HearthstoneReplays.Parser;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using static HearthstoneReplays.Events.Parsers.BattlegroundsPlayerBoardParser;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsActivePlayerBoardParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }
        private BattlegroundsStartOfBattleLegacySnapshot Snapshot;

        public BattlegroundsActivePlayerBoardParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
            this.Snapshot = new BattlegroundsStartOfBattleLegacySnapshot(ParserState, helper);
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.GameState && IsApplyOnNewNode(node);
        }

        public bool IsApplyOnNewNode(Node node)
        {
            return StateFacade.IsBattlegroundsDuos()
                    && node.Type == typeof(TagChange)
                    // Seems to happen a bit too frequently
                    && (node.Object as TagChange).Name == (int)GameTag.STEP
                    && (node.Object as TagChange).Value == (int)Step.MAIN_END
                    && GameState.GetGameEntity().GetTag(GameTag.BOARD_VISUAL_STATE) < 2;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var opponent = StateFacade.OpponentPlayer;
            var player = StateFacade.LocalPlayer;

            // This event is in fact only used to give the app a timing to snapshot the teams
            //var playerBoard = BattlegroundsPlayerBoardParser.CreateProviderFromAction(player.PlayerId, player.Id, false, player, GameState, StateFacade);

            GameState.BgsHasSentNextOpponent = false;

            var result = new List<GameEventProvider>();
            result.Add(GameEventProvider.Create(
                tagChange.TimeStamp,
                "BATTLEGROUNDS_ACTIVE_PLAYER_BOARD",
                () => new GameEvent
                {
                    Type = "BATTLEGROUNDS_ACTIVE_PLAYER_BOARD",
                    Value = new
                    {
                        //PlayerBoard = playerBoard,
                    }
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

        internal static PlayerBoard CreateProviderFromAction(Player player, bool isOpponent, Player mainPlayer, GameState GameState, StateFacade StateFacade)
        {
            var potentialHeroes = GameState.CurrentEntities.Values
                .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                // Here we accept to face the ghost
                .Where(entity => !!entity.IsBaconBartender() && entity.CardId != BaconphheroHeroic)
                .ToList();
            var hero = potentialHeroes.FirstOrDefault()?.Clone();
            var cardId = hero?.CardId;
            int playerId = hero?.GetTag(GameTag.PLAYER_ID) ?? player.PlayerId;
            var currentEntities = GameState.CurrentEntities.Values.ToList();

            if (hero == null || hero.IsBaconGhost() || hero?.GetTag(GameTag.BACON_BOB_SKIN) == 1)
            {
                // Finding the one that is flagged as the player's NEXT_OPPONENT
                var playerEntity = currentEntities
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity => entity.GetEffectiveController() == mainPlayer.PlayerId)
                    .Where(entity => !entity.IsBaconBartender()
                        && !entity.IsBaconGhost()
                        && !entity.IsBaconEnchantment())
                    .OrderBy(entity => entity.Id)
                    .LastOrDefault();
                var nextOpponentPlayerId = playerEntity.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);

                var nextOpponentCandidates = currentEntities
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                    .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == nextOpponentPlayerId)
                    .Where(entity => !entity.IsBaconBartender()
                        && !entity.IsBaconGhost()
                        && !entity.IsBaconEnchantment())
                    .ToList();
                var nextOpponent = nextOpponentCandidates == null || nextOpponentCandidates.Count == 0 ? null : nextOpponentCandidates[0];

                hero = nextOpponent;
                cardId = nextOpponent?.CardId;
                playerId = nextOpponent?.GetTag(GameTag.PLAYER_ID) ?? playerId;
            }

            // Happens in the first encounter
            if (cardId == null)
            {
                var activePlayer = GameState.CurrentEntities[StateFacade.LocalPlayer.Id];
                var opponentPlayerId = activePlayer.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);
                hero = currentEntities
                    .Where(data => data.GetTag(GameTag.PLAYER_ID) == opponentPlayerId)
                    .FirstOrDefault()
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
                    .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                    // Because when the opponent is the ghost, we don't always know which ones are actually attached to it
                    // Also, when reconnecting, we sometimes get artifacts for the opponent's board, so restricting the list
                    // to the ones who only just appeared removes a lot of issues
                    .Where(entity => isOpponent ? entity.GetTag(GameTag.NUM_TURNS_IN_PLAY) <= 1 : true)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity => entity.TakesBoardSpace())
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .Select(entity => entity.Clone())
                    .Select(entity => EnhanceEntities(entity, GameState, StateFacade))
                    .ToList();
                var secrets = currentEntities
                    .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.SECRET)
                    .Where(entity => entity.GetTag(GameTag.BACON_IS_BOB_QUEST) != 1)
                    .Where(entity => entity.GetTag(GameTag.QUEST) != 1)
                    .Where(entity => entity.GetTag(GameTag.SIDE_QUEST) != 1)
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .Select(entity => entity.Clone())
                    .Select(entity => BuildEntityWithCardIdFromTheFuture(entity, StateFacade.GsState.GameState))
                    .ToList();
                var hand = currentEntities
                    .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.HAND)
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .Select(entity => entity.Clone())
                    .ToList();
                if (isOpponent)
                {
                    // Look for all the cards that are in hand at the start of the fight, and that are "copied" by bassgil
                    // We can't use the final stats as they are, as it would include damage + stats change over the course of
                    // the fight
                    // We might be able to simply remove the damage, and use the buffed stats as the base stats. It won't be 
                    // perfect, but probably good enough
                    var boardCardIds = board.Select(e => e.CardId).ToList();
                    var handEntityIds = hand.Select(e => e.Id).ToList();
                    var revealedHand = hand
                        .Select(e => GetEntitySpawnedFromHand(e.Id, board, StateFacade) ?? e)
                        .Select(e => e.SetTag(GameTag.DAMAGE, 0).SetTag(GameTag.ZONE, (int)Zone.HAND) as FullEntity)
                        .ToList();
                    //var debugEntity = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(5425);
                    //var debugEntityOrigin = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(5425);
                    //var debugEntityOriginHealth = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(5425)?.TagsHistory
                    //    .Where(t => t.Name == (int)GameTag.HEALTH)
                    //    .ToList();
                    //var debugEntityOriginHealth2 = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(5425)?.TagsHistory
                    //    .TakeWhile(t => t.Name != (int)GameTag.SHOW_ENTITY_START)
                    //    .Where(t => t.Name == (int)GameTag.HEALTH)
                    //    .ToList();
                    //var debugEntityOriginHealth2 = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(5425)?.TagsHistory
                    //    .TakeWhile(t => t.Name != (int)GameTag.SHOW_ENTITY_START)
                    //    .Where(t => t.Name == (int)GameTag.HEALTH)
                    //    .ToList();
                    hand = revealedHand;
                }
                //var debug = currentEntities
                //    .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                //    .ToList();
                var heroPower = currentEntities
                    .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO_POWER)
                    .Select(entity => entity.Clone())
                    .FirstOrDefault();
                if (heroPower == null)
                {
                    Logger.Log("WARNING: could not find hero power", "");
                }
                var heroPowerUsed = heroPower?.GetTag(GameTag.BACON_HERO_POWER_ACTIVATED) == 1;
                string heroPowerCreatedEntity = null;
                var finalBoard = board.Select(entity => AddEchantments(GameState.CurrentEntities, entity)).ToList();
                if (finalBoard.Count > 7)
                {
                    Logger.Log("Too many entities on board", "");
                }

                var questRewardRawEntities = currentEntities
                    .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.BATTLEGROUND_QUEST_REWARD)
                    .Select(entity => entity.Clone())
                    .ToList();
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
                    .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.SECRET)
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.SPELL)
                    .Where(entity => entity.GetTag(GameTag.QUEST) == 1)
                    .Select(entity => new QuestEntity
                    {
                        CardId = entity.CardId,
                        RewardDbfId = entity.GetTag(GameTag.QUEST_REWARD_DATABASE_ID, 0),
                        ProgressCurrent = entity.GetTag(GameTag.QUEST_PROGRESS, 0),
                        ProgressTotal = entity.GetTag(GameTag.QUEST_PROGRESS_TOTAL, 0),
                    })
                    .ToList();

                var eternalKnightBonus = GetPlayerEnchantmentValue(player.PlayerId, CardIds.EternalKnightPlayerEnchantEnchantment, GameState);
                var tavernSpellsCastThisGame = GameState.CurrentEntities[player.Id]?.GetTag(GameTag.TAVERN_SPELLS_PLAYED_THIS_GAME, 0) ?? 0;
                var spellsCastThisGame = GameState.CurrentEntities[player.Id]?.GetTag(GameTag.NUM_SPELLS_PLAYED_THIS_GAME, 0) ?? 0;
                // Includes Anub'arak, Nerubian Deathswarmer
                var undeadAttackBonus = GetPlayerEnchantmentValue(player.PlayerId, CardIds.UndeadBonusAttackPlayerEnchantDntEnchantment, GameState);
                var hauntedCarapaceAttackBonus = GetPlayerEnchantmentValue(player.PlayerId, CardIds.HauntedCarapacePlayerEnchantDntEnchantment_BG33_112pe, GameState);
                var hauntedCarapaceHealthBonus = GetPlayerEnchantmentValue(player.PlayerId, CardIds.HauntedCarapacePlayerEnchantDntEnchantment_BG33_112pe, GameState, GameTag.TAG_SCRIPT_DATA_NUM_2);
                var goldrinnBuffAtk = GetPlayerEnchantmentValue(player.PlayerId, CardIds.GoldrinnPlayerEnchantEnchantment_BGS_018pe, GameState);
                var goldrinnBuffHealth = GetPlayerEnchantmentValue(player.PlayerId, CardIds.GoldrinnPlayerEnchantEnchantment_BGS_018pe, GameState, GameTag.TAG_SCRIPT_DATA_NUM_2);
                // Looks like the enchantment isn't used anymore, at least for the opponent?
                var frostlingBonus = GetPlayerTag(player.Id, GameTag.BACON_ELEMENTALS_PLAYED_THIS_GAME, GameState);
                var piratesPlayedThisGame = GetPlayerTag(player.Id, GameTag.BACON_PIRATES_PLAYED_THIS_GAME, GameState);
                var piratesSummonedThisGame = GetPlayerTag(player.Id, GameTag.BACON_PIRATES_SUMMONED_THIS_GAME, GameState);
                var beastsSummonedThisGame = GetPlayerTag(player.Id, GameTag.BACON_BEASTS_SUMMONED_THIS_GAME, GameState);
                var magnetizedThisGame = GetPlayerTag(player.Id, GameTag.BACON_NUM_MAGNETIZE_THIS_GAME, GameState);
                var astralAutomatonBonus = GetPlayerEnchantmentValue(player.PlayerId, CardIds.AstralAutomatonPlayerEnchantDntEnchantment_BG_TTN_401pe, GameState);
                var bloodGemEnchant = currentEntities
                    .Where(entity => entity.GetEffectiveController() == player.PlayerId)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity => entity.CardId == CardIds.BloodGemPlayerEnchantEnchantment)
                    .FirstOrDefault();
                var bloodGemAttackBonus = bloodGemEnchant?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0) ?? 0;
                var bloodGemHealthBonus = bloodGemEnchant?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0) ?? 0;
                var choralEnchantments = StateFacade.GsState.GameState.CurrentEntities.Values
                    .Where(e => e.CardId == CardIds.ChoralMrrrglr_ChorusEnchantment)
                    .Where(e => board.Select(b => b.Id).Contains(e.GetTag(GameTag.ATTACHED)));
                var choralEnchantment = choralEnchantments.FirstOrDefault();
                var choralSource = choralEnchantment == null ? null : GameState.CurrentEntities.GetValueOrDefault(choralEnchantment.GetTag(GameTag.ATTACHED));
                var isChoralPremium = choralSource?.GetTag(GameTag.PREMIUM) == 1;
                var beetleArmy = GetTupleEnchantmentValue(playerId, CardIds.BeetleArmyPlayerEnchantDntEnchantment_BG31_808pe, currentEntities);
                var sanlaynScribesDeadThisGame = GetTupleEnchantmentValue(playerId, CardIds.SanlaynScribePlayerEnchantDntEnchantment_BGDUO31_208pe, currentEntities);
                var battlecriesTriggeredThisGame = GetPlayerTag(player.Id, GameTag.BATTLECRIES_TRIGGERED_THIS_GAME, GameState);
                var friendlyMinionsDeadLastCombat = GetPlayerTag(player.Id, GameTag.NUM_FRIENDLY_MINIONS_THAT_DIED_LAST_TURN, GameState);
                var elementalHealthBuff = GetPlayerTag(player.Id, GameTag.BACON_ELEMENTAL_BUFFHEALTHVALUE, GameState);
                var elementalAttackBuff = GetPlayerTag(player.Id, GameTag.BACON_ELEMENTAL_BUFFATKVALUE, GameState);
                var tavernSpellHealthBuff = GetPlayerTag(player.Id, GameTag.TAVERN_SPELL_HEALTH_INCREASE, GameState);
                var tavernSpellAttackBuff = GetPlayerTag(player.Id, GameTag.TAVERN_SPELL_ATTACK_INCREASE, GameState);
                var goldSpentThisGame = GetPlayerTag(player.Id, GameTag.NUM_RESOURCES_SPENT_THIS_GAME, GameState);
                var deepBluesPlayed = GetPlayerEnchantmentValue(player.Id, CardIds.DeepBlueCroonerPlayerEnchantDntEnchantment, GameState);
                var volumizerAttackBuff = GetPlayerTag(player.Id, GameTag.BACON_VOLUMIZER_ATTACK_BUFF, GameState);
                var volumizerHealthBuff = GetPlayerTag(player.Id, GameTag.BACON_VOLUMIZER_HEALTH_BUFF, GameState);
                var whelpAttackBuff = GetPlayerEnchantmentValue(player.Id, CardIds.WhelpBuffPlayerEnchantDntEnchantment_BG34_402pe, GameState);
                var whelpHealthBuff = GetPlayerEnchantmentValue(player.Id, CardIds.WhelpBuffPlayerEnchantDntEnchantment_BG34_402pe, GameState, GameTag.TAG_SCRIPT_DATA_NUM_2);

                var trinkets = BattlegroundsPlayerBoardParser.BuildTrinkets(player.PlayerId, GameState);

                // String or int
                dynamic heroPowerInfo = heroPower?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? 0;
                var heroPowerInfo2 = heroPower?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2) ?? 0;
                if (heroPowerUsed && heroPower?.CardId == CardIds.EmbraceYourRage && heroPowerInfo == -1)
                {
                    var createdEntity = StateFacade.GsState.GameState.CurrentEntities.Values
                        .Where(e => e.GetTag(GameTag.CREATOR) == heroPower.Entity)
                        .Where(e => e.GetCardType() == (int)CardType.MINION)
                        .Reverse()
                        .FirstOrDefault();
                    heroPowerInfo = createdEntity?.CardId;
                }

                return new PlayerBoard()
                {
                    Hero = hero,
                    HeroPowerCardId = heroPower?.CardId,
                    HeroPowerUsed = heroPowerUsed,
                    HeroPowerInfo = heroPowerInfo,
                    HeroPowerInfo2 = heroPowerInfo2,
                    HeroPowerCreatedEntity = heroPowerCreatedEntity,
                    CardId = cardId,
                    PlayerId = playerId,
                    Board = finalBoard,
                    QuestEntities = questEntities,
                    QuestRewards = questRewards,
                    QuestRewardEntities = questRewardEntities,
                    Secrets = secrets,
                    Hand = hand,
                    Trinkets = trinkets,
                    GlobalInfo = new BgsPlayerGlobalInfo()
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
                        // TODO: always show the base version, even for golden
                        // Update 25-08-08: not sure what this comment is about, as it seems to include the total
                        // stats (so double for golden)
                        // Update 2025-08-20: fix this to include always the base, so that it works with golden + non-golden
                        ChoralAttackBuff = (choralEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0) ?? 0) / (isChoralPremium ? 2 : 1),
                        ChoralHealthBuff = (choralEnchantment?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0) ?? 0) / (isChoralPremium ? 2 : 1),
                        BeetleAttackBuff = beetleArmy.Item1,
                        BeetleHealthBuff = beetleArmy.Item2,
                        ElementalHealthBuff = elementalHealthBuff,
                        ElementalAttackBuff = elementalAttackBuff,
                        TavernSpellHealthBuff = tavernSpellHealthBuff,
                        TavernSpellAttackBuff = tavernSpellAttackBuff, 
                        BattlecriesTriggeredThisGame = battlecriesTriggeredThisGame,
                        FriendlyMinionsDeadLastCombat = friendlyMinionsDeadLastCombat,
                        SpellsCastThisGame = spellsCastThisGame,
                        SanlaynScribesDeadThisGame = sanlaynScribesDeadThisGame?.Item1 ?? 0,
                        GoldSpentThisGame = goldSpentThisGame,
                        GoldrinnBuffAtk = goldrinnBuffAtk,
                        GoldrinnBuffHealth = goldrinnBuffHealth,
                        DeepBluesPlayed = deepBluesPlayed,
                        VolumizerAttackBuff = volumizerAttackBuff,
                        VolumizerHealthBuff = volumizerHealthBuff,
                        WhelpAttackBuff = whelpAttackBuff,
                        WhelpHealthBuff = whelpHealthBuff,
                    }
                };
            }
            return null;
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

        internal static FullEntity EnhanceLovesickBalladist(FullEntity entity, StateFacade StateFacade)
        {
            var buffEnchantmentValue = StateFacade.GsState.Replay.Games[StateFacade.GsState.Replay.Games.Count - 1]
                .FilterGameData(typeof(ShowEntity))
                .Select(d => d as ShowEntity)
                .Where(e => e.GetCardType() == (int)CardType.ENCHANTMENT)
                .Where(e => e.GetTag(GameTag.ATTACHED) > 0)
                .Where(e => e.GetTag(GameTag.CREATOR) == entity.Id)
                .Select(e => e.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1))
                // Make sure to take the last one so we are not polluted by values from previous fights
                .LastOrDefault();
            if (buffEnchantmentValue > 0)
            {
                var baseVale = entity.CardId == LovesickBalladist_BG26_814
                    ? buffEnchantmentValue
                    : buffEnchantmentValue / 2;
                entity.SetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, baseVale);
            }
            return entity;
        }

        private static void OverrideTagWithHistory(FullEntity entity, GameTag tag)
        {
            var tags = entity.TagsHistory
                // When a minion is summoned from hand in combat, there is a SHOW_ENTITY node with the buffed value,
                // which includes the buffs from combat
                .TakeWhile(t => t.Name != (int)GameTag.SHOW_ENTITY_START)
                .Where(t => t.Name == (int)tag)
                .ToList();
            var tagInHand = tags.Count == 1
                ? tags[0].Value
                : tags
                    // Because the first value is the "default" value
                    // If the card in hand has no enchantments whatsoever, we should still have a "reset" at the end
                    .Skip(1)
                    .FirstOrDefault()?.Value;
            entity.SetTag(tag, tagInHand ?? entity.GetTag(tag));
        }

        internal static FullEntity GetEntitySpawnedFromHand(int id, List<FullEntity> board, StateFacade StateFacade)
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

            return clone;
        }

        internal static int GetPlayerEnchantmentValue(int playerId, string enchantment, GameState GameState, GameTag gameTag = GameTag.TAG_SCRIPT_DATA_NUM_1)
        {
            return GameState.CurrentEntities.Values
                .Where(entity => entity.GetEffectiveController() == playerId)
                .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                .Where(entity => entity.CardId == enchantment)
                .FirstOrDefault()
                ?.GetTag(gameTag) ?? 0;
        }

        internal static int GetPlayerTag(int playerEntityId, GameTag tag, GameState GameState)
        {
            return GameState.CurrentEntities.GetValueOrDefault(playerEntityId)?.GetTag(tag, 0) ?? 0;
        }

        internal static object AddEchantments(Dictionary<int, FullEntity> currentEntities, FullEntity fullEntity)
        {
            var debug = fullEntity.Id == 8608;
            // For some reason, Teron's RapidReanimation enchantment is sometimes in the GRAVEYARD zone
            var enchantmentEntities = currentEntities.Values
                .Where(entity => entity.GetTag(GameTag.ATTACHED) == fullEntity.Id)
                .Where(entity => entity.GetTag(GameTag.ZONE) != (int)Zone.REMOVEDFROMGAME)
                .ToList();
            var enchantments = enchantmentEntities
                .Select(entity => new Enchantment
                {
                    EntityId = entity.Id,
                    CardId = entity.CardId,
                    TagScriptDataNum1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1),
                    TagScriptDataNum2 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2),
                })
                .ToList();
            List<Enchantment> additionalEnchantments = BuildAdditionalEnchantments(fullEntity, enchantmentEntities, currentEntities); ;
            enchantments.AddRange(additionalEnchantments);
            dynamic result = new
            {
                CardId = fullEntity.CardId,
                Entity = fullEntity.Entity,
                Id = fullEntity.Id,
                Tags = fullEntity.GetTagsCopy(),
                TimeStamp = fullEntity.TimeStamp,
                Enchantments = enchantments,
            };
            return result;
        }

        internal static List<Enchantment> BuildAdditionalEnchantments(FullEntity fullEntity, List<FullEntity> enchantmentEntities, Dictionary<int, FullEntity> currentEntities)
        {
            return enchantmentEntities
                .Where(e => e.CardId == PolarizingBeatboxer_PolarizedEnchantment || e.CardId == ClunkerJunker_ClunkyEnchantment_BG29_503e)
                .Select(e =>
                {
                    // Sometimes the creator doesn't appear in the logs, we only have the entityId
                    var entityAsEnchantmentDbfId = currentEntities
                        .GetValueOrDefault(e.GetTag(GameTag.CREATOR))
                        ?.GetTag(GameTag.ENTITY_AS_ENCHANTMENT);
                    return new Enchantment
                    {
                        CardId = "" + (entityAsEnchantmentDbfId ?? e.GetTag(GameTag.CREATOR_DBID)),
                        EntityId = e.GetTag(GameTag.CREATOR),
                    };
                })
                .ToList();
        }

        internal class Enchantment
        {
            public int EntityId;
            public string CardId;
            public int TagScriptDataNum1;
            public int TagScriptDataNum2;
        }

        internal class PlayerBoard
        {
            public FullEntity Hero { get; set; }
            public string HeroPowerCardId { get; set; }
            public bool HeroPowerUsed { get; set; }
            public dynamic HeroPowerInfo { get; set; }
            // Used for Tavish damage for instance
            public int HeroPowerInfo2 { get; set; }
            public string HeroPowerCreatedEntity { get; set; }
            public string CardId { get; set; }
            public int PlayerId { get; set; }
            public List<QuestEntity> QuestEntities { get; set; }
            public List<string> QuestRewards { get; set; }
            public List<QuestReward> QuestRewardEntities { get; set; }
            public List<object> Board { get; set; }
            public List<FullEntity> Secrets { get; set; }
            public List<FullEntity> Hand { get; set; }
            public List<TrinketEntity> Trinkets { get; set; }
            public BgsPlayerGlobalInfo GlobalInfo { get; set; }
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
    }
}

