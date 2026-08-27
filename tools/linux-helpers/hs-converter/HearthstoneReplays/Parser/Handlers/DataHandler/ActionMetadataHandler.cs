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
using HearthstoneReplays.Parser.ReplayData.Meta;

namespace HearthstoneReplays.Parser.Handlers
{
    internal class ActionMetadataHandler
    {
        public static bool HandleActionMetaData(DateTime timestamp, string data, ParserState state, int indentLevel, Helper helper)
        {
            var match = Regexes.ActionMetadataRegex.Match(data);
            if (match.Success)
            {
                var rawMeta = match.Groups[1].Value;
                var rawData = match.Groups[2].Value;
                var info = match.Groups[3].Value;
                var parsedData = helper.ParseEntity(rawData);
                var meta = helper.ParseEnum<MetaDataType>(rawMeta);
                var metaData = new MetaData { Data = parsedData, Info = int.Parse(info), Meta = meta, MetaInfo = new List<Info>(), TimeStamp = timestamp };
                state.UpdateCurrentNode(typeof(Action));
                if (state.Node.Type == typeof(Action))
                    ((Action)state.Node.Object).Data.Add(metaData);
                else if (state.Node.Type == typeof(Game))
                    ((Game)state.Node.Object).AddData(metaData);
                else
                    throw new Exception("Invalid node " + state.Node.Type + " for " + timestamp + " " + data);
                var newNode = new Node(typeof(MetaData), metaData, indentLevel, state.Node, data);
                state.CreateNewNode(newNode);
                state.Node = newNode;
                return true;
            }
            return false;
        }
    }
}
