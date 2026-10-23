using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace HBManager.Models
{
    public class BudgetFilterRequest
    {
        [Required]
        [Range(0, 9999)]
        public int? Year { get; set; }

        [Required]
        [Range(0, 12)]
        public int? Month { get; set; }

        public List<int> GroupIds { get; set; } = new List<int>();

        public bool IsAll { get; set; }

        public string SearchText { get; set; }
    }
}
