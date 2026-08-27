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
    public class BattlegroundsHeroSelectionParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsHeroSelectionParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.MULLIGAN_STATE
                && (node.Object as TagChange).Value == (int)Mulligan.INPUT;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var playerId = StateFacade.LocalPlayer.PlayerId;
            var fullEntities = GameState.CurrentEntities.Values
                .Where(data => data.GetEffectiveController() == playerId)
                .Where(data => data.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where(data => data.GetTag(GameTag.ZONE) == (int)Zone.HAND)
                .Where(data => data.GetTag(GameTag.BACON_HERO_CAN_BE_DRAFTED) == 1 || data.GetTag(GameTag.BACON_SKIN) == 1)
                .ToList();
            fullEntities.Sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION));
            Logger.Log("will consider hero selection event", "" + fullEntities.Count);
            if (fullEntities.Count > 0)
            {
                Logger.Log("will emit hero selection event", "");
                return new List<GameEventProvider> { GameEventProvider.Create(
                   tagChange.TimeStamp,
                   "BATTLEGROUNDS_HERO_SELECTION",
                   () => {
                       if (!StateFacade.IsBattlegrounds())
                       {
                           return null;
                       }
                       return new GameEvent
                       {
                           Type = "BATTLEGROUNDS_HERO_SELECTION",
                           Value = new
                           {
                               Options = fullEntities.Select(entity => new {
                                   CardId = entity.CardId,
                                   EntityId = entity.Id,
                               }).ToList(),
                           }
                       };
                   },
                   true,
                   node
                )};
            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
