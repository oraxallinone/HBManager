$(document).ready(function () {
    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    setThisYearMonth();

    //set current month & year
    function setThisYearMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // getMonth() returns 0–11

        $("#ddlYear").val(year);
        $("#ddlMonth").val(month);

        var y = parseInt($("#ddlYear").val(), 10) || 0;
        var m = parseInt($("#ddlMonth").val(), 10) || 0;
        if (y > 0 && m > 0) {
            GetBudgetOverview(y, m);
        }
    }

    // call on year/month change or page ready
    $("#ddlYear, #ddlMonth").on("change", function () {
        var y = parseInt($("#ddlYear").val(), 10) || 0;
        var m = parseInt($("#ddlMonth").val(), 10) || 0;
        if (y > 0 && m > 0) {
            GetBudgetOverview(y, m);
        }
    });

    function GetBudgetOverview(year, month) {
        $.ajax({
            url: "/BudgetOverview/BudgetOverview",
            type: "GET",
            data: { year: year, month: month },
            dataType: "json",
            success: function (res) {
                bindGridOverview(res || []);
            },
            error: function (xhr, status, err) {
                console.error("BudgetOverview error:", err);
            }
        });
    }

    function bindGridOverview(list) {
        var $tbody = $("#gridGroupOverview tbody");
        $tbody.empty();
        if (!list || !list.length) {
            $tbody.html('<tr><td colspan="5" class="text-center">No data found</td></tr>');
            return;
        }
        var html = "";
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var no = i + 1;
            let fixedAmt = (item.FixedAmount != null ? parseFloat(item.FixedAmount).toFixed(2) : "0.00");

            html += "<tr>";
            html += "<td class='text-center' style='width:7%'>" + no + "</td>";
            html += "<td style='width: 25%; text-align: left;'>" + (item.GroupName || '') + "</td>";
            html += "<td style='width:20%;text-align: right;'>" + fixedAmt + "</td>";
            if (fixedAmt == '0.00') {
                html += "<td style='width:20%;text-align: right;color:#175787; font-weight: 900;'>" + (item.SumAmount != null ? parseFloat(item.SumAmount).toFixed(2) : "0.00") + "</td>";
            }
            else {
                html += "<td style='width:20%;text-align: right;'>" + (item.SumAmount != null ? parseFloat(item.SumAmount).toFixed(2) : "0.00") + "</td>";
            }
            

            var remaining = (parseFloat(item.FixedAmount || 0) - parseFloat(item.SumAmount || 0));
            if (remaining == 0) {
                html += "<td style='width:20%;text-align: right;color:orange; font-weight: 900;'>" + 'Complete' + "</td>";
            }
            else {
                if (remaining < 0) {
                    if (fixedAmt == '0.00') {
                        //jadi fixed amt re value 0.00 thiba.
                        html += "<td style='width:20%;text-align: right;'> --- </td>";
                    }
                    else {
                        //jadi fixed amt re value set kara heithiba.
                        html += "<td style='width:20%;text-align: right;color:red; font-weight: 900;'>" + remaining.toFixed(0) + "</td>";
                    }
                }
                else {
                    //fixed ru balithiba amt
                    html += "<td style='width:20%;text-align: right;color:green;'>" + remaining.toFixed(0) + " </td>";
                }
            }

            html += "</tr>";
        }
        $tbody.html(html);
    }

    // expose functions if needed
    window.GetBudgetOverview = GetBudgetOverview;
    window.bindGridOverview = bindGridOverview;
});