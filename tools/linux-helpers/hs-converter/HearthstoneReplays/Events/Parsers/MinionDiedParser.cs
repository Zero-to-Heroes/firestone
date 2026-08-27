using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class MinionDiedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MinionDiedParser(ParserState ParserState, StateFacade facade)
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
                && (node.Object as Action).Type == (int)BlockType.DEATHS;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Action;
            var deathTags = action.GetDataRecursive()
                .Where(data => data is TagChange)
                .Select(data => data as TagChange)
                .Where(tag => tag.Name == (int)GameTag.ZONE && tag.Value == (int)Zone.GRAVEYARD)
                // Checking the current zone doesn't work, because we work on a Close node. However, since 
                // we are in the DEATHS block, we should be good
                //.Where(tag => GameState.CurrentEntities[tag.Entity].GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                .Where(tag => GameState.CurrentEntities[tag.Entity].IsMinionLike());
            var deadMinions = deathTags.Select(tag =>
            {
                var entity = GameState.CurrentEntities[tag.Entity];
                if (entity.GetCardType() != (int)CardType.MINION)
                {
                    return null;
                }
                var cardId = entity.CardId;
                var controllerId = entity.GetEffectiveController();
                return new
                {
                    CardId = cardId,
                    EntityId = entity.Id,
                    ControllerId = controllerId,
                    Cost = entity.GetCost(),
                    Timestamp = tag.TimeStamp,
                };
            })
                .Where(death => death != null)
                .ToList();

            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                action.TimeStamp,
                "MINIONS_DIED",
                GameEvent.CreateProvider(
                    "MINIONS_DIED",
                    null,
                    -1,
                    -1,
                    StateFacade,
                    //gameState,
                    new {
                        DeadMinions = deadMinions,
                        ActivePlayerId = GameState.GetActivePlayerId(),
                    }),
                true,
                node) };
        }
    }
}
