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

namespace HearthstoneReplays.Parser.Handlers
{
    internal class BlockEndHandler
    {
        public static bool HandleBlockEnd(string data, ParserState state)
        {
            if (data == "BLOCK_END") 
            {
                if (state.Node.Type != typeof(Game))
                {
                    // Logger.Log("Current node after end action", state.Node.CreationLogLine);
                    state.UpdateCurrentNode(typeof(Game), typeof(Action));
                    // Logger.Log("Preparing to end action", timestamp);
                    state.EndAction();
                }
                // Logger.Log("Current node after update // " + state.Node.Type + " // " + (state.Node.Type == typeof(Action)), state.Node.CreationLogLine);
                state.Node = state.Node.Parent ?? state.Node;
                // Logger.Log("Current node is now", state.Node.CreationLogLine);
                return true;
            }
            return false;
        }
    }
}
