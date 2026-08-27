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
	public class ChoicesHandler
	{
		private Helper helper;

		public ChoicesHandler(Helper helper)
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

			var match = Regexes.ChoicesChoiceRegex.Match(data);
			if (match.Success)
			{
				state.UpdateCurrentNode(typeof(Game), typeof(Action));
				/*NOTE: in 10357, "Player" is bugged, it's treating a player ID
				as an entity ID, resulting in "Player=GameEntity"
				For our own sanity we keep the old playerID logic from the
				previous builds, we'll change to "player" when it's fixed.*/
				var rawId = match.Groups[1].Value;
                int id;
                int.TryParse(data, out id);
				var rawPlayer = match.Groups[2].Value;
				var rawTaskList = match.Groups[3].Value;
				var rawType = match.Groups[4].Value;
				var min = match.Groups[5].Value;
				var max = match.Groups[6].Value;
				//var entity = helper.ParseEntity(rawEntity);
				var player = helper.ParseEntity(rawPlayer);
				var type = helper.ParseEnum<ChoiceType>(rawType);
				int taskList = -1;
				taskList = int.TryParse(rawTaskList, out taskList) ? taskList : -1;
				state.Choices = new Choices
				{
					ChoiceList = new List<Choice>(),
					Id = id,
					Max = int.Parse(max),
					Min = int.Parse(min),
					PlayerId = player,
					TaskList = taskList,
					Type = type,
					TimeStamp = timestamp
				};
				if (state.Node.Type == typeof(Game))
                {
                    ((Game)state.Node.Object).AddData(state.Choices);
                }
				else if (state.Node.Type == typeof(Action))
					((Action)state.Node.Object).Data.Add(state.Choices);
				else
					throw new Exception("Invalid node " + state.Node.Type + " -- " + data);
				return;
			}

			match = Regexes.ChoicesSourceRegex.Match(data);
			if (match.Success)
			{
				var rawEntity = match.Groups[1].Value;
				var entity = helper.ParseEntity(rawEntity);
				state.Choices.Source = entity;
				return;
			}

			match = Regexes.ChoicesEntitiesRegex.Match(data);
			if (match.Success)
			{
				var index = match.Groups[1].Value;
				var rawEntity = match.Groups[2].Value;
				var entity = helper.ParseEntity(rawEntity);
				var choice = new Choice { Entity = entity, Index = int.Parse(index) };
				state.Choices.ChoiceList.Add(choice);
			}


			match = Regexes.ChoicesWaitingForInput.Match(data);
			if (match.Success)
			{
				int id;
				int.TryParse(data, out id);
				state.CreateNewNode(new Node(typeof(Choices), state.Choices, 0, null, data)); // It's not really a new node, but just a hack
			}
		}
	}
}