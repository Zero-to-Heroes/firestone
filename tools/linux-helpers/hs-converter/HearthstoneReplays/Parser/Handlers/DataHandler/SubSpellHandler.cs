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
    internal class SubSpellHandler
    {
        public static bool HandleSubSpell(DateTime timestamp, string data, ParserState state, StateType stateType, StateFacade stateFacade, Helper helper)
        {
            var match = Regexes.SubSpellStartRegex.Match(data);
            if (match.Success)
            {
                var subSpellPrefab = match.Groups[1].Value;
                var sourceEntityId = int.Parse(match.Groups[2].Value);
                Node parentActionNode = state.Node;
                while (parentActionNode != null && parentActionNode.Type != typeof(Action))
                {
                    parentActionNode = parentActionNode?.Parent;
                }

                Action parentAction = null;
                if (parentActionNode != null)
                {
                    parentAction = parentActionNode.Object as Action;
                }
                if (sourceEntityId == 0)
                {
                    sourceEntityId = parentAction?.Entity ?? -1;
                }
                var sourceEntity = state.GameState.CurrentEntities.ContainsKey(sourceEntityId) ? state.GameState.CurrentEntities[sourceEntityId] : null;
                var spell = new SubSpell()
                {
                    Prefab = subSpellPrefab,
                    Timestamp = timestamp,
                };
                SetActiveSubSpell(state, spell);
                if (parentAction != null)
                {
                    parentAction.SubSpells.Add(spell);
                }

                state.NodeParser.NewNode(new Node(typeof(SubSpell), state.CurrentSubSpell?.GetActiveSubSpell(), 0, state.Node, data), stateType);
                if (stateType == StateType.PowerTaskList && !state.IsBattlegrounds())
                {
                    state.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                        timestamp,
                        "SUB_SPELL_START",
                        () => new GameEvent
                        {
                            Type = "SUB_SPELL_START",
                            Value = new
                            {
                                PrefabId = subSpellPrefab,
                                EntityId = sourceEntityId,
                                CardId = sourceEntity?.CardId,
                                ParentEntityId = parentAction?.Entity,
                                ParentCardId = state.GameState.CurrentEntities.ContainsKey(parentAction?.Entity ?? -1) ? state.GameState.CurrentEntities[parentAction.Entity].CardId : null,
                                LocalPlayer = stateFacade.LocalPlayer,
                                OpponentPlayer = stateFacade.OpponentPlayer,
                                ControllerId = sourceEntity?.GetController(),
                            }
                        },
                        false,
                        new Node(null, null, 0, null, data)
                    )});
                }
                return true;
            }

            match = Regexes.SubSpellSourceRegex.Match(data);
            if (match.Success && state.CurrentSubSpell != null)
            {
                var rawEntity = match.Groups[1].Value;
                var entity = helper.ParseEntity(rawEntity);
                state.CurrentSubSpell.GetActiveSubSpell().Source = entity;
                return true;
            }

            match = Regexes.SubSpellTargetsRegex.Match(data);
            if (match.Success && state.CurrentSubSpell != null)
            {
                var rawEntity = match.Groups[1].Value;
                var entity = helper.ParseEntity(rawEntity);
                if (state.CurrentSubSpell.GetActiveSubSpell().Targets == null)
                {
                    state.CurrentSubSpell.GetActiveSubSpell().Targets = new List<int>();
                }
                state.CurrentSubSpell.GetActiveSubSpell().Targets.Add(entity);
                return true;
            }

            if (data == "SUB_SPELL_END")
            {
                //Logger.Log("Sub spell end", this.currentSubSpell);
                var debug = state.CurrentSubSpell?.GetActiveSubSpell();
                state.NodeParser.CloseNode(new Node(typeof(SubSpell), state.CurrentSubSpell?.GetActiveSubSpell(), 0, state.Node, data), stateType);
                if (stateType == StateType.PowerTaskList && state.CurrentSubSpell != null && !state.IsBattlegrounds())
                {
                    var subSpell = state.CurrentSubSpell.GetActiveSubSpell();
                    Action parentAction = null;
                    if (state.Node?.Type == typeof(Action))
                    {
                        parentAction = state.Node.Object as Action;
                    }
                    var sourceEntityId = subSpell.Source;
                    if (sourceEntityId == 0)
                    {
                        sourceEntityId = parentAction?.Entity ?? -1;
                    }
                    var sourceEntity = state.GameState.CurrentEntities.ContainsKey(sourceEntityId) ? state.GameState.CurrentEntities[sourceEntityId] : null;
                    state.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                        timestamp,
                        "SUB_SPELL_END",
                        () => new GameEvent
                        {
                            Type = "SUB_SPELL_END",
                            Value = new
                            {
                                PrefabId = subSpell.Prefab,
                                SourceEntityId = sourceEntityId,
                                SourceCardId = sourceEntity?.CardId,
                                TargetEntityIds = subSpell.Targets,
                                LocalPlayer = stateFacade.LocalPlayer,
                                OpponentPlayer = stateFacade.OpponentPlayer,
                                ControllerId = sourceEntity?.GetController(),
                            }
                        },
                        false,
                        new Node(null, null, 0, null, data)
                    )});
                }
                SetActiveSubSpell(state, null);
                return true;
            }
            return false;
        }

        private static void SetActiveSubSpell(ParserState state, SubSpell spell)
        {
            var type = state.StateType;
            if (spell != null)
            {
                if (state.CurrentSubSpell == null)
                {
                    state.CurrentSubSpell = spell;
                }
                else
                {
                    state.CurrentSubSpell.GetActiveSubSpell().Spell = spell;
                }
            }
            else
            {
                state.ClearActiveSubSpell();
            }
        }
    }
}
