#region

using System;
using System.Collections.Generic;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Events;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Parser.ReplayData.Meta.Options;

#endregion

namespace HearthstoneReplays.Parser.Handlers
{
    public class PowerProcessorHandler
    {
        private Helper helper;

        public PowerProcessorHandler(Helper helper)
        {
            this.helper = helper;
        }

        public void Handle(DateTime timestamp, string data, ParserState state, StateType stateType, StateFacade stateFacade)
        {
            if (stateType == StateType.PowerTaskList && state.ReconnectionOngoing)
            {
                state.ReconnectionOngoing = false;
                stateFacade.GsState.ReconnectionOngoing = false;
                state.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                    timestamp,
                    "RECONNECT_OVER",
                    () => {
                        return new GameEvent
                        {
                            Type = "RECONNECT_OVER",
                        };
                    },
                    false,
                    new Node(null, null, 0, null, data)) });
            }
        }
    }
}