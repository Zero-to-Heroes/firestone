using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class SecretPlayedFromHandParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public SecretPlayedFromHandParser(ParserState ParserState, StateFacade facade)
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
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.ZONE) == (int)Zone.HAND;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(Parser.ReplayData.GameActions.Action)
                && (node.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.PLAY;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            if (entity.GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT
                // Paladin Auras are logged as QUEST_PLAYED, which seems to work well enough
                //&& entity.GetTag(GameTag.SIGIL) != 1
            )
            {
                var eventName = "QUEST_PLAYED";
                if (GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.SECRET) == 1)
                {
                    eventName = "SECRET_PLAYED";
                }
                // Sparkjoy cheat casts a secret from your hand, but it's different from actually playing a secret
                // (Counterspell does not trigger for instance)
                // It's important to separate the two cases so that the secret helper doesn't gray out incorrect things
                else if (node.Parent != null && node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                {
                    var parentAction = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                    if ((parentAction.Type == (int)BlockType.TRIGGER || parentAction.Type == (int)BlockType.POWER)
                        && GameState.CurrentEntities.ContainsKey(parentAction.Entity)
                        && GameState.CurrentEntities[parentAction.Entity].CardId == CardIds.SparkjoyCheat)
                    {
                        eventName = "SECRET_PUT_IN_PLAY";
                    }
                }
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
                var playerClass = entity.GetPlayerClass();
                var creatorEntityId = entity.GetTag(GameTag.CREATOR);
                var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                    ? GameState.CurrentEntities[creatorEntityId].CardId
                    : null;
                GameState.OnCardPlayed(tagChange.Entity);
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
                                CreatorCardId = creatorEntityCardId,
                                Cost = entity.GetTag(GameTag.COST, 0),
                            }),
                       true,
                       node) };
            }
            return null;
        }

        // Typically the case when the opponent plays a quest or a secret
        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Parser.ReplayData.GameActions.Action;
            foreach (var data in action.Data)
            {
                if (data.GetType() == typeof(ShowEntity))
                {
                    var showEntity = data as ShowEntity;
                    if (showEntity.GetTag(GameTag.ZONE) == (int)Zone.SECRET
                        && showEntity.GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT
                        && showEntity.GetTag(GameTag.SIGIL) != 1)
                    {
                        var cardId = showEntity.CardId;
                        var controllerId = showEntity.GetEffectiveController();
                        //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
                        var playerClass = showEntity.GetPlayerClass();
                        var eventName = showEntity.GetTag(GameTag.SECRET) == 1
                            ? "SECRET_PLAYED"
                            : "QUEST_PLAYED";
                        GameState.OnCardPlayed(showEntity.Entity);
                        // For now there can only be one card played per block
                        return new List<GameEventProvider> { GameEventProvider.Create(
                            action.TimeStamp,
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
                                    Cost = showEntity.GetTag(GameTag.COST, 0),
                                }),
                            true,
                            node) };
                    }
                }
            }
            return null;
        }
    }
}
