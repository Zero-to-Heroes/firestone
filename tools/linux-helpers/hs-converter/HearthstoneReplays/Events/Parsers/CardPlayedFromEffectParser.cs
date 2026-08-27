using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    // Used to handle spells played by cards like Servant of Yogg-Saron or Nagaling
    public class CardPlayedFromEffectParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardPlayedFromEffectParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            var isPowerPhase = node.Parent == null
                       || node.Parent.Type != typeof(Parser.ReplayData.GameActions.Action)
                       || (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.POWER
                       // Scenic Vista uses a TRIGGER block
                       || (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.TRIGGER;

            TagChange tagChange = null;
            FullEntity tagChangeEntity = null;
            bool cardPlayed = node.Type == typeof(TagChange)
                && (tagChange = node.Object as TagChange).Name == (int)GameTag.ZONE
                && tagChange.Value == (int)Zone.PLAY
                && ((tagChangeEntity = GameState.CurrentEntities[(node.Object as TagChange).Entity]).GetTag(GameTag.ZONE) == (int)Zone.SETASIDE
                    // For Nagaling
                    || tagChangeEntity.GetZone() == (int)Zone.REMOVEDFROMGAME);

            Action action = null;
            bool castWhenDrawn = node.Type == typeof(Action)
                && (action = node.Object as Action).Type == (int)BlockType.TRIGGER
                && (action.TriggerKeyword == (int)GameTag.CASTS_WHEN_DRAWN || action.TriggerKeyword == (int)GameTag.TOPDECK);
            return stateType == StateType.PowerTaskList
                && ((isPowerPhase && cardPlayed) || castWhenDrawn);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            // Rune of the Archmage playing spells creates them as FULL_ENTITIES in PLAY, not going through a TAG_CHANGE
            var isPowerPhase = (node.Parent == null
                       || node.Parent.Type != typeof(Parser.ReplayData.GameActions.Action)
                       || (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.POWER);

            ShowEntity fullEntity = null;
            bool cardPlayed = node.Type == typeof(ShowEntity)
                && (fullEntity = node.Object as ShowEntity).GetZone() == (int)Zone.PLAY
                && fullEntity.GetCardType() != (int)CardType.ENCHANTMENT;
            return stateType == StateType.PowerTaskList
                && isPowerPhase
                && cardPlayed;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            if (node.Type == typeof(TagChange))
            {
                return CreateGameEventProviderFromTagChange(node);
            }
            else
            {
                return CreateGameEventProviderFromCastsWhenDrawnAction(node);
            }
        }

        private List<GameEventProvider> CreateGameEventProviderFromTagChange(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            if (cardId == null)
            {
                return null;
            }

            var controllerId = entity.GetEffectiveController();
            var cardType = GameState.CurrentEntities[tagChange.Entity].GetTag(GameTag.CARDTYPE);
            if (cardType == (int)CardType.ENCHANTMENT || cardType == (int)CardType.HERO_POWER)
            {
                return null;
            }

            var action = node.Parent.Object as Parser.ReplayData.GameActions.Action;
            // Since 23.4, it can happen that these tags are directly at the root, and not below an action
            var targetId = action?.Target ?? 0;
            string targetCardId = targetId > 0 ? GameState.CurrentEntities[targetId].CardId : null;
            var creator = entity.GetTag(GameTag.CREATOR);
            var creatorCardId = creator != -1 && GameState.CurrentEntities.ContainsKey(creator)
                ? GameState.CurrentEntities[creator].CardId
                : null;
            var creatorEntityId = creator != -1 && GameState.CurrentEntities.ContainsKey(creator)
                ? GameState.CurrentEntities[creator].Entity
                : -1;
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);

            return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "CARD_PLAYED_BY_EFFECT",
                    GameEvent.CreateProvider(
                        "CARD_PLAYED_BY_EFFECT",
                        cardId,
                        controllerId,
                        entity.Id,
                        StateFacade,
                        //gameState,
                        new {
                            TargetEntityId = targetId,
                            TargetCardId = targetCardId,
                            CreatorCardId = creatorCardId,
                            CreatorEntityId = creatorEntityId,
                            Tags = entity.GetTagsCopy(),
                        }
                    ),
                    true,
                    node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Type == typeof(ShowEntity))
            {
                return CreateGameEventProviderFromShowEntity(node);
            }
            return null;
        }

        private List<GameEventProvider> CreateGameEventProviderFromCastsWhenDrawnAction(Node node)
        {
            var action = node.Object as Action;
            var entity = GameState.CurrentEntities.GetValueOrDefault(action.Entity);
            // Time-Lost Protodrake is a Casts When Drawn minion...
            if (entity.IsMinion())
            {
                return null;
            }
            var cardId = entity?.CardId;
            var controllerId = entity.GetEffectiveController();
            var targetId = action?.Target ?? 0;
            string targetCardId = targetId > 0 ? GameState.CurrentEntities.GetValueOrDefault(targetId)?.CardId : null;
            var creator = entity.GetTag(GameTag.CREATOR);
            var creatorCardId = creator != -1 && GameState.CurrentEntities.ContainsKey(creator)
                ? GameState.CurrentEntities[creator].CardId
                : null;
            var creatorEntityId = creator != -1 && GameState.CurrentEntities.ContainsKey(creator)
                ? GameState.CurrentEntities[creator].Entity
                : -1;

            return new List<GameEventProvider> { GameEventProvider.Create(
                    action.TimeStamp,
                    "CARD_PLAYED_BY_EFFECT",
                    GameEvent.CreateProvider(
                        "CARD_PLAYED_BY_EFFECT",
                        cardId,
                        controllerId,
                        entity.Entity,
                        StateFacade,
                        new {
                            TargetEntityId = targetId,
                            TargetCardId = targetCardId,
                            CreatorCardId = creatorCardId,
                            CreatorEntityId = creatorEntityId,
                            CastWhenDrawn = true,
                            Tags = entity.GetTagsCopy(),
                        }
                    ),
                    true,
                    node) };
        }

        private List<GameEventProvider> CreateGameEventProviderFromShowEntity(Node node)
        {
            var entity = node.Object as ShowEntity;
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            var cardType = entity.GetTag(GameTag.CARDTYPE);
            if (cardId.Length == 0 || cardType == (int)CardType.ENCHANTMENT || cardType == (int)CardType.HERO_POWER)
            {
                return null;
            }

            var action = node.Parent.Object as Parser.ReplayData.GameActions.Action;
            // Since 23.4, it can happen that these tags are directly at the root, and not below an action
            var targetId = action?.Target ?? 0;
            string targetCardId = targetId > 0 ? GameState.CurrentEntities[targetId].CardId : null;
            var creator = entity.GetTag(GameTag.CREATOR);
            var creatorCardId = creator != -1 && GameState.CurrentEntities.ContainsKey(creator)
                ? GameState.CurrentEntities[creator].CardId
                : null;
            var creatorEntityId = creator != -1 && GameState.CurrentEntities.ContainsKey(creator)
                ? GameState.CurrentEntities[creator].Entity
                : -1;
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, entity);

            return new List<GameEventProvider> { GameEventProvider.Create(
                    entity.TimeStamp,
                    "CARD_PLAYED_BY_EFFECT",
                    GameEvent.CreateProvider(
                        "CARD_PLAYED_BY_EFFECT",
                        cardId,
                        controllerId,
                        entity.Entity,
                        StateFacade,
                        //gameState,
                        new {
                            TargetEntityId = targetId,
                            TargetCardId = targetCardId,
                            CreatorCardId = creatorCardId,
                            CreatorEntityId = creatorEntityId,
                            Tags = entity.GetTagsCopy(),
                        }
                    ),
                    true,
                    node) };
        }
    }
}
