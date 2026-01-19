$(document).ready(function () {
    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    // set reasonable default scroll area height (no '!important' via jQuery)
    $(".div-responsive").css("height", "63vh");

    $("#lnkMaximize").click(function () {
        $(".div-responsive").css("height", "68vh");
    });

    $("#lnkMinimize").click(function () {
        $(".div-responsive").css("height", "63vh");
    });


    var tbl;

    fnClearSalary();
    GetAllSalary();

    $("#btnSaveSalary").click(function () {
        if (!validateSalary()) return;
        InsertSalary();
    });

    $("#btnUpdateSalary").click(function () {
        
        if (!validateSalary()) return;
        UpdateSalaryById();
    });

    $("#btnClearPage").click(function () {
        fnClearSalary();
    });

    $(document).on('click', '.class-btnUpdateSalary', function () {
        var id = $(this).data('id');
        GetSalaryById(id);
    });

    $(document).on('click', '.class-btnDeleteSalary', function () {
        var id = $(this).data('id');
        DeleteSalaryById(id);
    });

    $(document).on("change", "#txtSalaryAmount", function () {
        var salary = parseFloat($(this).val()) || 0;

        var need50 = (salary * 0.50).toFixed(2);
        var save20 = (salary * 0.20).toFixed(2);
        var want30 = (salary * 0.30).toFixed(2);

        $("#txtNeed50").val(need50);
        $("#txtSave20").val(save20);
        $("#txtWant30").val(want30);
    });

    function GetAllSalary() {
        
        $.ajax({
            url: '/Salary/GetAllSalary',
            type: 'GET',
            success: function (res) {
                $("#gridTableSalary tbody").empty();
                
                var html = '';
                var i = 1;
                var totalSalary = 0;
                $.each(res, function (idx, item) {
                    let fromDate = item.FromData ? anyToDate(formatDate(item.FromData)) : '';
                    let toDate = item.ToDate ? anyToDate(formatDate(item.ToDate)) : '';
                    let numberOfDays = calculateTheDays(fromDate, toDate) ;
                    totalSalary = totalSalary + item.SalaryAmount;
                    html += '<tr>';
                    html += '<td>' + (i++) + '</td>';
                    html += '<td>' + (numberToMonth(item.MonthName) || '') + '</td>';
                    html += '<td>' + (item.YearName || '') + '</td>';
                    html += '<td id="' + item.SalaryAmount + '" class="salary">' + (item.SalaryAmount != null ? item.SalaryAmount : '').toLocaleString('en-IN') + '</td>';
                    html += '<td>' + (item.Need50 != null ? item.Need50 : '') + '</td>';
                    html += '<td>' + (item.Save20 != null ? item.Save20 : '') + '</td>';
                    html += '<td>' + (item.Want30 != null ? item.Want30 : '') + '</td>';
                    html += '<td>' + fromDate + '</td>';
                    html += '<td>' + toDate + '</td>';
                    html += '<td>' + (item.OrderRowAll != null ? item.OrderRowAll : '') + ' row count || ' + numberOfDays + ' days</td>';

                    html += '<td class="total-salary">' + (item.SalaryTillNow != null ? item.SalaryTillNow : '').toLocaleString('en-IN') + '</td>';

                    html += '<td>';
                    html += '<a href="#" class="me-1"><i class="fa-solid fa-pen-to-square text-warning class-btnUpdateSalary" data-id="' + item.Id + '"></i></a>';
                    html += ' | ';
                    //html += '<a href="#" class="ms-1"><i class="fa-regular fa-trash-can text-danger class-btnDeleteSalary" data-id="' + item.Id + '"></i></a>';
                    html += '</td>';

                    html += '</tr>';
                });
                $("#gridTableSalary tbody").html(html);
                //initDataTable();
            }
        });
    }

    function calculateTheDays(fromDate, toDate) {
        // Convert to Date objects
        var d1 = new Date(fromDate);
        var d2 = new Date(toDate);

        // Calculate difference in milliseconds
        var diffMs = d2 - d1;

        // Convert ms → days
        var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    function InsertSalary() {
        var obj = getSalaryFromForm();
        
        $.ajax({
            url: '/Salary/InsertSalary',
            type: 'POST',
            data: obj,
            success: function (res) {
                if (res && res.Success) {
                    alert('Inserted. ID = ' + res.Id);
                    GetAllSalary();
                    fnClearSalary();
                } else {
                    alert('Insert failed');
                }
            }
        });
    }

    function UpdateSalaryById() {
        
        var obj = getSalaryFromForm();
        obj.Id = $("#hidenSalaryID").val();
        $.ajax({
            url: '/Salary/UpdateSalaryById',
            type: 'POST',
            data: obj,
            success: function (res) {
                
                if (res && res.Success) {
                    alert('Updated');
                    GetAllSalary();
                    fnClearSalary();
                } else {
                    alert('Update failed');
                }
            }
        });
    }

    function DeleteSalaryById(id) {
        if (!confirm('Delete this record?')) return;
        $.ajax({
            url: '/Salary/DeleteSalaryById',
            type: 'POST',
            data: { id: id },
            success: function (res) {
                if (res && res.Success) {
                    alert('Deleted');
                    GetAllSalary();
                } else {
                    alert('Delete failed');
                }
            }
        });
    }

    function GetSalaryById(id) {
        $.ajax({
            url: '/Salary/GetSalaryById',
            type: 'GET',
            data: { id: id },
            success: function (item) {
                
                if (!item) return;
                $("#hidenSalaryID").val(item.Id);
                $("#txtMonthName").val(item.MonthName);
                $("#txtYearName").val(item.YearName);
                $("#txtSalaryAmount").val(item.SalaryAmount);
                $("#txtNeed50").val(item.Need50);
                $("#txtSave20").val(item.Save20);
                $("#txtWant30").val(item.Want30);
                if (item.FromData) {
                    let result111 = anyToInputDate(item.FromData);
                    $("#txtFromData").val(result111);
                }
                else {
                    $("#txtFromData").val('');
                }
                if (item.ToDate) {
                    let result222 = anyToInputDate(item.ToDate);
                    $("#txtToDate").val(result222);
                }
                else {
                    $("#txtToDate").val('');
                }
                $("#txtOrderRowAll").val(item.OrderRowAll);
                $("#txtOrderRowYear").val(item.OrderRowYear);

                $("#btnSaveSalary").hide();
                $("#btnUpdateSalary").show();
            }
        });
    }

    function fnClearSalary() {
        $("#hidenSalaryID").val('');
        $("#txtMonthName").val('');
        $("#txtYearName").val('');
        $("#txtSalaryAmount").val('');
        $("#txtNeed50").val('');
        $("#txtSave20").val('');
        $("#txtWant30").val('');
        $("#txtFromData").val('');
        $("#txtToDate").val('');
        $("#txtOrderRowAll").val('');
        $("#txtOrderRowYear").val('');
        $("#btnSaveSalary").show();
        $("#btnUpdateSalary").hide();
    }

    function getSalaryFromForm() {
        return {
            MonthName: $("#txtMonthName").val(),
            YearName: $("#txtYearName").val(),
            SalaryAmount: $("#txtSalaryAmount").val(),
            Need50: $("#txtNeed50").val(),
            Save20: $("#txtSave20").val(),
            Want30: $("#txtWant30").val(),
            FromData: $("#txtFromData").val(),
            ToDate: $("#txtToDate").val(),
            OrderRowAll: $("#txtOrderRowAll").val(),
            OrderRowYear: $("#txtOrderRowYear").val()
        };
    }

    function validateSalary() {
        
        if ($("#txtMonthName").val().trim() === "") {
            alert("Month Name is required");
            $("#txtMonthName").focus();
            return false;
        }
        if ($("#txtYearName").val().trim() === "") {
            alert("Year Name is required");
            $("#txtYearName").focus();
            return false;
        }
        if ($("#txtSalaryAmount").val().trim() === "") {
            alert("Salary Amount is required");
            $("#txtSalaryAmount").focus();
            return false;
        }
        return true;
    }

    function formatDate(val) {
        // val from server -> ISO or /Date; try to parse
        var d = new Date(val);
        if (isNaN(d)) return val;
        return d.toLocaleDateString();
    }

    function formatDateForInput(val) {
        var d = new Date(val);
        if (isNaN(d)) return '';
        var yyyy = d.getFullYear();
        var mm = ('0' + (d.getMonth() + 1)).slice(-2);
        var dd = ('0' + d.getDate()).slice(-2);
        return yyyy + '-' + mm + '-' + dd;
    }

    
    //function initDataTable() {
    //    if ($.fn.DataTable) {
    //        try {
    //            // If datatable already exists
    //            if ($.fn.DataTable.isDataTable('#gridTableSalary')) {
    //                var table = $('#gridTableSalary').DataTable();

    //                // Clear all rows
    //                table.clear().draw();

    //                // Destroy the instance
    //                table.destroy();
    //            }

    //            // Reinitialize fresh datatable
    //            $("#gridTableSalary").DataTable({
    //                pageLength: 10,
    //                searching: true,
    //                ordering: true,
    //                lengthMenu: [5, 10, 20, 50]
    //            });

    //        } catch (e) {
    //            console.warn(e);
    //        }
    //    }
    //}
    //function initDataTable() {
    //    if ($.fn.DataTable) {
    //        try {
    //            if ($.fn.DataTable.isDataTable('#gridTableSalary')) {
    //                $('#gridTableSalary').DataTable().destroy();
    //            }
    //            tbl = $("#gridTableSalary").DataTable({
    //                pageLength: 10,
    //                searching: true,
    //                ordering: true,
    //                lengthMenu: [5, 10, 20, 50]
    //            });
    //        } catch (e) { console.warn(e); }
    //    }
    //}


    function anyToDate(input) {
        if (!input) return "";

        // extract timestamp from patterns like Date(1761849000000)
        var match = input.match(/\d+/);
        if (!match) return "";

        var timestamp = parseInt(match[0]);
        var date = new Date(timestamp);

        // month names
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        var day = String(date.getDate()).padStart(2, '0');
        var month = monthNames[date.getMonth()];
        var year = date.getFullYear();

        return `${day} ${month} ${year}`;
    }


    function anyToInputDate(input, inputId) {
        if (!input) return;

        // Extract the timestamp (all digits)
        var match = input.match(/\d+/);
        if (!match) return;

        var timestamp = parseInt(match[0]);
        var date = new Date(timestamp);

        // Format to YYYY-MM-DD for HTML date input
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');

        var formatted = `${year}-${month}-${day}`;

        // Bind to the input
        $(`#${inputId}`).val(formatted);
    }


    function anyToInputDate(input) {
        if (!input) return "";

        // Extract timestamp from Date(XXXXXXXXXXXX)
        var match = input.match(/\d+/);
        if (!match) return "";

        var timestamp = parseInt(match[0]);
        var date = new Date(timestamp);

        // Format yyyy-mm-dd (required for input type="date")
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }


    function numberToMonth(num) {
        const months = [
            "",             // index 0 → no month
            "January",      // 1
            "February",     // 2
            "March",        // 3
            "April",        // 4
            "May",          // 5
            "June",         // 6
            "July",         // 7
            "August",       // 8
            "September",    // 9
            "October",      // 10
            "November",     // 11
            "December"      // 12
        ];

        return months[num] || "";
    }

    function assignSum() {
        $('.salary').each(function () {
            alert('oo');
        });
    }
});