using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using System;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsMinionsBoughtParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        private List<string> Cards = new List<string>()
        {
            CardIds.DragToBuy,
            CardIds.DragToBuySpell_TB_BaconShop_DragBuy_Spell,
        };

        public BattlegroundsMinionsBoughtParser(ParserState ParserState, StateFacade facade)
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
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(Action)
                && (node.Object as Action).Type == (int)BlockType.POWER
                && GameState.CurrentEntities.ContainsKey((node.Object as Action).Entity)
                && Cards.Contains(GameState.CurrentEntities[((node.Object as Action).Entity)].CardId);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Action;
            // There are some empty buy actions, not exactly sure what they are about
            // So we only count an action if a minion actually changed controllers
            var controllerTagChange = action.Data
                .Where(data => data is TagChange)
                .Select(data => data as TagChange)
                .Where(tag => tag.Name == (int)GameTag.CONTROLLER)
                .FirstOrDefault();
            if (controllerTagChange == null)
            {
                return null;
            }

            var boughtMinion = GameState.CurrentEntities[controllerTagChange.Entity];
            var cardId = boughtMinion.CardId;
            var controller = controllerTagChange.Value;
            return new List<GameEventProvider> { GameEventProvider.Create(
                    (node.Object as Action).TimeStamp,
                     "BATTLEGROUNDS_MINION_BOUGHT",
                    GameEvent.CreateProvider(
                        "BATTLEGROUNDS_MINION_BOUGHT",
                        cardId,
                        controller,
                        boughtMinion.Entity,
                        StateFacade,
                        null),
                    true,
                    node)
                };
        }
    }
}
