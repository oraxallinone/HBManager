$(document).ready(function () {
    let crntMonthSalary = 0;

    // global container for uncut group list (name requested)
    var GobalGroupMasterUncut = [];
    var wasteByReference = {};

    var screenWidth = window.screen.width;
    console.log(screenWidth);
    $(".div-responsive").css("height", "67vh");

     // call on page load
    bindGet4Group();//1
    GetGroupMasterUncut();//2
    setThisYearMonth()//3 set month n year

    $("#lnkMaximize").click(function () {
        $(".div-responsive").css("height", "72vh");
    });

    $("#lnkMinimize").click(function () {
        $(".div-responsive").css("height", "67vh");
    });

    $("#btnSaveBudget").click(function () {
        if (validateBudget()) {
            InsertBudget();
        }
    });

    //
    $("#ddlMonth").change(function () {
        GetSalaryByMonthYear();
    });
    $("#ddlYear").change(function () {
        GetSalaryByMonthYear();
    });



    function validateBudget() {
        var year = $("#ddlYear").val();
        var month = $("#ddlMonth").val();
        var spendDate = $("#txtDate").val();
        var amount = $("#txtAmt").val();
        var details = $("#txtDetails").val();

        if (year === "0" || year === "") {
            alert("Please select a Year");
            $("#ddlYear").focus();
            return false;
        }

        if (month === "0" || month === "") {
            alert("Please select a Month");
            $("#ddlMonth").focus();
            return false;
        }

        if (spendDate.trim() === "") {
            alert("Please select a Spend Date");
            $("#txtDate").focus();
            return false;
        }

        if (amount.trim() === "" || isNaN(amount) || parseFloat(amount) <= 0) {
            alert("Please enter a valid Amount");
            $("#txtAmt").focus();
            return false;
        }

        if (details.trim() === "") {
            alert("Please enter Details");
            $("#txtDetails").focus();
            return false;
        }

        return true;
    }

    function InsertBudget() {
        let obj = {
            Year: parseInt($("#ddlYear").val()),
            Month: parseInt($("#ddlMonth").val()),
            SpendDate: $("#txtDate").val(),
            Amount: parseFloat($("#txtAmt").val()),
            Details: $("#txtDetails").val(),
            G1: $("#searchDDlG1").val() === "" ? null : $("#searchDDlG1").val(),
            G2: $("#searchDDlG2").val() === "" ? null : $("#searchDDlG2").val(),
            G3: $("#searchDDlG3").val() === "" ? null : $("#searchDDlG3").val(),
            G4: $("#searchDDlG4").val() === "" ? null : $("#searchDDlG4").val()
        };
        $.ajax({
            url: "/Budget/InsertBudget",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(obj),
            dataType: "json",
            success: function (rowIffected) {
                if (rowIffected > 0) {
                    showMessage(rowiffected);
                    fnClearAmtDetails();
                } else {
                    alert("Error: Failed to insert budget record");
                }
            },
            error: function (xhr, status, error) {
                alert("Error occurred: " + error);
                console.log(xhr.responseText);
            }
        });
    }

    function fnClearAmtDetails() {
        $("#txtAmt").val("");
        $("#txtDetails").val("");
    }

    function showMessage(msg) {
        var msg = $('<div id="tempMessage">complete ' + msg + '</div>');
        // Style it like an alert popup
        msg.css({
            position: 'fixed',
            top: '12%',
            right: '43%',
            padding: '12px 20px',
            background: '#4CAF50',
            color: '#fff',
            'font-weight': 'bold',
            'border-radius': '6px',
            'z-index': 999999,
            'box-shadow': '0 0 8px rgba(0,0,0,0.3)'
        });

        // Append to body
        $('body').append(msg);

        // Remove after 1 second
        setTimeout(function () {
            $('#tempMessage').fadeOut(300, function () {
                $(this).remove();
            });
        }, 1000);
    }

    function bindGet4Group() {
        $.ajax({
            url: '/Budget/Get4Group',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                // ensure selects exist
                var $g1 = $('#searchDDlG1'), $g2 = $('#searchDDlG2'), $g3 = $('#searchDDlG3'), $g4 = $('#searchDDlG4');

                // reset with default options
                $g1.empty().append('<option value="0">-- G1 --</option>');
                $g2.empty().append('<option value="0">-- G2 --</option>');
                $g3.empty().append('<option value="0">-- G3 --</option>');
                $g4.empty().append('<option value="0">-- G4 --</option>');

                if (!res) return;

                if (res.G1Groups && res.G1Groups.length) {
                    $.each(res.G1Groups, function (i, item) {
                        $g1.append($('<option>').val(item.GroupId).text(item.GroupName));
                    });
                }
                if (res.G2Groups && res.G2Groups.length) {
                    $.each(res.G2Groups, function (i, item) {
                        $g2.append($('<option>').val(item.GroupId).text(item.GroupName));
                    });
                }
                if (res.G3Groups && res.G3Groups.length) {
                    $.each(res.G3Groups, function (i, item) {
                        $g3.append($('<option>').val(item.GroupId).text(item.GroupName));
                    });
                }
                if (res.G4Groups && res.G4Groups.length) {
                    $.each(res.G4Groups, function (i, item) {
                        $g4.append($('<option>').val(item.GroupId).text(item.GroupName));
                    });
                }
            },
            error: function (xhr, status, err) {
                console.error('bindGet4Group error:', err);
            }
        });
    }

    function bindData() {
        var year = parseInt($("#ddlYear").val(), 10) || 0;
        var month = parseInt($("#ddlMonth").val(), 10) || 0;

        var g1 = parseInt($("#searchDDlG1").val(), 10) || 0;
        var g2 = parseInt($("#searchDDlG2").val(), 10) || 0;
        var g3 = parseInt($("#searchDDlG3").val(), 10) || 0;
        var g4 = parseInt($("#searchDDlG4").val(), 10) || 0;
        var isAll = false;


        if (year === 0 || month === 0) {
            alert("Please select Year and Month");
            return;
        }
        $('#budgetLoader').show();
        $.ajax({
            url: '/Budget/GetAllBudgetFromToWithGroup',//GetAllBudgetFromToWithGroup||GetAllBudgetFromTo
            type: 'GET',
            data: { year: year, month: month, g1: g1, g2: g2, g3: g3, g4: g4, isAll: isAll },
            dataType: 'json',
            success: function (res) {
                $("#gridTableBudget tbody").empty();

                if (!res || !res.length) {
                    $("#gridTableBudget tbody").html('<tr><td colspan="12" style="text-align:center;">No records found</td></tr>');
                    $('#budgetLoader').hide();
                    return;
                }

                var html = "";
                var idx = 1;
                let crntSum = 0;
                $.each(res, function (i, item) {
                    crntSum = crntSum + parseFloat(item.Amount);
                    let crntSumFormat = Intl.NumberFormat('en-IN').format(crntSum);
                    let remainSalary = crntMonthSalary - crntSum;

                    var spendDate = ToDateAndDay(item.SpendDateText || item.SpendDate);
                    var dayClassMain = ToDayExtraction(spendDate);
                    html += "<tr>";

                    //Date
                    html += "<td class='bg-main-day-" + dayClassMain + "'>" + spendDate + "</td>";


                    //#1        
                    html += "<td class='" + getDayClass(dayClassMain) + "'>  <span class='txt-spend'>" + crntSumFormat + " </span> </td>";
                    //#2        
                    html += "<td class='" + getDayClass(dayClassMain) + "'>  <span class='txt-remain'> " + Intl.NumberFormat('en-IN').format(remainSalary) + "</span> </td>"; //Intl.NumberFormat('en-IN').format(remainSalary)
                    //#3        
                    var waste = wasteByReference[item.Id] || {};
                    html += "<td class='waste-budget-cell " + getDayClass(dayClassMain) + "' data-reference-id='" + item.Id + "'>" + (waste.WasteAmount == null ? "" : escapeHtml(Intl.NumberFormat('en-IN').format(waste.WasteAmount))) + "</td>";
                    html += "<td class='budget-eye-cell " + getDayClass(dayClassMain) + "'><button type='button' class='budget-eye' data-id='" + item.Id + "' title='View or record waste' aria-label='View or record waste'><i class='fa fa-eye'></i></button></td>";


                    //Amt
                    html += "<td class='" + getDayClass(dayClassMain) + "' style='text-align:right;'>" + item.Amount + "</td>";

                    //Details
                    html += "<td class='" + getDayClass(dayClassMain) + "' style='padding-left: 15px;'>" + (item.Details || "") + "</td>";

                    html += "<td class='" + getDayClass(dayClassMain) + "'>" + (item.BankName ? "<div class='div-bank'>" + escapeHtml(item.BankName) + "</div>" : "") + "</td>";

                    html += "<td class='" + getDayClass(dayClassMain) + "'>" + (item.G1 ? "<div class='div-g1-c" + item.G1 + "' >" + escapeHtml(extractNameById(item.G1) || "") + "</div>" : "") + "</td>";//G1

                    html += "<td class='" + getDayClass(dayClassMain) + "'>" + (item.G2 ? "<div class='div-g2-c" + item.G2 + "' >" + escapeHtml(extractNameById(item.G2) || "") + "</div>" : "") + "</td>";//G2

                    html += "<td class='" + getDayClass(dayClassMain) + "'>" + (item.G3 ? "<div class='div-g3' >" + escapeHtml(extractNameById(item.G3) || "") + "</div>" : "") + "</td>";//G3

                    html += "<td class='" + getDayClass(dayClassMain) + "'>" + (item.G4 ? "<div class='div-g4-c" + item.G4 + "' >" + escapeHtml(extractNameById(item.G4) || "") + "</div>" : "") + "</td>";//G4

                    html += "</tr>";
                    idx++;
                });

                $("#gridTableBudget tbody").html(html);

                const items = document.querySelectorAll(".txt-spend");
                items[items.length - 1].style.fontWeight = "900";
                const items2 = document.querySelectorAll(".txt-remain");
                items2[items2.length - 1].style.fontWeight = "900";

                //tdRemain= crntMonthSalary - crntSum
                $('#tdSpending').html(Intl.NumberFormat('en-IN').format(crntSum))
                $('#tdRemain').html(Intl.NumberFormat('en-IN').format(crntMonthSalary - crntSum))
                loadWasteTracker();
            },
            error: function (xhr, status, err) {
                console.error('GetAllBudgetFromTo error:', err);
                $('#budgetLoader').hide();
                alert('Failed to load data.');
            }
        });
    }

    //31 Oct 2025 (Fri)
    function ToDateAndDay(jsonDate) {
        if (!jsonDate) return "";

        // Extract ticks from /Date(1762626600000)/
        var databaseDate = jsonDate.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
        var date;
        if (databaseDate) {
            date = new Date(Date.UTC(parseInt(databaseDate[1], 10), parseInt(databaseDate[2], 10) - 1, parseInt(databaseDate[3], 10), parseInt(databaseDate[4], 10), parseInt(databaseDate[5], 10), parseInt(databaseDate[6] || '0', 10)));
        } else {
            var ticks = parseInt(jsonDate.replace(/\/Date\((\d+)\)\//, "$1"));
            date = new Date(ticks);
        }

        var options = {
            timeZone: databaseDate ? 'UTC' : 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        var parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(date);
        var getPart = function (type) { return parts.find(function (part) { return part.type === type; }).value; };
        return `${getPart('day')} ${getPart('month')} ${getPart('year')} (${getPart('weekday')}) ${getPart('hour')}:${getPart('minute')} ${getPart('dayPeriod').toUpperCase()}`;
    }

    //set current month & year
    function setThisYearMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // getMonth() returns 0–11

        $("#ddlYear").val(year);
        $("#ddlMonth").val(month);

        GetSalaryByMonthYear();
    }


    //get salary details current month
    function GetSalaryByMonthYear() {
        var yearName = parseInt($("#ddlYear").val(), 10) || 0;
        var monthName = parseInt($("#ddlMonth").val(), 10) || 0;
        if (yearName == 0 || monthName == 0) {
            return false;
        }
        $.ajax({
            url: '/Salary/GetSalaryByMonthYear',
            type: 'GET',
            data: { monthName: monthName, yearName: yearName },
            dataType: 'json',
            success: function (res) {
                $('#tdSalary').html(Intl.NumberFormat('en-IN').format(res[0].SalaryAmount)).attr('title', res[0].SalaryAmount);//Intl.NumberFormat('en-IN').format(total)

                $('#tdNeedSalary').html(Intl.NumberFormat('en-IN').format(res[0].Need50)).attr('title', res[0].Need50);
                $('#tdSaveSalary').html(Intl.NumberFormat('en-IN').format(res[0].Save20)).attr('title', res[0].Save20);
                $('#tdWantSalary').html(Intl.NumberFormat('en-IN').format(res[0].Want30)).attr('title', res[0].Want30);

                crntMonthSalary = res[0].SalaryAmount;

                bindData();
            },
            error: function (xhr, status, err) {
                console.error('GetSalaryByMonthYear:', err);
            }
        });
    }

    //date to small day sun
    function ToDayExtraction(dateString) {
        if (!dateString) return "";

        // Find the part inside parentheses ( )
        var match = dateString.match(/\((.*?)\)/);

        if (match && match[1]) {
            return match[1].toLowerCase();  // return in lowercase
        }

        return "";
    }

    function loadWasteTracker() {
        var year = parseInt($('#ddlYear').val(), 10) || 0;
        var month = parseInt($('#ddlMonth').val(), 10) || 0;
        $.ajax({
            url: '/Budget/GetWasteTrackerByBudgetMonth',
            type: 'GET',
            data: { year: year, month: month },
            dataType: 'json',
            success: function (res) {
                wasteByReference = {};
                var wasteTotal = 0;
                $.each(res || [], function (i, item) {
                    wasteByReference[item.ReferenceID] = item;
                    wasteTotal += parseFloat(item.WasteAmount) || 0;
                });
                $('#tdWasteTotal').text(Intl.NumberFormat('en-IN').format(wasteTotal));
                $('.waste-budget-cell').each(function () {
                    var waste = wasteByReference[$(this).data('reference-id')];
                    $(this).text(waste ? Intl.NumberFormat('en-IN').format(waste.WasteAmount) : '')
                        .attr('title', waste ? waste.ReasonForWaste : '');
                });
                $('#budgetLoader').hide();
            },
            error: function () {
                $('#budgetLoader').hide();
                alert('Failed to load waste budget data.');
            }
        });
    }

    $(document).on('click', '.budget-eye', function () {
        var $row = $(this).closest('tr');
        var referenceId = $(this).data('id');
        var waste = wasteByReference[referenceId] || {};
        $('#wasteTrackerId').val(waste.Id || '');
        $('#wasteReferenceId').val(referenceId);
        $('#wasteBudgetDate').text($row.find('td').eq(0).text().trim());
        $('#wasteBudgetAmount').text($row.find('td').eq(5).text().trim());
        $('#wasteBudgetDetails').text($row.find('td').eq(6).text().trim());
        $('#wasteAmount').val(waste.WasteAmount == null ? '' : waste.WasteAmount);
        $('#wasteReason').val(waste.ReasonForWaste || '');
        $('#btnSaveWaste').text(waste.Id ? 'Update' : 'Insert');
        $('#btnDeleteWaste').toggle(!!waste.Id);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('wasteTrackerModal')).show();
    });

    $('#btnSaveWaste').click(function () {
        var wasteAmount = parseFloat($('#wasteAmount').val());
        var reason = $('#wasteReason').val().trim();
        if (isNaN(wasteAmount) || wasteAmount < 0 || !reason) {
            alert('Enter a waste amount and reason.');
            return;
        }
        var id = parseInt($('#wasteTrackerId').val(), 10) || 0;
        var payload = { Id: id, ReferenceID: parseInt($('#wasteReferenceId').val(), 10), WasteAmount: wasteAmount, ReasonForWaste: reason };
        $.ajax({
            url: id ? '/Budget/UpdateWasteTracker' : '/Budget/InsertWasteTracker',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(payload),
            dataType: 'json',
            success: function () {
                bootstrap.Modal.getOrCreateInstance(document.getElementById('wasteTrackerModal')).hide();
                bindData();
            },
            error: function () { alert('Failed to save waste budget.'); }
        });
    });

    $('#btnDeleteWaste').click(function () {
        var id = parseInt($('#wasteTrackerId').val(), 10) || 0;
        if (!id || !confirm('Delete this waste entry?')) return;
        $.post('/Budget/DeleteWasteTracker', { id: id }, function () {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('wasteTrackerModal')).hide();
            bindData();
        }).fail(function () { alert('Failed to delete waste budget.'); });
    });

    // Bootstrap sets aria-hidden while closing; release focus first.
    document.getElementById('wasteTrackerModal').addEventListener('hide.bs.modal', function () {
        var activeElement = document.activeElement;
        if (activeElement && this.contains(activeElement)) {
            activeElement.blur();
        }
    });

    function escapeHtml(value) {
        return $('<div>').text(value == null ? '' : value).html();
    }

    //convert day to class bg-day-sun
    function getDayClass(dayName) {
        switch (dayName) {
            case 'sun': return "bg-day-sun";
            case 'mon': return "bg-day-mon";
            case 'tue': return "bg-day-tue";
            case 'wed': return "bg-day-wed";
            case 'thu': return "bg-day-thu";
            case 'fri': return "bg-day-fri";
            case 'sat': return "bg-day-sat";
            default: return "";
        }
    }

    //load all the group to global array 
    function GetGroupMasterUncut() {
        $.ajax({
            url: '/Budget/GetGroupMasterUncut',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                //see
                GobalGroupMasterUncut = res || [];
            },
            error: function (xhr, status, err) {
                console.error('GetGroupMasterUncut error:', err);
                GobalGroupMasterUncut = [];
            }
        });
    }

    //id to group name convert
    function extractNameById(groupId) {
        if (!groupId) return "";

        var item = GobalGroupMasterUncut.find(x => x.GroupId === groupId);
        return item ? item.GroupName : "";
    }

    //var tooltipValue = $('#tdSalary').attr('title');
});