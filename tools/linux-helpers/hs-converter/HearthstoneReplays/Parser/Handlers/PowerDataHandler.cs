#region

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Events;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

#endregion

namespace HearthstoneReplays.Parser.Handlers
{
	public class PowerDataHandler
	{
		private Helper Helper { get; set; }

		public PowerDataHandler(Helper helper)
        {
			this.Helper = helper;
        }

		public void Handle(DateTime timestamp, string data, ParserState state)
		{
            //state.NodeParser.ReceiveAnimationLog(data);

			// Early check: only run regex if line contains the expected prefix
			if (data.Contains("BLOCK_START"))
			{
				var match = Regexes.ActionStartRegex.Match(data);
				if (match.Success)
				{
					//Console.WriteLine("Updating entity name from power data: " + data);
					var rawEntity = match.Groups[2].Value;
					state.GameState.UpdateEntityName(rawEntity);
					return;
				}
			}

			// Early check: only run regex if line contains "FULL_ENTITY"
			if (data.Contains("FULL_ENTITY"))
			{
				var match = Regexes.ActionFullEntityUpdatingRegex.Match(data);
				if(!match.Success)
				{
					match = Regexes.ActionFullEntityCreatingRegex.Match(data);
				}
				if(match.Success)
				{
					var rawEntity = match.Groups[1].Value;
					//Console.WriteLine("powerdata updating entityname " + rawEntity + " for full log " + timestamp + " " + data);
					state.GameState.UpdateEntityName(rawEntity);
					return;
				}
			}

			// Early check: only run regex if line contains "TAG_CHANGE"
			if (data.Contains("TAG_CHANGE"))
			{
				var match = Regexes.ActionTagChangeRegex.Match(data);
				if(match.Success)
				{
					var rawEntity = match.Groups[1].Value;
					state.GameState.UpdateEntityName(rawEntity);

					// Special case for players
					//var tagName = match.Groups[2].Value;
					//if (tagName == GameTag.MULLIGAN_STATE.ToString())
		//            {
					//	Helper.GetPlayerIdFromName(rawEntity);
		//            }
					return;
				}
			}
		}
	}
}