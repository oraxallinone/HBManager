using System;
using System.ComponentModel.DataAnnotations;

namespace HBManager.Models
{
    public class BudgetImportViewModel
    {
        [Required(ErrorMessage = "Bank Name is required")]
        [StringLength(150)]
        public string BankName { get; set; }

        [Required(ErrorMessage = "Year is required")]
        public int Year { get; set; }

        [Required(ErrorMessage = "Month is required")]
        public int Month { get; set; }

        [Required(ErrorMessage = "Transaction Type is required")]
        [StringLength(20)]
        public string TransactionType { get; set; }

        [Required(ErrorMessage = "Amount is required")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Transaction Date is required")]
        [DataType(DataType.DateTime)]
        public DateTime TransactionDate { get; set; }

        public string Details { get; set; }

        public bool IsTransfer { get; set; }

        // properties to return execution results to view
        public bool? IsSuccess { get; set; }
        public string Message { get; set; }
    }
}