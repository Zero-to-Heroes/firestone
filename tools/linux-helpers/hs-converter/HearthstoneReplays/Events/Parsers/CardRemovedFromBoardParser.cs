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
    // Like Bombs that explode when you draw them
    public class CardRemovedFromBoardParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardRemovedFromBoardParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            var normalRemovedMinion = stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ZONE
                && ((node.Object as TagChange).Value == (int)Zone.REMOVEDFROMGAME || (node.Object as TagChange).Value == (int)Zone.SETASIDE);
            var timewarpedTavernEnd = stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.BACON_ALT_TAVERN_IN_PROGRESS
                && (node.Object as TagChange).Value == 0;
            return normalRemovedMinion || timewarpedTavernEnd;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            // Handle all timewarped minions leaving the board
            if (tagChange.Name == (int)GameTag.BACON_ALT_TAVERN_IN_PROGRESS)
            {
                var gameEventProviders = new List<GameEventProvider>();
                foreach (var entity in GameState.CurrentEntities.Values)
                {
                    if (entity.IsMinionLike()
                        && entity.GetTag(GameTag.ZONE) == (int)Zone.SETASIDE
                        && entity.GetTag(GameTag.BACON_TIMEWARPED) == 1)
                    {
                        var cardId = entity.CardId;
                        var controllerId = entity.GetEffectiveController();
                        gameEventProviders.Add(GameEventProvider.Create(
                            tagChange.TimeStamp,
                            "CARD_REMOVED_FROM_BOARD",
                            GameEvent.CreateProvider(
                                "CARD_REMOVED_FROM_BOARD",
                                cardId,
                                controllerId,
                                entity.Id,
                                StateFacade,
                                //gameState,
                                new
                                {
                                    RemovedByCardId = (string)null,
                                    RemovedByEntityId = (int?)null,
                                }),
                            true,
                            node));
                    }
                }
                return gameEventProviders;
            }

            else
            {

                if (!GameState.CurrentEntities.ContainsKey(tagChange.Entity))
                {
                    Logger.Log("Could not find card to remove from board", node.CreationLogLine);
                    return null;
                }
                var entity = GameState.CurrentEntities[tagChange.Entity];
                if (!entity.IsMinionLike())
                {
                    return null;
                }
                if (entity.GetTag(GameTag.ZONE) != (int)Zone.PLAY)
                {
                    return null;
                }

                Action parentAction = null;
                string removedByCardId = null;
                int? removedByEntityId = null;
                if (node.Parent.Type == typeof(Action))
                {
                    parentAction = node.Parent.Object as Action;
                    var parentEntity = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
                    removedByCardId = parentEntity?.CardId;
                    removedByEntityId = parentEntity?.Entity;
                }

                var cardId = entity.CardId;
                var controllerId = entity.GetEffectiveController();
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);

                return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "CARD_REMOVED_FROM_BOARD",
                GameEvent.CreateProvider(
                    "CARD_REMOVED_FROM_BOARD",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        RemovedByCardId = removedByCardId,
                        RemovedByEntityId = removedByEntityId,
                    }),
                true,
                node) };
            }
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
