#region

using System;
using System.Collections.Generic;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.Meta;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

#endregion

namespace HearthstoneReplays.Parser.Handlers
{
	public class SendChoicesHandler
	{
		private Helper helper;

		public SendChoicesHandler(Helper helper)
        {
			this.helper = helper;
        }

		public void Handle(DateTime timestamp, string data, ParserState state)
        {
            // This happens for the first options when spectating a game that has already started
            if (state.CurrentGame == null || state.Node == null)
            {
                return;
            }

            data = data.Trim();
			var match = Regexes.SendChoicesChoicetypeRegex.Match(data);
			if(match.Success)
			{
				var id = match.Groups[1].Value;
				var rawType = match.Groups[2].Value;
			    var type = helper.ParseEnum<ChoiceType>(rawType);
				state.SendChoices = new SendChoices {Choices = new List<Choice>(), Entity = int.Parse(id), Type = type, TimeStamp = timestamp};
				if(state.Node.Type == typeof(Game))
					((Game)state.Node.Object).AddData(state.SendChoices);
				else if(state.Node.Type == typeof(Action))
					((Action)state.Node.Object).Data.Add(state.SendChoices);
				else
					throw new Exception("Invalid node " + state.Node.Type + " -- " + data);
				return;
			}
			match = Regexes.SendChoicesEntitiesRegex.Match(data);
			if(match.Success)
			{
				var index = helper.ParseEntity(match.Groups[1].Value);
				var id = helper.ParseEntity(match.Groups[2].Value);
				var choice = new Choice {Entity = id, Index = index};
				state.SendChoices.Choices.Add(choice);
			}
		}
	}
}