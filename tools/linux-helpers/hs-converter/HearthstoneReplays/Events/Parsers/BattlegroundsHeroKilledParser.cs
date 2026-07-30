using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsHeroKilledParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsHeroKilledParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ZONE
                && (node.Object as TagChange).Value == (int)Zone.GRAVEYARD
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.CARDTYPE) == (int)CardType.HERO;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var parent = node.Parent;
            // If it's not in a DEATHS block, it could simply be that the hero has been swapped out
            if (parent == null || !(parent.Object is Action) || (parent.Object as Action).Type != (int)BlockType.DEATHS)
            {
                return null;
            }

            if (GameState.CurrentEntities[tagChange.Entity].GetController() == StateFacade.LocalPlayer.Id)
            {
                return null;
            }

            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "BATTLEGROUNDS_ENEMY_HERO_KILLED",
                GameEvent.CreateProvider(
                    "BATTLEGROUNDS_ENEMY_HERO_KILLED",
                    GameState.CurrentEntities[tagChange.Entity].CardId,
                    GameState.CurrentEntities[tagChange.Entity].GetController(),
                    tagChange.Entity,
                    StateFacade,
                    null),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
