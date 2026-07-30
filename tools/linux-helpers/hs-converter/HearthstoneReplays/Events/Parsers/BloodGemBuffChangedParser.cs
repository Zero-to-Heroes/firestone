using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class BloodGemBuffChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BloodGemBuffChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && ((node.Object as TagChange).Name == (int)GameTag.BACON_BLOODGEMBUFFATKVALUE 
                    || (node.Object as TagChange).Name == (int)GameTag.BACON_BLOODGEMBUFFHEALTHVALUE) ;
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

            var atk = tagChange.Name == (int)GameTag.BACON_BLOODGEMBUFFATKVALUE ? tagChange.Value : entity.GetTag(GameTag.BACON_BLOODGEMBUFFATKVALUE, 0);
            var health = tagChange.Name == (int)GameTag.BACON_BLOODGEMBUFFHEALTHVALUE ? tagChange.Value : entity.GetTag(GameTag.BACON_BLOODGEMBUFFHEALTHVALUE, 0);
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "BLOOD_GEM_BUFF_CHANGED",
                GameEvent.CreateProvider(
                    "BLOOD_GEM_BUFF_CHANGED",
                    null,
                    entity.GetEffectiveController(),
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        Attack = atk,
                        Health = health,
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
