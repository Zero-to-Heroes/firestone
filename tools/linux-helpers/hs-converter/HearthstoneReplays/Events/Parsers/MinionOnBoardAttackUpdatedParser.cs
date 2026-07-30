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
    public class MinionOnBoardAttackUpdatedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MinionOnBoardAttackUpdatedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ATK
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.ZONE) == (int)Zone.PLAY;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var initialAttack = entity.GetTag(GameTag.ATK);
            var newAttack = tagChange.Value;
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            int? sourceEntityId = null;
            string sourceCardId = null;
            if (node.Parent != null && node.Parent.Object is Action)
            {
                var parentAction = node.Parent.Object as Action;
                sourceEntityId = parentAction.Entity;
                sourceCardId = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity)?.CardId;
            }
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "MINION_ON_BOARD_ATTACK_UPDATED",
                GameEvent.CreateProvider(
                    "MINION_ON_BOARD_ATTACK_UPDATED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        InitialAttack = initialAttack,
                        NewAttack = newAttack,
                        SourceEntityId = sourceEntityId,
                        SourceCardId = sourceCardId,
                    }
                ),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
