#region

using System.Linq;
using System.Collections.Generic;
using System.Xml.Serialization;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Parser.ReplayData.Meta.Options;
using System;

#endregion

namespace HearthstoneReplays.Parser.ReplayData
{
	public class Game
	{
        public readonly object listLock = new object();

        [XmlIgnore]
		public DateTime TimeStamp { get; set; }

        [XmlAttribute("ts")]
        public string TsForXml
        {
            get
            {
                var hours = TimeStamp.Hour;
                if (hours < ReplayParser.start.Hour)
                {
                    hours += 24;
                }
                var timestampString = this.TimeStamp.ToString("HH:mm:ss.ffffff");
                var split = timestampString.Split(':');
                return ("" + hours).PadLeft(2, '0') + ":" + split[1] + ":" + split[2];
            }
            set => this.TimeStamp = DateTime.Parse(value);
        }

        [XmlAttribute("buildNumber")]
		public int BuildNumber { get; set; }

		[XmlAttribute("type")]
		public int Type { get; set; }

		[XmlAttribute("gameType")]
		public int GameType { get; set; }

		[XmlAttribute("formatType")]
		public int FormatType { get; set; }

		[XmlAttribute("scenarioID")]
		public int ScenarioID { get; set; }

		[XmlAttribute("gameSeed")]
		public int GameSeed { get; set; }

		[XmlElement("Block", typeof(GameActions.Action))]
		[XmlElement("Choices", typeof(Choices))]
		[XmlElement("FullEntity", typeof(FullEntity))]
		[XmlElement("GameEntity", typeof(GameEntity))]
		[XmlElement("ChangeEntity", typeof(ChangeEntity))]
		[XmlElement("ShowEntity", typeof(ShowEntity))]
		[XmlElement("HideEntity", typeof(HideEntity))]
		[XmlElement("Options", typeof(Options))]
		[XmlElement("Player", typeof(PlayerEntity))]
		[XmlElement("SendChoices", typeof(SendChoices))]
		[XmlElement("SendOption", typeof(SendOption))]
		[XmlElement("TagChange", typeof(TagChange))]
		[XmlElement("MetaData", typeof(MetaData))]
		[XmlElement("ChosenEntities", typeof(ChosenEntities))]
		[XmlElement("ShuffleDeck", typeof(ShuffleDeck))]
		public List<GameData> Data { get; set; }

        public Game()
		{
			Data = new List<GameData>();
            FormatType = -1;
            GameType = -1;
        }

        public void AddData(GameData data)
        {
            lock (listLock)
            {
                Data.Add(data);
            }
        }

		/// <summary>
		/// CAUTION: it builds the whole data and return it to you.
		/// So if you're interested in getting a specific node, it's probably best to iterate over it yourself
		/// </summary>
		/// <param name="types"></param>
		/// <returns></returns>
		internal List<GameData> FilterGameData(params System.Type[] types)
		{
			// Build the list - could probably be built incrementally instead of rebuilding it completely every time
			List<GameData> result = new List<GameData>();
            lock (listLock)
            {
			    foreach (GameData data in Data)
			    {
				    result.Add(data);
				    ExtractData(result, data);
			    }

			    // Now filter it
			    return result.Where(data => types == null || types.Contains(data.GetType())).ToList();
            }
		}

        internal void ExtractData(List<GameData> result, GameData data)
		{
			if (data.GetType() == typeof(GameActions.Action))
			{
				foreach (GameData gameData in ((GameActions.Action) data).Data)
				{
					result.Add(gameData);
					if (data != gameData)
					{
						gameData.InternalParent = data;
					}
					ExtractData(result, gameData);
				}
			}
		}

		public GameActions.Action GetLastAction(Predicate<GameActions.Action> predicate)
		{
			lock (listLock)
			{
				return GetLastActionInternal(Data, predicate);
			}
		}

        private GameActions.Action GetLastActionInternal(List<GameData> GameData, Predicate<GameActions.Action> predicate)
        {
            lock (listLock)
            {
                for (var i = GameData.Count - 1; i >= 0; i--)
                {
                    if (GameData[i].GetType() != typeof(GameActions.Action))
                    {
                        continue;
                    }
                    var action = GameData[i] as GameActions.Action;
					var childMatch = GetLastActionInternal(action.Data, predicate);
                    if (childMatch != null)
                    {
						return childMatch;
                    }
                    if (predicate(action))
                    {
                        return action;
                    }
                }
				return null;
            }
        }
    }
}