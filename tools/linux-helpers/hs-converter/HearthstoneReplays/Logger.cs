using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HearthstoneReplays
{
	class Logger
	{
		public static Action<object, object> Log = (string1, string2) =>
		{
			Console.WriteLine(string1 + ", " + string2);
		};
	}
}
