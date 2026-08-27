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
    public class DiscardedCardParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public DiscardedCardParser(ParserState ParserState, StateFacade facade)
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
                && (node.Object as TagChange).Value == (int)Zone.GRAVEYARD
                // Because of some Rewind shennanigans this can be null in some cases
                && GameState.CurrentEntities.GetValueOrDefault((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) == (int)Zone.HAND;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.GRAVEYARD
                && GameState.CurrentEntities.GetValueOrDefault((node.Object as ShowEntity).Entity)?.GetTag(GameTag.ZONE) == (int)Zone.HAND;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            entity.PlayedWhileInHand.Clear();
            GameState.OnCardDiscarded(entity.Id, entity.CardId, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "DISCARD_CARD",
                GameEvent.CreateProvider(
                    "DISCARD_CARD",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            var entity = GameState.CurrentEntities[showEntity.Entity];
            if (entity == null)
            {
                Logger.Log("Could not find entity while looking for discard", showEntity.Entity);
            }
            var cardId = entity?.CardId != null && entity.CardId.Length > 0 ? entity.CardId : showEntity.CardId;
            var controllerId = entity != null ? entity.GetEffectiveController() : -1;
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
            entity.PlayedWhileInHand.Clear();

            // Felsoul Jailer
            FullEntity parentEntity = null;
            if (node.Parent?.Object is Action)
            {
                var parentAction = node.Parent.Object as Action;
                parentEntity = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
            }
            GameState.OnCardDiscarded(entity.Id, cardId, parentEntity);
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                "DISCARD_CARD",
                GameEvent.CreateProvider(
                    "DISCARD_CARD",
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //gameState,
                    new {
                        OriginEntityId = parentEntity?.Id,
                    }),
                true,
                node) };
        }
    }
}
