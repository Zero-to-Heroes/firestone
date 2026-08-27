using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class LocalPlayerLeaderboardPlaceChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public LocalPlayerLeaderboardPlaceChangedParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
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
            FullEntity entity = GameState.CurrentEntities.TryGetValue(tagChange.Entity, out entity) ? entity : null;
            if (entity == null)
            {
                return null;
            }
            var basePlace = tagChange.Name == (int)GameTag.PLAYER_LEADERBOARD_PLACE
                ? tagChange.Value
                : entity.GetTag(GameTag.PLAYER_LEADERBOARD_PLACE, 0);
            var baseFirst = tagChange.Name == (int)GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT
                ? tagChange.Value
                : entity.GetTag(GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT, 0);
            if (entity.GetEffectiveController() == StateFacade.LocalPlayer.PlayerId)
            {
                return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED",
                    GameEvent.CreateProviderWithDeferredProps(
                        "LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED",
                        null,
                        -1,
                        entity.Id,
                        StateFacade,
                        //null,
                        () =>
                        // Defer it because we need the meta data
                        {
                            var leaderboardPlace = StateFacade.GetMetaData().GameType == (int)GameType.GT_BATTLEGROUNDS_DUO
                                || StateFacade.GetMetaData().GameType == (int)GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY
                                || StateFacade.GetMetaData().GameType == (int)GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI
                                || StateFacade.GetMetaData().GameType == (int)GameType.GT_BATTLEGROUNDS_DUO_VS_AI
                                ? basePlace * 2 - baseFirst
                                : basePlace;
                            return new {
                                NewPlace = leaderboardPlace
                            };
                        }
                    ),
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
