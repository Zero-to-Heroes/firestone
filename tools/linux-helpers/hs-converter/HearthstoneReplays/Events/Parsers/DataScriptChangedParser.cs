using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class DataScriptChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public DataScriptChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && ((node.Object as TagChange).Name == (int)GameTag.TAG_SCRIPT_DATA_NUM_1 || (node.Object as TagChange).Name == (int)GameTag.TAG_SCRIPT_DATA_NUM_2);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity == null)
            {
                return null;
            }

            // In BG, we need this only for enchantments
            if (StateFacade.IsBattlegrounds() && entity.GetCardType() != (int)CardType.ENCHANTMENT) 
            {
                return null;
            }

            var initialData1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
            var initialData2 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0);
            int newData1 = initialData1;
            int newData2 = initialData2;
            if (tagChange.Name == (int)GameTag.TAG_SCRIPT_DATA_NUM_1)
            {
                newData1 = tagChange.Value;
            }
            if (tagChange.Name == (int)GameTag.TAG_SCRIPT_DATA_NUM_2)
            {
                newData2 = tagChange.Value;
            }
            if (initialData1 == newData1 && initialData2 == newData2)
            {
                return null;
            }

            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "DATA_SCRIPT_CHANGED",
                GameEvent.CreateProvider(
                    "DATA_SCRIPT_CHANGED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    new {
                        DataNum1 = newData1,
                        DataNum2 = newData2,
                        Updates = new List<dynamic>() {
                            new { CardId = cardId, EntityId = entity.Id, ControllerId = controllerId, DataNum1 = newData1, DataNum2 = newData2 }
                        },
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
