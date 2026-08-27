using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class BallerBuffChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BallerBuffChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            TagChange tagChange = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && GameState.CurrentEntities.GetValueOrDefault((tagChange = node.Object as TagChange)?.Entity ?? -1)?.CardId == CardIds.BallerPlayerEnchantDntEnchantment_BG31_816pe
                && tagChange.Name == (int)GameTag.TAG_SCRIPT_DATA_NUM_1;
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

            var controller = entity.GetController();
            if (controller != StateFacade.LocalPlayer.PlayerId)
            {
                return null;
            }

            var value = tagChange.Value;
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "BALLER_BUFF_CHANGED",
                GameEvent.CreateProvider(
                    "BALLER_BUFF_CHANGED",
                    null,
                    entity.GetEffectiveController(),
                    entity.Id,
                    StateFacade,
                    new {
                        Buff = value,
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
