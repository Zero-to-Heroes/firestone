using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class SecretPlayedFromDeckParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public SecretPlayedFromDeckParser(ParserState ParserState, StateFacade facade)
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
                && (node.Object as TagChange).Value == (int)Zone.SECRET
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.ZONE) == (int)Zone.DECK;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var appliesToShowEntity = node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.SECRET
                && GameState.CurrentEntities.ContainsKey((node.Object as ShowEntity).Entity)
                && GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE) == (int)Zone.DECK;
            return stateType == StateType.PowerTaskList
                && appliesToShowEntity;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            if (entity.GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT && entity.GetTag(GameTag.SIGIL) != 1)
            {
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
                var playerClass = entity.GetPlayerClass();
                var eventName = GameState.CurrentEntities[tagChange.Entity].GetTag(GameTag.SECRET) == 1 
                    ? "SECRET_PLAYED_FROM_DECK"
                    : "QUEST_PLAYED_FROM_DECK";
                return new List<GameEventProvider> { GameEventProvider.Create(
                        tagChange.TimeStamp,
                        eventName,
                        GameEvent.CreateProvider(
                            eventName,
                            cardId,
                            controllerId,
                            entity.Id,
                            StateFacade,
                            //gameState,
                            new {
                                PlayerClass = playerClass,
                            }),
                       true,
                       node) };
            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            if (showEntity.GetTag(GameTag.SIGIL) == 1)
            {
                return null;
            }

            var cardId = showEntity.CardId;
            var controllerId = showEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
            var playerClass = showEntity.GetPlayerClass();
            var eventName = showEntity.GetTag(GameTag.SECRET) == 1 
                ? "SECRET_PLAYED_FROM_DECK"
                : "QUEST_PLAYED_FROM_DECK";

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
