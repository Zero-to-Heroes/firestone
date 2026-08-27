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
    internal class SpectatorHandler
    {
        public static bool HandleSpectator(DateTime timestamp, string data, ParserState state, StateFacade stateFacade)
        {
            // Only trigger the reset when spectator mode happens for the first time 
            if (data.Contains("Begin Spectating") && !data.Contains("2nd"))
            {
                Logger.Log("Will handle spectate log", data);
                state.Reset(stateFacade);
                state.Spectating = true;
                state.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                    timestamp,
                    "SPECTATING",
                    () => new GameEvent
                    {
                        Type = "SPECTATING",
                        Value = new
                        {
                            LocalPlayer = stateFacade.LocalPlayer,
                            OpponentPlayer = stateFacade.OpponentPlayer,
                            Spectating = true,
                        }
                    },
                    false,
                    new Node(null, null, 0, null, data),
                    true
                )});
            }
            if (data.Contains("End Spectator Mode"))
            {
                Logger.Log("Will handle end of spectate", data);
                if (stateFacade?.LocalPlayer == null)
                {
                    return false;
                }

                var replayCopy = state.Replay;
                var xmlReplay = new ReplayConverter().xmlFromReplay(replayCopy);
                var gameStateReport = state.GameState.BuildGameStateReport(stateFacade);
                state.Spectating = false;
                state.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                    timestamp,
                    "SPECTATING",
                    () => new GameEvent
                    {
                        Type = "SPECTATING",
                        Value = new
                        {
                            LocalPlayer = stateFacade.LocalPlayer,
                            OpponentPlayer = stateFacade.OpponentPlayer,
                            Spectating = false,
    }
},
                    false,
                    new Node(null, null, 0, null, data),
                    true
                )});
                state.EndCurrentGame();
                return true;
            }
            return false;
        }
    }
}
