using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class QuestCompletedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public QuestCompletedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            Parser.ReplayData.GameActions.Action action = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(Parser.ReplayData.GameActions.Action)
                && (action = node.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.TRIGGER
                // BG seems to only need sidequest
                && (action.TriggerKeyword == (int)GameTag.SIDE_QUEST || action.TriggerKeyword == (int)GameTag.QUEST);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var action = node.Object as Parser.ReplayData.GameActions.Action;
            var entity = GameState.CurrentEntities[action.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            if (GameState.CurrentEntities[action.Entity].GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT)
            {
                var parentAction = (node.Parent.Object as Parser.ReplayData.GameActions.Action);
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
                entity.SetTag(GameTag.SECRET_HAS_TRIGGERED, 1);
                return new List<GameEventProvider> {
                    GameEventProvider.Create(
                        action.TimeStamp,
                        "QUEST_COMPLETED",
                        GameEvent.CreateProvider(
                            "QUEST_COMPLETED",
                            cardId,
                            controllerId,
                            entity.Id,
                            StateFacade),
                       true,
                       node) 
                };
            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
