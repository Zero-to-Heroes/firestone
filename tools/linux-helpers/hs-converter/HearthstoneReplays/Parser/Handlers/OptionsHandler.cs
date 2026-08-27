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
    public class OptionsHandler
    {
        private Helper helper;

        public OptionsHandler(Helper helper)
        {
            this.helper = helper;
        }

        public void Handle(DateTime timestamp, string data, ParserState state, StateType stateType, StateFacade stateFacade)
        {
            // This happens for the first options when spectating a game that has already started
            if (state.CurrentGame == null || state.Node == null)
            {
                return;
            }


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

            data = data.Trim();
            var match = Regexes.OptionsEntityRegex.Match(data);
            if (match.Success)
            {
                var id = match.Groups[1].Value;
                state.Options = new Options { Id = int.Parse(id), OptionList = new List<Option>(), TimeStamp = timestamp };
                // The "Options" blocks can appear in the middle of PTL lines. In that case, it acts as a BLOCK_END and goes back to the root
                // However, this only works for the GameState logs. In the case of PTL, the options can appear in the middle of 
                // an animation resolution.
                // So the next proposal will be to
                // 1. Check if a block is being interrupted
                // 2. If it is, store the log line preceding the options block
                // 3. In the PTL processing, after we encounter that log line, go back to root
                // UPDATE: this seems to be causing some issues in BG. So for now, I'm deactivating it.
                // As far as I've seen, the main issues with incorrectly formed logs were in constructed, but this needs further testing.
                // UPDATE 06/13/2023: In Duels, a DEATHS block got interrupted by some GameState entries. Let's try to deactivate it
                // completely, and see if it still causes some issues
                if (false && stateType == StateType.GameState && !stateFacade.IsBattlegrounds())
                {
                    if (
                        // Even if we're at the root, we force the update, so that it can also handle the cases where root blocks are truncated
                        //state.Node.Type != typeof(Game) 
                        // This doesn't have enough discriminating information to be used safely (ie it causes the root reset
                        // to happen on unwanted nodes
                        state.Node.Type != typeof(MetaData))
                    {
                        stateFacade.NotifyUpdateToRootNeeded();
                        state.UpdateCurrentNode(typeof(Game));
                        if (state.Node.Type == typeof(Game))
                        {
                            ((Game)state.Node.Object).AddData(state.Options);

                        }
                        else
                        {
                            throw new Exception("Invalid node " + state.Node.Type + " -- " + data);
                        }
                    }
                }
                else
                {
                    // Don't update the current node, as the "options" blocks can appera in the middle of some PTL lines
                    state.CurrentGame.AddData(state.Options);
                }


                return;
            }
            match = Regexes.OptionsOptionRegex.Match(data);
            if (match.Success)
            {
                var index = match.Groups[1].Value;
                var rawType = match.Groups[2].Value;
                var rawEntity = match.Groups[3].Value;
                var rawError = match.Groups[4].Value;

                var entity = helper.ParseEntity(rawEntity);
                var type = helper.ParseEnum<OptionType>(rawType);
                var error = helper.ParseEnum<PlayReq>(rawError);

                var option = new Option { Entity = entity, Index = int.Parse(index), Type = type, Error = error, OptionItems = new List<OptionItem>() };
                state.Options.OptionList.Add(option);
                state.CurrentOption = option;
                state.LastOption = option;
                return;
            }

            match = Regexes.OptionsSuboptionRegex.Match(data);
            if (match.Success)
            {
                var subOptionType = match.Groups[1].Value;
                var index = match.Groups[2].Value;
                var rawEntity = match.Groups[3].Value;
                var entity = helper.ParseEntity(rawEntity);

                if (subOptionType == "subOption")
                {
                    var subOption = new SubOption { Entity = entity, Index = int.Parse(index), Targets = new List<Target>() };
                    state.CurrentOption.OptionItems.Add(subOption);
                    state.LastOption = subOption;
                }
                else if (subOptionType == "target")
                {
                    var target = new Target { Entity = entity, Index = int.Parse(index) };
                    var lastOption = state.LastOption as Option;
                    if (lastOption != null)
                    {
                        lastOption.OptionItems.Add(target);
                        return;
                    }
                    var lastSubOption = state.LastOption as SubOption;
                    if (lastSubOption != null)
                        lastSubOption.Targets.Add(target);
                }
                else
                    throw new Exception("Unexpected suboption type: " + subOptionType);
            }
        }
    }
}