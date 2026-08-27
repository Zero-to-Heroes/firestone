using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using System.Security.AccessControl;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsPlayerLeaderboardPlaceUpdatedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsPlayerLeaderboardPlaceUpdatedParser(ParserState ParserState, StateFacade stateFacade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = stateFacade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(TagChange)
                && ((node.Object as TagChange).Name == (int)GameTag.PLAYER_LEADERBOARD_PLACE
                    || (node.Object as TagChange).Name == (int)GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var hero = GameState.CurrentEntities[tagChange.Entity];
            if (hero?.CardId != null && !hero.IsBaconBartender())
            {
                var basePlace = tagChange.Name == (int)GameTag.PLAYER_LEADERBOARD_PLACE
                    ? tagChange.Value
                    : hero.GetTag(GameTag.PLAYER_LEADERBOARD_PLACE, 0);
                var baseFirst = tagChange.Name == (int)GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT
                    ? tagChange.Value
                    : hero.GetTag(GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT, 0);
                return new List<GameEventProvider> {  GameEventProvider.Create(
                   tagChange.TimeStamp,
                   "BATTLEGROUNDS_LEADERBOARD_PLACE",
                   () => {
                        if (!StateFacade.IsBattlegrounds())
                        {
                            return null;
                        }
                        var leaderboardPlace = StateFacade.GetMetaData().GameType == (int)GameType.GT_BATTLEGROUNDS_DUO
                                || StateFacade.GetMetaData().GameType == (int)GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY
                                || StateFacade.GetMetaData().GameType == (int)GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI
                                || StateFacade.GetMetaData().GameType == (int)GameType.GT_BATTLEGROUNDS_DUO_VS_AI
                            ? basePlace * 2 - baseFirst
                            : basePlace;
                       var debug = node.CreationLogLine;
                       var debug2 = tagChange;
                        return new GameEvent
                        {
                            Type = "BATTLEGROUNDS_LEADERBOARD_PLACE",
                            Value = new
                            {
                                CardId = hero.CardId,
                                PlayerId = hero.GetTag(GameTag.PLAYER_ID),
                                LeaderboardPlace = leaderboardPlace,
                            }
                        };
                   },
                   true,
                   node) };
            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
