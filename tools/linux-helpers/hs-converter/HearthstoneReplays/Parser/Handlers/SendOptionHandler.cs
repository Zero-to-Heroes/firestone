#region

using System;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.Meta.Options;

#endregion

namespace HearthstoneReplays.Parser.Handlers
{
	public class SendOptionHandler
	{
		public void Handle(string timestamp, string data, ParserState state)
        {
            // This happens for the first options when spectating a game that has already started
            if (state.CurrentGame == null || state.Node == null)
            {
                return;
            }

            data = data.Trim();
			var match = Regexes.SendOptionRegex.Match(data);
			if(match.Success)
			{
				var option = match.Groups[1].Value;
				var suboption = match.Groups[2].Value;
				var target = match.Groups[3].Value;
				var position = match.Groups[4].Value;
				var sendOption = new SendOption
				{
					OptionIndex = int.Parse(option),
					Position = int.Parse(position),
					SubOption = int.Parse(suboption),
					Target = int.Parse(target)
				};
				if(state.Node.Type == typeof(Game))
					((Game)state.Node.Object).AddData(sendOption);
				else
					throw new Exception("Invalid node " + state.Node.Type + " -- " + data);
			}
		}
	}
}