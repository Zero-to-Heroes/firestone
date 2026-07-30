namespace HackF5.UnitySpy.Crawler
{
    using JetBrains.Annotations;
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;
    using System.Threading.Tasks;

    public class Crawler
    {
        public static readonly string SEPARATOR = "-->";
        private readonly IAssemblyImage image;

        //private readonly TypeDefinitionViewModel.Factory typeDefinitionFactory;

        public delegate Crawler Factory(IAssemblyImage image);

        public List<TypeDefinitionViewModel> Types = new List<TypeDefinitionViewModel>();

        public Crawler(
            [NotNull] IAssemblyImage image)
        {
            this.image = image ?? throw new ArgumentNullException(nameof(image));

            //this.typeDefinitionFactory =
            //    typeDefinitionFactory ?? throw new ArgumentNullException(nameof(typeDefinitionFactory));
        }
    }
}
