#region

using System;
using System.Collections.Generic;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Events;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using Newtonsoft.Json;
using HearthstoneReplays.Parser.Handlers;

#endregion

namespace HearthstoneReplays.Parser.Handlers
{
    public class DataHandler
    {
        private readonly Helper helper;
        private readonly GameMetaData metadata = new GameMetaData();

        // Dictionary to map keywords to their respective handlers
        private readonly Dictionary<string, Func<DateTime, string, ParserState, StateType, StateFacade, int, bool>> handlers;

        public DataHandler(Helper helper)
        {
            this.helper = helper;

            // Initialize the handler dictionary
            handlers = new Dictionary<string, Func<DateTime, string, ParserState, StateType, StateFacade, int, bool>>
            {
                { "GameEntity EntityID=", (timestamp, data, state, stateType, facade, indent) => CreateGameHandler.HandleCreateGame(timestamp, data, state, indent) },
                { "PlayerID=", (timestamp, data, state, stateType, facade, indent) => PlayerNameHandler.HandlePlayerName(timestamp, data, state, stateType) },
                { "Player EntityID=", (timestamp, data, state, stateType, facade, indent) => CreatePlayerHandler.HandleCreatePlayer(data, state, facade, indent) },
                { "BLOCK_START", (timestamp, data, state, stateType, facade, indent) => BlockStartHandler.HandleBlockStart(timestamp, data, state, indent, helper) },
                { "BLOCK_END", (timestamp, data, state, stateType, facade, indent) => BlockEndHandler.HandleBlockEnd(data, state) },
                { "BuildNumber=", (timestamp, data, state, stateType, facade, indent) => MetaDataHandler.HandleMetaData(timestamp, data, state, stateType, metadata, helper) },
                { "GameType=", (timestamp, data, state, stateType, facade, indent) => MetaDataHandler.HandleMetaData(timestamp, data, state, stateType, metadata, helper) },
                { "FormatType=", (timestamp, data, state, stateType, facade, indent) => MetaDataHandler.HandleMetaData(timestamp, data, state, stateType, metadata, helper) },
                { "ScenarioID=", (timestamp, data, state, stateType, facade, indent) => MetaDataHandler.HandleMetaData(timestamp, data, state, stateType, metadata, helper) },
                { "TAG_CHANGE", (timestamp, data, state, stateType, facade, indent) => TagChangeHandler.HandleTagChange(timestamp, data, state, stateType, facade, indent, helper) },
                { "tag=", (timestamp, data, state, stateType, facade, indent) => TagHandler.HandleTag(timestamp, data, state, helper) },
                { "SHUFFLE_DECK", (timestamp, data, state, stateType, facade, indent) => ShuffleDeckHandler.HandleShuffleDeck(timestamp, data, state, indent) },
                { "FULL_ENTITY", (timestamp, data, state, stateType, facade, indent) => FullEntityHandler.HandleFullEntity(timestamp, data, state, indent, helper) },
                { "SHOW_ENTITY", (timestamp, data, state, stateType, facade, indent) => ShowEntityHandler.HandleShowEntity(timestamp, data, state, indent, helper) },
                { "CHANGE_ENTITY", (timestamp, data, state, stateType, facade, indent) => ChangeEntityHandler.HandleChangeEntity(timestamp, data, state, indent, helper) },
                { "HIDE_ENTITY", (timestamp, data, state, stateType, facade, indent) => HideEntityHandler.HandleHideEntity(timestamp, data, state, indent, helper) },
                { "SUB_SPELL_START", (timestamp, data, state, stateType, facade, indent) => SubSpellHandler.HandleSubSpell(timestamp, data, state, stateType, facade, helper) },
                { "Source =", (timestamp, data, state, stateType, facade, indent) => SubSpellHandler.HandleSubSpell(timestamp, data, state, stateType, facade, helper) },
                { "Targets", (timestamp, data, state, stateType, facade, indent) => SubSpellHandler.HandleSubSpell(timestamp, data, state, stateType, facade, helper) },
                { "SUB_SPELL_END", (timestamp, data, state, stateType, facade, indent) => SubSpellHandler.HandleSubSpell(timestamp, data, state, stateType, facade, helper) },
                { "META_DATA", (timestamp, data, state, stateType, facade, indent) => ActionMetadataHandler.HandleActionMetaData(timestamp, data, state, indent, helper) },
                { "Info", (timestamp, data, state, stateType, facade, indent) => ActionMetadataInfoHandler.HandleActionMetaDataInfo(timestamp, data, state, indent, helper) },
            };
        }

        public void Handle(DateTime timestamp, string data, ParserState state, StateType stateType, DateTime previousTimestamp, StateFacade stateFacade, 
            long currentGameSeed, bool resettingGame)
        {
            var trimmed = data.Trim();
            //Logger.Log("trimmed", trimmed);
            var indentLevel = data.Length - trimmed.Length;
            data = trimmed;

            // Additional handlers for specific cases
            // Take care of leftover log lines from a possible previous game
            if (NewGameHandler.HandleNewGame(timestamp, data, state, previousTimestamp, stateType, stateFacade, currentGameSeed, resettingGame, metadata, helper))
            {
                return;
            }
            else if (data.Contains("Begin Spectating") || data.Contains("End Spectator Mode"))
            {
                SpectatorHandler.HandleSpectator(timestamp, data, state, stateFacade);
                return;
            }

            if (state.Node != null)
            {
                // Pre-filter lines using string operations
                foreach (var handler in handlers)
                {
                    if (data.StartsWith(handler.Key))
                    {
                        if (handler.Value(timestamp, data, state, stateType, stateFacade, indentLevel))
                        {
                            return;
                        }
                    }
                }
            }

            // Handle fallback cases
            if (state.Ended || state.CurrentGame == null)
            {
                return;
            }
        }
    }
}