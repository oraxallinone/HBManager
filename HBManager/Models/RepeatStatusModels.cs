using System.Collections.Generic;

namespace HBManager.Models
{
    public class RepeatStatusRow
    {
        public int? G1Id { get; set; }
        public string G1Name { get; set; }
        public int? G2Id { get; set; }
        public string G2Name { get; set; }
        public int? G3Id { get; set; }
        public string G3Name { get; set; }
        public int? G4Id { get; set; }
        public string G4Name { get; set; }
        public Dictionary<string, decimal> Amounts { get; set; }
        public HashSet<string> CompletedColumns { get; set; }
    }

    public class RepeatStatusResult
    {
        public List<string> Columns { get; set; }
        public List<RepeatStatusRow> Rows { get; set; }
    }
}