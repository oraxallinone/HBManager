using System.ComponentModel.DataAnnotations;

namespace HBManager.Models
{
    public class QueryViewModel
    {
        [Required(ErrorMessage = "Please enter an SQL query.")]
        public string SqlQuery { get; set; }

        // Used to display success/error messages back to the user
        public string Message { get; set; }
        public bool IsSuccess { get; set; }
    }
}