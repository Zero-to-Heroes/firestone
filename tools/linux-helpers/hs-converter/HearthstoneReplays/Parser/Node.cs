#region

using System;

#endregion

namespace HearthstoneReplays.Parser
{
	public class Node
	{
		private static int currentIndex = 0;

		public Node(Type type, object o, int indentLevel, Node parent, string creationLogLine)
		{
			Type = type;
			Object = o;
			IndentLevel = indentLevel;
			Parent = parent;
            CreationLogLine = creationLogLine;
            if (creationLogLine == null)
            {
                throw new Exception("Should not create nodes with empty creationLogLine: "
                    + type.ToString());
            }
			Index = currentIndex++;
		}

		public Type Type { get; set; }
		public object Object { get; set; }
		public int IndentLevel { get; set; }
		public Node Parent { get; set; }
		public string CreationLogLine { get; set; }
		public int Index { get; set; }
		public bool Closed { get; set; }
	}
}