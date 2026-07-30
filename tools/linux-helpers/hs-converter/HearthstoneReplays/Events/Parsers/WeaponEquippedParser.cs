using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class WeaponEquippedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public WeaponEquippedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ZONE
                && (node.Object as TagChange).Value == (int)Zone.PLAY
                && GameState.CurrentEntities.ContainsKey((node.Object as TagChange).Entity)
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.CARDTYPE) == (int)CardType.WEAPON;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var fullEntity = stateType == StateType.PowerTaskList
                && node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.PLAY
                && (node.Object as FullEntity).GetTag(GameTag.CARDTYPE) == (int)CardType.WEAPON;
            var showEntity = stateType == StateType.PowerTaskList
                && node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.PLAY
                && (node.Object as ShowEntity).GetTag(GameTag.CARDTYPE) == (int)CardType.WEAPON;
            return fullEntity || showEntity;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            var creatorEntityId = entity.GetTag(GameTag.CREATOR);
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "WEAPON_EQUIPPED",
                GameEvent.CreateProvider(
                    "WEAPON_EQUIPPED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                    }
                ),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Object is FullEntity)
            {
                return CreateGameEventProviderFromCloseFullEntity(node);
            }
            else
            {
                return CreateGameEventProviderFromCloseShowEntity(node);
            }
        }

        private List<GameEventProvider> CreateGameEventProviderFromCloseFullEntity(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            var cardId = fullEntity.CardId;
            var controllerId = fullEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;
            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "WEAPON_EQUIPPED",
                GameEvent.CreateProvider(
                    "WEAPON_EQUIPPED",
                    cardId,
                    controllerId,
                    fullEntity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                    }
                ),
                true,
                node) };
        }
        private List<GameEventProvider> CreateGameEventProviderFromCloseShowEntity(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            var cardId = showEntity.CardId;
            var controllerId = showEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                "WEAPON_EQUIPPED",
                GameEvent.CreateProvider(
                    "WEAPON_EQUIPPED",
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                    }
                ),
                true,
                node) };
        }
    }
}
