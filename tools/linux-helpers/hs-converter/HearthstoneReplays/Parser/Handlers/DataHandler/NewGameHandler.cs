using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using HearthstoneReplays.Events;

namespace HearthstoneReplays.Parser.Handlers
{
    internal class NewGameHandler
    {
        public static bool HandleNewGame(
            DateTime timestamp, string data, ParserState state, DateTime previousTimestamp, StateType stateType, StateFacade gameInfoHelper, 
            long currentGameSeed, bool resettingGame, GameMetaData metadata, Helper helper)
        {
            if (data == "CREATE_GAME")
            {
                state.NodeParser.ClearQueue();

                Logger.Log("Handling create game", "");
                var isReconnecting = !resettingGame && (stateType == StateType.GameState ? state.IsReconnecting(currentGameSeed) : gameInfoHelper.GsState.ReconnectionOngoing);
                if (isReconnecting)
                {
                    // Move all entities to REMOVEDFROMGAME. Entities that are not in that zone will (hopefully?) be given
                    // FullEntity, ShowEntity or TAG_CHANGE actions
                    foreach (var entity in state.GameState.CurrentEntities.Values)
                    {
                        entity.SetTag(GameTag.ZONE, (int)Zone.REMOVEDFROMGAME);
                    }
                    if (stateType == StateType.GameState)
                    {
                        Logger.Log(
                            $"Probable reconnect detected {stateType} {timestamp} // {previousTimestamp} // {state.Ended} // {state.NumberOfCreates} // {state.Spectating} // {stateType} // {data}",
                            "" + (timestamp - previousTimestamp));
                        state.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                            timestamp,
                            "RECONNECT_START",
                            () => {
                                return new GameEvent
                                {
                                    Type = "RECONNECT_START",
                                };
                            },
                            false,
                            new Node(null, null, 0, null, data))
                        });
                    }
                    state.ReconnectionOngoing = true;
                    state.Spectating = false;
                    // Because when reconnecting a BG game (during a zone transition), we don't have the "entities removed" events
                    // so we have no idea if the entities that were previously on board are still there. However, because of how
                    // BG works, all minions (along with their enchantments) are removed and recreated; so we can use the latest
                    // state without fear of losing anything
                    if (state.IsBattlegrounds())
                    {
                        var minionIds = state.GameState.CurrentEntities.Values
                            .Where(e => e.GetCardType() == (int)CardType.MINION)
                            .Select(e => e.Id)
                            .ToList();
                        foreach (var minionId in minionIds)
                        {
                            state.GameState.CurrentEntities.Remove(minionId);
                        }
                    }
                    state.UpdateCurrentNode(typeof(Game));
                    // Don't reset anything
                    return true;
                }

                helper.NewGame();
                if (stateType == StateType.GameState)
                {
                    metadata.BuildNumber = -1;
                    metadata.FormatType = -1;
                    metadata.GameType = -1;
                    metadata.ScenarioID = -1;
                } 
                else
                {
                    var existingMetaData = gameInfoHelper.GetMetaData();
                    metadata.BuildNumber = existingMetaData.BuildNumber;
                    metadata.FormatType = existingMetaData.FormatType;
                    metadata.GameType = existingMetaData.GameType;
                    metadata.ScenarioID = existingMetaData.ScenarioID;
                }

                state.Reset(gameInfoHelper);
                state.NumberOfCreates++;
                state.CurrentGame = new Game
                {
                    TimeStamp = timestamp,
                    BuildNumber = metadata.BuildNumber,
                    ScenarioID = metadata.ScenarioID,
                    FormatType = metadata.FormatType,
                    GameType = metadata.GameType
                };
                state.Replay.Games.Add(state.CurrentGame);
                var newNode = new Node(typeof(Game), state.CurrentGame, 0, null, data);
                state.CreateNewNode(newNode);
                state.Node = newNode;
                Logger.Log("Created a new game", stateType + " " + timestamp + "," + previousTimestamp);
                return true;
            }
            return false;
        }
    }
}
