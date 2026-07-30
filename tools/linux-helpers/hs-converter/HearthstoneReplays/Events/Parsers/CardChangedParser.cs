using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class CardChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(ChangeEntity);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var changeEntity = node.Object as ChangeEntity;
            string eventName = null;
            if (GameState.CurrentEntities[changeEntity.Entity].GetTag(GameTag.ZONE) == (int)Zone.PLAY)
            {
                eventName = "CARD_CHANGED_ON_BOARD";
            }
            else if (GameState.CurrentEntities[changeEntity.Entity].GetTag(GameTag.ZONE) == (int)Zone.HAND)
            {
                eventName = "CARD_CHANGED_IN_HAND";
            }
            else if (GameState.CurrentEntities[changeEntity.Entity].GetTag(GameTag.ZONE) == (int)Zone.DECK)
            {
                eventName = "CARD_CHANGED_IN_DECK";
            }
            if (eventName == null)
            {
                return null;
            }
            var cardId = changeEntity.CardId;
            var entity = GameState.CurrentEntities[changeEntity.Entity];
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var creatorEntityId = changeEntity.GetTag(GameTag.CREATOR);
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;
            int? lastInfluencedByEntityId = null;
            string lastAffectedByCardId = null;
            if (node.Parent != null && node.Parent.Type == typeof(Action))
            {
                var parent = node.Parent.Object as Action;
                lastInfluencedByEntityId = parent?.Entity;
                lastAffectedByCardId = GameState.CurrentEntities.GetValueOrDefault(lastInfluencedByEntityId ?? 0)?.CardId;
            }
            return new List<GameEventProvider> { GameEventProvider.Create(
                changeEntity.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                        LastAffectedByEntityId = lastInfluencedByEntityId,
                        LastAffectedByCardId = lastAffectedByCardId,
                        Tags = entity.GetTagsCopy(),
                    }),
                true,
                node) };
        }
    }
}
