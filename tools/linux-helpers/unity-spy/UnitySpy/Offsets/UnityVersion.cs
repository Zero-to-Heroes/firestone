namespace HackF5.UnitySpy.Offsets
{
    using System;
    using System.Linq;

    public struct UnityVersion
    {
        public static readonly UnityVersion Version2018_4_10 = new UnityVersion(2018, 4, 10);
        public static readonly UnityVersion Version2019_4_5 = new UnityVersion(2019, 4, 5);
        public static readonly UnityVersion Version2020_3_13 = new UnityVersion(2020, 3, 13);

        public UnityVersion(int year, int versionWithinYear, int subversionWithinYear)
        {
            this.Year = year;
            this.VersionWithinYear = versionWithinYear;
            this.SubversionWithinYear = subversionWithinYear;
        }

        public int Year { get; }

        public int VersionWithinYear { get; }

        public int SubversionWithinYear { get; }

        public static bool operator ==(UnityVersion a, UnityVersion b) => a.Equals(b);

        public static bool operator !=(UnityVersion a, UnityVersion b) => !(a == b);

        public static UnityVersion Parse(string version)
        {
            if (version == null)
            {
                throw new ArgumentNullException("version paramenter cannot be null");
            }

            string[] versionSplit = version.Split('.');
            int subversionWithinYear = int.Parse(new string(versionSplit[2].TakeWhile(char.IsDigit).ToArray()));
            return new UnityVersion(int.Parse(versionSplit[0]), int.Parse(versionSplit[1]), subversionWithinYear);
        }

        public override bool Equals(object obj)
        {
            if (obj is UnityVersion other)
            {
                return other.Year == this.Year &&
                        other.VersionWithinYear == this.VersionWithinYear &&
                        other.SubversionWithinYear == this.SubversionWithinYear;
            }
            else
            {
                return false;
            }
        }

        public override int GetHashCode()
        {
            int hash = 17;
            hash = (hash * 27) + this.Year.GetHashCode();
            hash = (hash * 23) + this.VersionWithinYear.GetHashCode();
            hash = (hash * 13) + this.SubversionWithinYear.GetHashCode();
            return hash;
        }

        public override string ToString()
        {
            return this.Year + "." + this.VersionWithinYear + "." + this.SubversionWithinYear;
        }
    }
}