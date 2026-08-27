using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Linq;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class TouristRevealedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public TouristRevealedParser(ParserState ParserState, StateFacade facade)
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
                && node.Type == typeof(Action)
                && (node.Object as Action).Type == (int)BlockType.TRIGGER
                && GameState.CurrentEntities.GetValueOrDefault((node.Object as Action).Entity)?.CardId == CardIds.TouristVfxEnchantment_VAC_422e;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Action;
            var touristEntity = action?.Data
                .Where(d => d is FullEntity)
                .Select(d => d as FullEntity)
                .Where(e => e.GetTag(GameTag.TOURIST) > 0)
                .FirstOrDefault();
            if (touristEntity == null)
            {
                var parent = node.Parent;
                if (parent.Type == typeof(Action))
                {
                    var parentAction = node.Parent.Object as Action;
                    var maybeTourist = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
                    if (maybeTourist.GetTag(GameTag.TOURIST) > 0)
                    {
                        touristEntity = maybeTourist;
                    }
                }
            }

            if (touristEntity == null)
            {
                return null;
            }

            List<GameEventProvider> result = new List<GameEventProvider>();
            result.Add(GameEventProvider.Create(
                action.TimeStamp,
                "TOURIST_REVEALED",
                GameEvent.CreateProvider(
                    "TOURIST_REVEALED",
                    touristEntity.CardId,
                    touristEntity.GetController(),
                    touristEntity.Id,
                    StateFacade,
                    //null,
                    new
                    {
                        TouristFor = touristEntity.GetTag(GameTag.TOURIST)
                    }),
                true,
                node));
            return result;
        }
    }
}
