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
    public class CthunParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CthunParser(ParserState ParserState, StateFacade facade)
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
                && ((tagChange = node.Object as TagChange).Name == (int)GameTag.CTHUN_ATTACK_BUFF
                    || tagChange.Name == (int)GameTag.CTHUN_HEALTH_BUFF);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            // Special case for Crystal Core which, for an unknown reason, shows C'Thun even if it's not present in the deck
            if (node.Parent != null && node.Parent.Type == typeof(Action))
            {
                var parentAction = node.Parent.Object as Action;
                if (GameState.CurrentEntities.ContainsKey(parentAction.Entity))
                {
                    var parentEntity = GameState.CurrentEntities[parentAction.Entity];
                    if (parentAction.Type == (int)BlockType.POWER && parentEntity.CardId == TheCavernsBelow_CrystalCoreToken)
                    {
                        return null;
                    }
                }
            }

            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "CTHUN",
                GameEvent.CreateProvider(
                    "CTHUN",
                    null,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CthuAtk = tagChange.Name == (int)GameTag.CTHUN_ATTACK_BUFF ? tagChange.Value as int? : null,
                        CthuHealth = tagChange.Name == (int)GameTag.CTHUN_HEALTH_BUFF ? tagChange.Value as int? : null,
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
