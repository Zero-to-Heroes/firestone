using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsTrinketSelectionParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsTrinketSelectionParser(ParserState ParserState, StateFacade stateFacade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = stateFacade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            // Because the BLOCK is corrupted because of the choices, so we use another technique
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetCardType() == (int)CardType.BATTLEGROUND_TRINKET;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            if (node.Parent == null || node.Parent.Type != typeof(Action))
            {
                return null;
            }

            var parentAction = node.Parent.Object as Action;
            var entity = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
            if (entity?.CardId != CardIds.LesserTrinketToken_BG30_Trinket_1st && entity?.CardId != CardIds.GreaterTrinket_BG30_Trinket_2nd)
            {
                // Don't do this, as we also want to show the data for trinkets created by other trinkets or hero powers
                //return null;
            }

            var controllerId = entity.GetEffectiveController();
            var options = parentAction.Data
                .Where(d => d is FullEntity)
                .Select(d => d as FullEntity)
                .Where(f => f.GetCardType() == (int)CardType.BATTLEGROUND_TRINKET)
                .Select(f =>
                {
                    return new
                    {
                        CardId = f.CardId,
                        Cost = f.GetCost(),
                    };
                })
                .ToList();
            if (options.Count != 4)
            {
                return null;
            }

            return new List<GameEventProvider> { GameEventProvider.Create(
                parentAction.TimeStamp,
                "BATTLEGROUNDS_TRINKET_SELECTION",
                GameEvent.CreateProvider(
                "BATTLEGROUNDS_TRINKET_SELECTION",
                    entity.CardId,
                    controllerId,
                    entity.Entity,
                    StateFacade,
                    //null,
                    new {
                        Options = options
                    }),
                true,
                node) };
        }
    }
}
