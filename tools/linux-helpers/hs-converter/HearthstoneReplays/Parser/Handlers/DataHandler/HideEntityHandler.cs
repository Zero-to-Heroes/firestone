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
    internal class HideEntityHandler
    {
        public static bool HandleHideEntity(DateTime timestamp, string data, ParserState state, int indentLevel, Helper helper)
        {
            var match = Regexes.ActionHideEntityRegex.Match(data);
            if (match.Success)
            {
                var rawEntity = match.Groups[1].Value;
                var tagName = match.Groups[2].Value;
                var value = match.Groups[3].Value;
                var entity = helper.ParseEntity(rawEntity);
                var zone = helper.ParseTag(tagName, value);

                var hideEntity = new HideEntity { Entity = entity, Zone = zone.Value, TimeStamp = timestamp };
                state.UpdateCurrentNode(typeof(Game), typeof(Action));

                if (state.Node.Type == typeof(Game))
                    ((Game)state.Node.Object).AddData(hideEntity);
                else if (state.Node.Type == typeof(Action))
                    ((Action)state.Node.Object).Data.Add(hideEntity);
                else
                    throw new Exception("Invalid node: " + state.Node.Type);

                var newNode = new Node(typeof(HideEntity), hideEntity, indentLevel, state.Node, data);
                state.CreateNewNode(newNode);
                state.Node = newNode;
                return true;
            }
            return false;
        }
    }
}
