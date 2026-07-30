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
    internal class BlockStartHandler
    {
        public static bool HandleBlockStart(DateTime timestamp, string data, ParserState state, int indentLevel, Helper helper)
        {
            var debug = data.StartsWith("BLOCK_START BlockType=DEATHS Entity=GameEntity EffectCardId=System.Collections.Generic.List`1[System.String] EffectIndex=0 Target=0 SubOption=-1");
            // Early check: only run regex if line contains "BLOCK_START"
            if (!data.Contains("BLOCK_START"))
            {
                return false;
            }
            var match = Regexes.ActionStartRegex.Match(data);
            if (match.Success)
            {
                var rawType = match.Groups[1].Value;
                var rawEntity = match.Groups[2].Value;
                var effectId = match.Groups[3].Value;
                var effectIndex = match.Groups[4].Value;
                var rawTarget = match.Groups[5].Value;
                var subOption = int.Parse(match.Groups[6].Value);
                var rawTriggerKeyword = match.Groups[7].Value;

                //Console.WriteLine("Really updating entityname " + rawEntity + " for full log " + data);
                state.GameState.UpdateEntityName(rawEntity);

                var entity = helper.ParseEntity(rawEntity);
                var target = helper.ParseEntity(rawTarget);
                var type = helper.ParseEnum<BlockType>(rawType);
                var triggerKeyword = helper.ParseEnum<GameTag>(rawTriggerKeyword);
                var action = new Action
                {
                    Data = new List<GameData>(),
                    Entity = entity,
                    Target = target,
                    TimeStamp = timestamp,
                    Type = type,
                    SubOption = subOption,
                    TriggerKeyword = triggerKeyword,
                    DebugCreationLine = data,
                };
                if (effectIndex != null && effectIndex.Length > 0)
                {
                    action.EffectIndex = int.Parse(effectIndex);
                }

                // Some battlegrounds files do not balance the BLOCK_START and BLOCK_END
                // This seems to be mainly about ATTACK block
                // see https://github.com/HearthSim/python-hslog/commit/63e9e41976cbec7ef95ced0f49f4b9a06c02cf3c
                if (type == (int)BlockType.PLAY)
                {
                    // PLAY is always at the root
                    state.UpdateCurrentNode(typeof(Game));
                }
                // Attack blocks should only have TRIGGER beneath them. If something else, it certainly
                // means the ATTACK block wasn't correctly closed
                else if (type != (int)BlockType.TRIGGER && state.Node?.Type == typeof(Action))
                {
                    var parentAction = state.Node.Object as Action;
                    if (parentAction.Type == (int)BlockType.ATTACK)
                    {
                        state.UpdateCurrentNode(typeof(Game));
                    }
                }

                state.UpdateCurrentNode(typeof(Game), typeof(Action));
                if (state.Node.Type == typeof(Game))
                    ((Game)state.Node.Object).AddData(action);
                else if (state.Node.Type == typeof(Action))
                    ((Action)state.Node.Object).Data.Add(action);
                else
                    throw new Exception("Invalid node " + state.Node.Type);
                var newNode = new Node(typeof(Action), action, indentLevel, state.Node, data);
                state.CreateNewNode(newNode);
                // Logger.Log("Creating new node", newNode.CreationLogLine);
                state.Node = newNode;
                return true;
            }

            return false;
        }
    }
}
