using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using System.Linq;
using static HearthstoneReplays.Events.CardIds;

namespace HearthstoneReplays.Events.Parsers
{
    public class ReceiveCardInHandParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public ReceiveCardInHandParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ZONE
                && (node.Object as TagChange).Value == (int)Zone.HAND
                && GameState.CurrentEntities.ContainsKey((node.Object as TagChange).Entity)
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.ZONE) != (int)Zone.DECK;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var appliesToShowEntity = node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.HAND
                && (!GameState.CurrentEntities.ContainsKey((node.Object as ShowEntity).Entity)
                    || (GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE) != (int)Zone.DECK
                        && GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE) != (int)Zone.HAND));
            var appliesToFullEntity = node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.HAND
                && (!GameState.CurrentEntities.ContainsKey((node.Object as FullEntity).Id)
                    || (GameState.CurrentEntities[(node.Object as FullEntity).Id].GetTag(GameTag.ZONE) != (int)Zone.DECK
                        && GameState.CurrentEntities[(node.Object as FullEntity).Id].GetTag(GameTag.ZONE) != (int)Zone.HAND));
            return stateType == StateType.PowerTaskList
                && (appliesToShowEntity || appliesToFullEntity);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            var creator = Oracle.FindCardCreator(GameState, entity, node);
            List<Tag> guessedTags = null;
            if (creator?.Item2 != null && (cardId == null || cardId == ""))
            {
                cardId = Oracle.PredictCardId(GameState, creator?.Item1, creator?.Item2 ?? -1, node, null, StateFacade, tagChange.Entity);
                guessedTags = Oracle.GuessTags(GameState, creator?.Item1, creator?.Item2 ?? -1, node, null, StateFacade);
            }

            var creatorEntity = GameState.CurrentEntities.GetValueOrDefault(creator?.Item2 ?? -1);
            int? createdIndex = null;
            int? creatorZone = null;
            List<Tag> creatorTags = null;
            if (creatorEntity != null)
            {
                createdIndex = creatorEntity.CreatedIndex;
                creatorEntity.CreatedIndex++;
                creatorZone = creatorEntity.GetZone();
                creatorTags = creatorEntity.GetTagsCopy();
            }

            // This is different from the creator. A card can be created by Rangari Scout, played, then sent back to hand
            // by Youthful Brewmaster. In that case, the creator is still Rangari Scout but the last influenced by is Youthful Brewmaster.
            var lastInfluencedByCardId = GameState.CurrentEntities.GetValueOrDefault((node.Parent?.Object as Action)?.Entity ?? -1)?.CardId ?? creator?.Item1;
            entity.PlayedWhileInHand.Clear();
            var position = entity.GetZonePosition();

            // For Bottled Shadeleaf / Bottled Springwater: excess = spellAmount - amountDealt. Tag 1068 is not reliable.
            var excessAmount = GetExcessAmountFromCreatorBlock(node, creator?.Item1, creator?.Item2 ?? -1);

            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "RECEIVE_CARD_IN_HAND",
                GameEvent.CreateProvider(
                    "RECEIVE_CARD_IN_HAND",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                        new {
                        CreatorCardId = creator?.Item1, // Used when there is no cardId, so we can show at least the card that created it
                        CreatorEntityId = creator?.Item2,
                        CreatedIndex = createdIndex,
                        CreatorZone = creatorZone,
                        CreatorTags = creatorTags,
                        LastInfluencedByCardId = lastInfluencedByCardId,
                        IsPremium = entity.GetTag(GameTag.PREMIUM) == 1,
                        Position = position,
                        GuessedTags = guessedTags,
                        Tags = entity.GetTagsCopy(),
                        StoredAmount = excessAmount,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Type == typeof(ShowEntity))
            {
                return CreateEventFromShowEntity(node);
            }
            else if (node.Type == typeof(FullEntity))
            {
                return CreateEventFromFullEntity(node);
            }
            return null;
        }

        private List<GameEventProvider> CreateEventFromShowEntity(Node node)
        {
            ShowEntity showEntity = node.Object as ShowEntity;
            //Logger.Log("Will add creator " + showEntity.GetTag(GameTag.CREATOR) + " //" + showEntity.GetTag(GameTag.DISPLAYED_CREATOR), "");
            var creator = Oracle.FindCardCreatorCardId(GameState, showEntity, node);
            var creatorEntity = GameState.CurrentEntities.GetValueOrDefault(creator?.Item2 ?? -1);
            int? createdIndex = null;
            int? creatorZone = null;
            List<Tag> creatorTags = null;
            if (creatorEntity != null)
            {
                createdIndex = creatorEntity.CreatedIndex;
                creatorEntity.CreatedIndex++;
                creatorZone = creatorEntity.GetZone();
                creatorTags = creatorEntity.GetTagsCopy();
            }
            //var creatorEntityId = Oracle.FindCardCreatorEntityId(GameState, showEntity, node);
            var cardId = Oracle.PredictCardId(GameState, creator.Item1, creator.Item2, node, showEntity.CardId);
            var controllerId = showEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
            var entity = GameState.CurrentEntities[showEntity.Entity];
            entity.PlayedWhileInHand.Clear();
            var dataNum1 = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
            var dataNum2 = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2);
            var position = showEntity.GetZonePosition();

            var lastInfluencedBy = Oracle.FindParentEntity(GameState, node);
            var lastInfluencedByCardId = lastInfluencedBy != null ? lastInfluencedBy?.Item1 : creator?.Item1;
            var excessAmount = GetExcessAmountFromCreatorBlock(node, creator?.Item1, creator?.Item2 ?? -1);
            // Oracle.PredictCardId(GameState, creatorCardId, creatorEntityId, node, showEntity.CardId);
            return new List<GameEventProvider> { GameEventProvider.Create(
                    showEntity.TimeStamp,
                    "RECEIVE_CARD_IN_HAND",
                    GameEvent.CreateProvider(
                        "RECEIVE_CARD_IN_HAND",
                        cardId,
                        controllerId,
                        showEntity.Entity,
                        StateFacade,
                        //gameState,
                        new {
                            CreatorCardId = creator?.Item1, // Used when there is no cardId, so we can show at least the card that created it
                            CreatorEntityId = creator?.Item2,
                            CreatedIndex = createdIndex,
                            CreatorZone = creatorZone,
                            CreatorTags = creatorTags,
                            LastInfluencedByCardId = lastInfluencedByCardId,
                            IsPremium = entity.GetTag(GameTag.PREMIUM) == 1 || showEntity.GetTag(GameTag.PREMIUM) == 1,
                            DataNum1 = dataNum1,
                            DataNum2 = dataNum2,
                            Position = position,
                            Tags = entity.GetTagsCopy(),
                            StoredAmount = excessAmount,
                        }),
                    true,
                    node) };
        }

        private List<GameEventProvider> CreateEventFromFullEntity(Node node)
        {
            FullEntity fullEntity = node.Object as FullEntity;
            var controllerId = fullEntity.GetEffectiveController();
            var previousZone = 0;
            if (GameState.CurrentEntities.ContainsKey(fullEntity.Id))
            {
                previousZone = GameState.CurrentEntities[fullEntity.Id].GetTag(GameTag.ZONE);
                GameState.CurrentEntities[fullEntity.Id].PlayedWhileInHand.Clear();
            }

            Action parentAction = null;
            if (node.Parent?.Type == typeof(Action))
            {
                parentAction = node.Parent.Object as Action;
            }

            // For Nagaling
            int? additionalPlayInfo = null;
            if (fullEntity.GetTag(GameTag.ADDITIONAL_PLAY_REQS_1) != -1)
            {
                additionalPlayInfo = fullEntity.GetTag(GameTag.ADDITIONAL_PLAY_REQS_1);
            }

            // For minion sandwich
            List<string> referencedCardIds = new List<string>();
            if (fullEntity.CardId == CardIds.TheRyecleaver_MinionSandwichToken_VAC_525t2)
            {
                if (parentAction != null)
                {
                    var parentEntity = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
                    if (parentEntity != null)
                    {
                        var sandwichedMinions = parentAction.Data
                            .Where(d => d is TagChange)
                            .Select(d => d as TagChange)
                            .Where(t => t.Name == (int)GameTag.ZONE && t.Value == (int)Zone.SETASIDE)
                            .Select(t => GameState.CurrentEntities.GetValueOrDefault(t.Entity))
                            .Where(e => e?.GetCardType() == (int)CardType.MINION)
                            .Select(e => e.CardId)
                            .ToList();
                        referencedCardIds = sandwichedMinions;
                    }
                }
            }

            var dataNum1 = fullEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
            var dataNum2 = fullEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2);
            var position = fullEntity.GetZonePosition();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                    fullEntity.TimeStamp,
                    "RECEIVE_CARD_IN_HAND",
                    () => {
                        // We do it here because of Diligent Notetaker - we have to know the last
                        // card played before assigning anything
                        var creator = Oracle.FindCardCreator(GameState, fullEntity, node);
                        var creatorEntity = GameState.CurrentEntities.GetValueOrDefault(creator?.Item2 ?? -1);
                        int? createdIndex = null;
                        int? creatorZone = null;
                        List<Tag> creatorTags = null;
                        if (creatorEntity != null)
                        {
                            createdIndex = creatorEntity.CreatedIndex;
                            creatorEntity.CreatedIndex++;
                            creatorZone = creatorEntity.GetZone();
                            creatorTags = creatorEntity.GetTagsCopy();
                        }

                        var creatorCardId = creator?.Item1;
                        var creatorEntityId = creator?.Item2;

                        var lastInfluencedBy = Oracle.FindParentEntity(GameState, node);
                        var lastInfluencedByCardId = lastInfluencedBy != null ? lastInfluencedBy?.Item1 : creator?.Item1;
                        //var creatorEntityId = Oracle.FindCardCreatorEntityId(GameState, fullEntity, node);
                        // The delay is also needed for Fight Over Me, because the DEATHS block is processed after the entities
                        // are actually added to hand (which I think is a bug on HS)
                        var cardId = Oracle.PredictCardId(
                            GameState, creatorCardId, creator?.Item2 ?? -1, node, fullEntity.CardId, StateFacade, fullEntity.Entity, fullEntity.SubSpellInEffect);
                        if (cardId == null && GameState.CurrentTurn <= 1 && fullEntity.GetTag(GameTag.ZONE_POSITION) == 5)
                        {
                            var controller = GameState.GetController(fullEntity.GetEffectiveController());
                            if (controller.GetTag(GameTag.CURRENT_PLAYER) != 1)
                            {
                                cardId = "GAME_005";
                                creatorCardId = "GAME_005";
                            }
                        }
                        if (cardId == null 
                            && (parentAction?.SubSpells?.Any(s => s.Prefab == "BARFX_RankedSpell_Upgrade_Impact_Sneaky_Rogue") ?? false))
                            //&& string.IsNullOrEmpty(creatorCardId) && fullEntity.SubSpellInEffect?.Prefab == "zDeprecatedFX_Poison_SpawnToHand_Super_Duplicate")
                        {
                            cardId = "MIXED_CONCOCTION_UNKNOWN";
                            creatorCardId = "MIXED_CONCOCTION_UNKNOWN";
                        }
                        var buffingCardEntityCardId = Oracle.GetBuffingCardCardId(creator?.Item2 ?? -1, creatorCardId);
                        var buffCardId = Oracle.GetBuffCardId(creator?.Item2 ?? -1, creatorCardId);

                        List<Tag> guessedTags = Oracle.GuessTags(GameState, creator?.Item1, creator?.Item2 ?? -1, node, null, StateFacade);
                        var tags = fullEntity.GetTagsCopy();
                        if (guessedTags != null)
                        {
                            tags.AddRange(guessedTags);
                        }
                        var excessAmount = GetExcessAmountFromCreatorBlock(node, creator?.Item1, creator?.Item2 ?? -1);
                        return new GameEvent
                        {
                            Type =  "RECEIVE_CARD_IN_HAND",
                            Value = new
                            {
                                CardId = cardId,
                                ControllerId = controllerId,
                                LocalPlayer = StateFacade.LocalPlayer,
                                OpponentPlayer = StateFacade.OpponentPlayer,
                                EntityId = fullEntity.Id,
                                //GameState = gameState,
                                AdditionalProps = new {
                                    // For the initial coin
                                    CreatorCardId = creatorCardId ?? (fullEntity.GetTag(GameTag.CREATOR) > 0 ? "Unknown" : null),
                                    CreatorEntityId = creatorEntityId ?? fullEntity.GetTag(GameTag.CREATOR),
                                    CreatorZone = creatorZone,
                                    CreatedIndex = createdIndex,
                                    CreatorTags = creatorTags,
                                    LastInfluencedByCardId = lastInfluencedByCardId,
                                    IsPremium = fullEntity.GetTag(GameTag.PREMIUM) == 1,
                                    BuffingEntityCardId = buffingCardEntityCardId,
                                    BuffCardId = buffCardId,
                                    AdditionalPlayInfo = additionalPlayInfo,
                                    DataNum1 = dataNum1,
                                    DataNum2 = dataNum2,
                                    Position = position,
                                    ReferencedCardIds = referencedCardIds,
                                    GuessedTags = tags,
                                    StoredAmount = excessAmount,
                                }
                            }
                        };
                    },
                    true,
                    node) };
        }

        /// <summary>
        /// Cards that store excess damage/healing in a token returned to hand.
        /// Key: creator card ID, Value: (spell amount, meta type for amount dealt).
        /// Tag 1068 is not reliable (used for other purposes) - use META_DATA from POWER block instead.
        /// </summary>
        private static readonly Dictionary<string, (int SpellAmount, MetaDataType MetaType)> ExcessAmountCardConfig = new Dictionary<string, (int, MetaDataType)>
        {
            { InvasiveShadeleaf_WW_393, (10, MetaDataType.DAMAGE) },
            { HolySpringwater_WW_395, (10, MetaDataType.HEALING) },
            // Torch: 8 is fallback only; actual spell damage is read from creator's TAG_SCRIPT_DATA_NUM_1 (changes after each return).
            { Torch_CATA_585, (8, MetaDataType.DAMAGE) },
        };

        /// <summary>
        /// For Invasive Shadeleaf (WW_393), Holy Springwater (WW_395), and Torch (CATA_585): compute excess damage/healing
        /// from META_DATA in the creator's POWER block. Tag 1068 is not reliable (used for other purposes).
        /// Torch uses the creator entity's TAG_SCRIPT_DATA_NUM_1 as spell amount (8 on first play, then prior excess).
        /// For Blackwing Experiment (CATA_464): Dragon Breath damage = creator's ATK at death.
        /// </summary>
        private int? GetExcessAmountFromCreatorBlock(Node node, string creatorCardId, int creatorEntityId)
        {
            if (string.IsNullOrEmpty(creatorCardId) || creatorEntityId <= 0) return null;

            // Blackwing Experiment: Dragon Breath damage = creator's ATK (not excess from META_DATA)
            if (creatorCardId == BlackwingExperiment_CATA_464)
            {
                var creatorEntity = GameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
                if (creatorEntity != null)
                {
                    var atk = creatorEntity.GetTag(GameTag.ATK);
                    return atk > 0 ? atk : (int?)null;
                }
            }

            if (!ExcessAmountCardConfig.TryGetValue(creatorCardId, out var config)) return null;

            // Traverse up to find PLAY block where Entity = creator (the spell that created the token)
            var n = node.Parent;
            Action playAction = null;
            while (n != null)
            {
                if (n.Object is Action a && a.Type == (int)BlockType.PLAY && a.Entity == creatorEntityId)
                {
                    playAction = a;
                    break;
                }
                n = n.Parent;
            }
            if (playAction == null) return null;

            var powerBlock = playAction.Data?.OfType<Action>()
                .FirstOrDefault(a => a.Type == (int)BlockType.POWER && a.Entity == creatorEntityId);
            var meta = powerBlock?.Data?.OfType<MetaData>()
                .FirstOrDefault(m => m.Meta == (int)config.MetaType);
            if (meta == null) return null;

            var spellAmount = config.SpellAmount;
            if (creatorCardId == Torch_CATA_585)
            {
                var torchEntity = GameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
                var scriptDamage = torchEntity?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? -1;
                if (scriptDamage > 0)
                {
                    spellAmount = scriptDamage;
                }
            }

            var excess = spellAmount - meta.Data;
            return excess > 0 ? excess : (int?)null;
        }
    }
}
