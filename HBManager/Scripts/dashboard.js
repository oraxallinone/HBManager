$(function () {
    //exec  dbo.SP_DashboardHeading 2026,1

    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    setThisYearMonth();

    // Load dashboard on button click
    $("#btnLoadDashboard").on("click", function () {
        LoadDashboardData();
    });

    //set current month & year
    function setThisYearMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // getMonth() returns 0–11

        $("#ddlYear").val(year);
        $("#ddlMonth").val(month);

        LoadDashboardData();
    }

    // Load on year/month change
    $("#ddlYear, #ddlMonth").on("change", function () {
        LoadDashboardData();
    });

    function LoadDashboardData() {
        var year = parseInt($("#ddlYear").val(), 10) || 0;
        var month = parseInt($("#ddlMonth").val(), 10) || 0;

        if (year === 0 || month === 0) {
            //alert("Please select Year and Month");
            return;
        }

        // First, load heading stats (SP)
        $.ajax({
            url: "/Default/GetCurrentMonthSalaryDetails",
            type: "POST",
            data: { year: year, month: month },
            dataType: "json",
            success: function (hdr) {
                BindDashboardHeading(hdr);
            },
            error: function (xhr, status, err) {
                console.error("GetCurrentMonthSalaryDetails error:", err);
            }
        });

        // Then load the group breakdown list
        $.ajax({
            url: "/BudgetOverview/BudgetOverview",
            type: "GET",
            data: { year: year, month: month },
            dataType: "json",
            success: function (res) {
                BindDashboardCards(res || []);
            },
            error: function (xhr, status, err) {
                console.error("LoadDashboardData error:", err);
                alert("Error loading dashboard data.");
            }
        });

    }

    function BindDashboardCards(list) {
        if (!list || !list.length) {
            $("#gridGroupBreakdown tbody").html('<tr><td colspan="6" class="text-center">No data found</td></tr>');
            ResetCards();
            return;
        }

        var totalBudget = 0;
        var totalSpent = 0;
        var tableHtml = "";

        console.log(list);
        list.sort((a, b) => b.FixedAmount - a.FixedAmount);

        $.each(list, function (idx, item) {
            var no = idx + 1;
            var spent = parseFloat(item.SumAmount || 0);
            var budget = parseFloat(item.FixedAmount || 0);
            var remaining = budget - spent;
            var percentage = budget > 0 ? ((spent / budget) * 100).toFixed(1) : 0;

            totalBudget += budget;
            totalSpent += spent;

            tableHtml += "<tr>";
            tableHtml += "<td class='text-center'>" + no + "</td>";
            tableHtml += "<td>" + (item.GroupName || "") + "</td>";
            tableHtml += "<td class='text-right amount-value'>₹ " + budget.toFixed(0) + "</td>";
            tableHtml += "<td class='text-right spent-value'>₹ " + spent.toFixed(0) + "</td>";

            if (budget > 0) { tableHtml += "<td class='text-right remaining-value'>₹ " + remaining.toFixed(0) + "</td>"; }
            else { tableHtml += "<td class='text-right remaining-value'>" + spent.toFixed(0) + "</td>"; }

            tableHtml += "<td class='text-center'>";
            if (budget > 0) { tableHtml += "<div class='progress-bar-container'>"; }

            tableHtml += percentage > 100// keep 234.1% in 100%
                                        ? "<div class='progress-bar-fill-over' style='width:100%'>" + percentage + "%</div>"
                                        : "<div class='progress-bar-fill' style='width:" + percentage + "%'>" + percentage + "%</div>";

            if (budget > 0) { tableHtml += "</div>"; }
            tableHtml += "</td>";
            tableHtml += "</tr>";
        });

        $("#gridGroupBreakdown tbody").html(tableHtml);
        // Update dashboard cards
        var totalRemaining = totalBudget - totalSpent;
        var totalPercentage = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

        //$("#dashTotalBudget").text("₹ " + totalBudget.toFixed(0));
        //$("#dashSpendingAmount").text("₹ " + totalSpent.toFixed(0));
        //$("#dashRemainingAmount").text("₹ " + totalRemaining.toFixed(0));
        //$("#dashPercentage").text(totalPercentage + "%");
    }

    function ResetCards() {
        $("#dashTotalBudget").text("₹ 0.00");
        $("#dashSpendingAmount").text("₹ 0.00");
        $("#dashRemainingAmount").text("₹ 0.00");
        $("#dashPercentage").text("0%");
    }

    function BindDashboardHeading(hdr) {
        if (!hdr || hdr.error) {
            ResetCards();
            return;
        }

        // hdr expected to have ThisMonthSalary, ThisMonthSpending, RemainingBalance, PercentSpending
        var salary = parseFloat(hdr.ThisMonthSalary || 0);
        var spending = parseFloat(hdr.ThisMonthSpending || 0);
        var remaining = parseFloat(hdr.RemainingBalance || 0);
        var percent = hdr.PercentSpending || (salary === 0 ? "0%" : "0%");
        $("#dashTotalBudget").text("₹ " + salary.toLocaleString('en-IN', { maximumFractionDigits: 0 }));
        $("#dashSpendingAmount").text("₹ " + spending.toLocaleString('en-IN', { maximumFractionDigits: 0 }));
        $("#dashRemainingAmount").text("₹ " + remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 }));

        $("#dashPercentage").text(percent);
    }
});