using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Diagnostics;

namespace HearthstoneReplays.Events.Parsers
{
    public class SecretDestroyedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public SecretDestroyedParser(ParserState ParserState, StateFacade facade)
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
                && ((node.Object as TagChange).Value == (int)Zone.GRAVEYARD
                    // For BG quests
                    || (node.Object as TagChange).Value == (int)Zone.REMOVEDFROMGAME
                    // For the Priest quest that splits in two
                    || (node.Object as TagChange).Value == (int)Zone.SETASIDE)
                && GameState.CurrentEntities.GetValueOrDefault((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) == (int)Zone.SECRET;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            // When the active player destroys a secret, it is fully revealed
            var appliesToShowEntity = node.Type == typeof(ShowEntity)
                && ((node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.GRAVEYARD
                    // BG quests
                    || (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.REMOVEDFROMGAME)
                && GameState.CurrentEntities.ContainsKey((node.Object as ShowEntity).Entity)
                && GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE) == (int)Zone.SECRET;
            return stateType == StateType.PowerTaskList
                && appliesToShowEntity;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            if (entity.GetTag(GameTag.SECRET_HAS_TRIGGERED) == 1)
            {
                return null;
            }
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            if (tagChange.Value == (int)Zone.SETASIDE && entity.GetZone() != (int)Zone.SECRET)
            {
                // This is to handle the Priest quest that splits in two
                return null;
            }

            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            var eventName = entity.GetTag(GameTag.SECRET) == 1
                ? "SECRET_DESTROYED"
                : "QUEST_DESTROYED";
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade),
                true,
                node) };
        }

        // Typically the case when the opponent plays a quest or a secret
        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            var entity = GameState.CurrentEntities.GetValueOrDefault(showEntity.Entity);
            if (entity == null || entity.GetTag(GameTag.SECRET_HAS_TRIGGERED) == 1)
            {
                return null;
            }

            var cardId = showEntity.CardId;
            var controllerId = showEntity.GetTag(GameTag.CONTROLLER);
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
            var playerClass = showEntity.GetPlayerClass();
            var eventName = showEntity.GetTag(GameTag.SECRET) == 1
                ? "SECRET_DESTROYED"
                : "QUEST_DESTROYED";
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //gameState,
                    new {
                        PlayerClass = playerClass,
                    }),
                true,
                node) };
        }
    }
}
