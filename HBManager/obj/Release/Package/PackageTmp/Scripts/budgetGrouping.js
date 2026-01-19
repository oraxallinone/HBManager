$(document).ready(function () {
    var screenWidth = window.screen.width;
    console.log(screenWidth);
    $(".div-responsive").css("height", "63vh", "important");

    $("#lnkMaximize").click(function () {
        $(".div-responsive").css("height", "69vh", "important");
    });

    $("#lnkMinimize").click(function () {
        $(".div-responsive").css("height", "63vh", "important");
    });

    var selectedBudgetIds = [];  // Global array to store selected IDs

    // global container for uncut group list (name requested)
    var GobalGroupMasterUncut = [];

    //var screenWidth = window.screen.width; console.log(screenWidth);

    $("#ddlYear").change(function () {
        GetAllBudgetFromToWithGroup();
    });

    $("#ddlMonth").change(function () {
        GetAllBudgetFromToWithGroup();
    });


    $("#searchDDlG1").change(function () {
        GetAllBudgetFromToWithGroup();
    });
    $("#searchDDlG2").change(function () {
        GetAllBudgetFromToWithGroup();
    });
    $("#searchDDlG3").change(function () {
        GetAllBudgetFromToWithGroup();
    });
    $("#searchDDlG4").change(function () {
        GetAllBudgetFromToWithGroup();
    });


    GetGroupMasterUncut(); // call on page load

    setThisYearMonth();//set month n year

    // Hide Update button initially
    $("#btnUpdateBudgetGroup").hide();
    $("#btnUpdateBudgetGroupSingle").hide();

    Get4Group();

   

    $("#btnSaveBudget").click(function () {
        if (validateBudget()) {
            InsertBudget();
        }
    });

    $(document).on("keypress", function (e) {
        if (e.which === 13) { // 13 = Enter key
            let hidId = $('#hidenBudgetID').val();
            if (hidId == 0) {
                InsertBudget();
                $('#txtAmt').focus();
            }
            else {
                UpdateBudgetGroupSingle();
            }

        }
    });

    $(document).on('click', '.budget-checkbox', function () {
        // Show the update button when any checkbox is clicked
        //$("#btnUpdateBudgetGroup").show();

        var id = parseInt($(this).attr('data-id'));
        var isChecked = $(this).is(':checked');

        if (isChecked) {
            // Add to array if not already present
            if ($.inArray(id, selectedBudgetIds) === -1) {
                selectedBudgetIds.push(id);
            }
        } else {
            // Remove from array
            selectedBudgetIds = $.grep(selectedBudgetIds, function (value) {
                return value !== id;
            });
        }

        // Show/hide update button based on selection
        if (selectedBudgetIds.length > 0) {
            $("#btnUpdateBudgetGroup").show();
            $('#divDDLMulti').show()
        } else {
            $("#btnUpdateBudgetGroup").hide();
            $('#divDDLMulti').hide()
        }

        console.log("Selected Budget IDs:", selectedBudgetIds);
    });

    $(document).on("keydown", ".only-numeric", function (e) {

        // Allow: backspace, delete, tab, escape, enter
        if ($.inArray(e.keyCode, [8, 9, 13, 27, 46]) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.ctrlKey === true && $.inArray(e.keyCode, [65, 67, 86, 88]) !== -1) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }

        // Block anything that is not a number (0–9)
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
            (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    let previousSelectTrID = 0;
    $(document).on('click', '.no-css', function () {
        $('.no-css').removeClass('dynamic-bg-tr');
        $(this).addClass('dynamic-bg-tr');
        previousSelectTrID = $(this).attr('id');
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

        if (amount.trim() === "" || isNaN(amount) || parseFloat(amount) < 0) {
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
        globalSave = 1
        let obj = {
            Year: parseInt($("#ddlYear").val()),
            Month: parseInt($("#ddlMonth").val()),
            SpendDate: $("#txtDate").val(),
            Amount: parseFloat($("#txtAmt").val()),
            Details: $("#txtDetails").val(),
            G1: 0,
            G2: 0,
            G3: 0,
            G4: 0
        };
        $.ajax({
            url: "/Budget/InsertBudget",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(obj),
            dataType: "json",
            success: function (rowIffected) {
                if (rowIffected > 0) {
                    showMessage(rowIffected);
                    fnClearAmtDetails();
                    GetAllBudgetFromToWithGroup();
                } else {
                    showMessageError();
                }
            },
            error: function (xhr, status, error) {
                alert("Error occurred: " + error);
                console.log(xhr.responseText);
            }
        });
    }

    function fnClearAmtDetails() {
        //$("#ddlYear").val("0");
        //$("#ddlMonth").val("0");
        //$("#txtDate").val("");
        $("#txtAmt").val("");
        $("#txtDetails").val("");
        //$("#searchDDlG1").val("-- G1 --");
        //$("#searchDDlG2").val("-- G2 --");
        //$("#searchDDlG3").val("-- G3 --");
        //$("#searchDDlG4").val("-- G4 --");
        //$("#hidenBudgetID").val("");
    }

    //new
    function showMessage(msgv) {

        // Create message box
        var msg = $('<div id="tempMessage">complete ' + msgv + '</div>');

        // Style it like an alert popup
        msg.css({
            position: 'fixed',
            top: '19%',
            right: '40%',
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

    function showMessageError() {

        // Create message box
        var msg = $('<div id="tempMessage">error !!!</div>');

        // Style it like an alert popup
        msg.css({
            position: 'fixed',
            top: '12%',
            right: '27%',
            padding: '12px 244px',
            background: '#FF0000',
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

    $(document).on('click', '.class-btnViewBudget', function () {
        // Show the update button when any checkbox is clicked
        $("#btnUpdateBudgetGroupSingle").show();
        var id = parseInt($(this).attr('data-id'));

        $.ajax({
            url: "/Budget/GetBudgetById",
            type: "GET",
            contentType: "application/json; charset=utf-8",
            data: { id: id },
            success: function (res) {
                if (res) {
                    bindBudgetDetails(res); // Bind the result to the fields
                    $("#btnSaveBudget").hide();
                    $('#divDDLSingle').show();
                } else {
                    alert("Budget not found.");
                }
            },
            error: function (xhr, status, error) {
                alert("Error occurred: " + error);
                console.log(xhr.responseText);
            }
        });

    });

    // bind Update Single button
    //$("#btnUpdateBudgetGroupSingle").hide(); // ensure hidden on load

    //$("#lnkMinimize").click(function () {
    //    $(".table-responsive").css("max-height", "62vh");
    //});

    $("#btnUpdateBudgetGroupSingle").off('click').on('click', function () {
        UpdateBudgetGroupSingle();
    });

    function UpdateBudgetGroupSingle() {
        var id = parseInt($("#hidenBudgetID").val()) || 0;
        if (id === 0) {
            alert("No record selected to update.");
            return;
        }

        // build model from inputs
        var model = {
            Id: id,
            Year: parseInt($("#ddlYear").val()) || 0,
            Month: parseInt($("#ddlMonth").val()) || 0,
            SpendDate: $("#txtDate").val() ? $("#txtDate").val() : null,
            Amount: $("#txtAmt").val() ? parseFloat($("#txtAmt").val()) : 0,
            Details: $("#txtDetails").val() || null,
            G1: $("#ddlUpdateG1").val() && $("#ddlUpdateG1").val() !== "0" ? parseInt($("#ddlUpdateG1").val()) : (null),
            G2: $("#ddlUpdateG2").val() && $("#ddlUpdateG2").val() !== "0" ? parseInt($("#ddlUpdateG2").val()) : (null),
            G3: $("#ddlUpdateG3").val() && $("#ddlUpdateG3").val() !== "0" ? parseInt($("#ddlUpdateG3").val()) : (null),
            G4: $("#ddlUpdateG4").val() && $("#ddlUpdateG4").val() !== "0" ? parseInt($("#ddlUpdateG4").val()) : (null)
        };

        $.ajax({
            url: "/Budget/UpdateBudgetById",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(model),
            dataType: "json",
            success: function (rowIffected) {
                if (rowIffected > 0) {
                    // refresh list and reset UI
                    GetAllBudgetFromToWithGroup();
                    $("#btnUpdateBudgetGroupSingle").hide();
                    $('#divDDLSingle').hide()
                    $("#btnSaveBudget").show();
                    fnClearAmtDetails();
                    $("#hidenBudgetID").val("");
                    showMessage(rowIffected);

                    $("#ddlUpdateG1").val(0);
                    $("#ddlUpdateG2").val(0);
                    $("#ddlUpdateG3").val(0);
                    $("#ddlUpdateG4").val(0);

                } else {
                    showMessageError();
                }

                //if (res && res.Success) {
                //    alert("Record updated successfully.");
                //    // refresh list and reset UI
                //    GetAllBudgetFromToWithGroup();
                //    $("#btnUpdateBudgetGroupSingle").hide();
                //    fnClearAmtDetails();
                //    $("#hidenBudgetID").val("");
                //} else {
                //    alert("Update failed.");
                //}
            },
            error: function (xhr, status, error) {
                alert("Error occurred: " + error);
                console.log(xhr.responseText);
            }
        });
    }

    // Handle Update Groups button click
    $("#btnUpdateBudgetGroup").click(function () {
        if (selectedBudgetIds.length === 0) {
            alert("Please select at least one budget record");
            return;
        }

        // Get dropdown values
        var g1 = $("#ddlUpdateG1Group").val();
        var g2 = $("#ddlUpdateG2Group").val();
        var g3 = $("#ddlUpdateG3Group").val();
        var g4 = $("#ddlUpdateG4Group").val();

        // Check if at least one dropdown has a value selected (not default)
        if (!g1 && !g2 && !g3 && !g4) {
            alert("Please select at least one group");
            return;
        }

        UpdateBudgetGroups();
    });

    // ... rest of existing functions ...
    function bindBudgetDetails(data) {
        if (data) {
            $("#ddlYear").val(data.Year);
            $("#ddlMonth").val(data.Month);
            //----------------------------------------------------------------------------------
            var outputDate = ToInputDateFormat(data.SpendDate);
            $("#txtDate").val(outputDate);
            $("#txtAmt").val(data.Amount);
            $("#txtDetails").val(data.Details);
            $("#hidenBudgetID").val(data.Id);

            // Bind G1, G2, G3, G4 dropdowns
            $("#ddlUpdateG1").val(data.G1);
            $("#ddlUpdateG2").val(data.G2);
            $("#ddlUpdateG3").val(data.G3);
            $("#ddlUpdateG4").val(data.G4);
        }
    }

    function ToInputDateFormat(dotNetDate) {
        // Extract the ticks from /Date(1763317800000)/
        var timestamp = parseInt(dotNetDate.replace(/[^0-9]/g, ""));

        // Create a JS date
        var date = new Date(timestamp);

        // Format yyyy-mm-dd
        var yyyy = date.getFullYear();
        var mm = ("0" + (date.getMonth() + 1)).slice(-2);
        var dd = ("0" + date.getDate()).slice(-2);

        return `${yyyy}-${mm}-${dd}`;
    }

    function UpdateBudgetGroups() {
        var g1 = $("#ddlUpdateG1Group").val();
        var g2 = $("#ddlUpdateG2Group").val();
        var g3 = $("#ddlUpdateG3Group").val();
        var g4 = $("#ddlUpdateG4Group").val();

        var obj = {
            budgetIds: selectedBudgetIds,
            g1: g1 ? parseInt(g1) : null,
            g2: g2 ? parseInt(g2) : null,
            g3: g3 ? parseInt(g3) : null,
            g4: g4 ? parseInt(g4) : null
        };

        $.ajax({
            url: "/Budget/UpdateBudgetGroups",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(obj),
            dataType: "json",
            success: function (rowIffected) {
                if (rowIffected > 0) {
                    showMessage(rowIffected);

                    // Clear selections
                    selectedBudgetIds = [];
                    $(".budget-checkbox").prop('checked', false);
                    $("#btnUpdateBudgetGroup").hide();

                    // Reset dropdowns
                    $("#ddlUpdateG1Group").val(0);
                    $("#ddlUpdateG2Group").val(0);
                    $("#ddlUpdateG3Group").val(0);
                    $("#ddlUpdateG4Group").val(0);

                    // Reload table
                    GetAllBudgetFromToWithGroup();
                } else {
                    alert("Error: Failed to update budget groups");
                }
            },
            error: function (xhr, status, error) {
                alert("Error occurred: " + error);
                console.log(xhr.responseText);
            }
        });
    }

    function Get4Group() {
        $.ajax({
            url: "/Budget/Get4Group",
            type: "GET",
            dataType: "json",
            success: function (res) {
                if (res) {
                    // Populate G1 dropdown
                    if (res.G1Groups && res.G1Groups.length > 0) {
                        $.each(res.G1Groups, function (idx, item) {
                            $("#searchDDlG1").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG1").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG1Group").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                        });
                    }

                    // Populate G2 dropdown
                    if (res.G2Groups && res.G2Groups.length > 0) {
                        $.each(res.G2Groups, function (idx, item) {
                            $("#searchDDlG2").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG2").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG2Group").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));

                        });
                    }

                    // Populate G3 dropdown
                    if (res.G3Groups && res.G3Groups.length > 0) {
                        $.each(res.G3Groups, function (idx, item) {
                            $("#searchDDlG3").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG3").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG3Group").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));

                        });
                    }

                    // Populate G4 dropdown
                    if (res.G4Groups && res.G4Groups.length > 0) {
                        $.each(res.G4Groups, function (idx, item) {
                            $("#searchDDlG4").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG4").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG4Group").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                        });
                    }

                    $('#divDDLSingle').hide()
                    $('#divDDLMulti').hide()
                }
            },
            error: function (xhr, status, error) {
                alert("Error loading groups: " + error);
                console.log(xhr.responseText);
            }
        });
    }

    function GetAllBudgetFromToWithGroup() {
        var year = $("#ddlYear").val();
        var month = $("#ddlMonth").val();

        var g1 = parseInt($("#searchDDlG1").val(), 10) || 0;
        var g2 = parseInt($("#searchDDlG2").val(), 10) || 0;
        var g3 = parseInt($("#searchDDlG3").val(), 10) || 0;
        var g4 = parseInt($("#searchDDlG4").val(), 10) || 0;

        if (year === "0" || month === "0") {
            //alert("Please select Year and Month first");
            return;
        }

        $.ajax({
            url: "/Budget/GetAllBudgetFromToWithGroup",
            type: "GET",
            data: { year: year, month: month, g1: g1, g2: g2, g3: g3, g4: g4 },
            dataType: "json",
            success: function (res) {
                if (res && res.length > 0) {
                    $("#gridTableBudget tbody").empty();
                    bindBudgetTable(res);//bind wows
                } else {
                    $("#gridTableBudget tbody").html("<tr><td colspan='9' style='text-align:center;'>No records found</td></tr>");
                }
            },
            error: function (xhr, status, error) {
                alert("Error occurred while loading data: " + error);
                console.log(xhr.responseText);
            }
        });
    }

    function extractNameById(groupId) {
        if (!groupId) return "";

        var item = GobalGroupMasterUncut.find(x => x.GroupId === groupId);
        return item ? item.GroupName : "";
    }

    //binding all rows to table
    function bindBudgetTable(data) {
        var html = "";
        var i = 1;

        $.each(data, function (idx, item) {
            //var sssss = extractNameById(item.G1); //GetGroupMasterNameById(item.G1);

            var spendDate = item.SpendDate ? ToDateAndDay(item.SpendDate) : "";
            var amount = item.Amount; //formatAmount(item.Amount);
            var dayClassMain = ToDayExtraction(spendDate);
            var dayClass = getDayClass(dayClassMain);
            var g2save = (item.G2 == '3') ? "amt-save" : "";


            html += "<tr class='no-css id-" + item.Id + "' id='" + item.Id + "'>";

            // --- ICON COLUMN ---
            html += "<td class='" + dayClass + "'>";
            html += "<a href='#' class='text-success class-btnViewBudget' data-id='" + item.Id + "'>";
            html += "<i class='fa-solid fa-eye'></i></a>";
            html += "<span class='bar-padding'>|</span>";
            html += "<a href='#' class='text-danger class-btnDeleteBudget' data-id='" + item.Id + "'>";
            html += "<i class='fa-regular fa-trash-can'></i></a>";
            html += "</td>";

            // --- DATE COLUMN ---
            html += "<td class='bg-main-day-" + dayClassMain + "'>" + spendDate + "</td>";

            // --- AMOUNT COLUMN ---
            html += "<td class='amt-class " + g2save + " " + dayClass + "' style='text-align:right;'>" + amount + "</td>";

            // --- CHECKBOX COLUMN ---
            html += "<td class='" + dayClass + "'>";
            html += "<input type='checkbox' class='budget-checkbox' data-id='" + item.Id + "' />";
            html += "</td>";

            // --- DETAILS COLUMN ---
            html += "<td class='" + dayClass + "'>" + (item.Details || "") + "</td>";

            // --- G1 COLUMN ---
            html += "<td class='" + dayClass + "'> <div class='div-g1-c" + item.G1 + "'>" + (extractNameById(item.G1) || "") + "</div> </td>";

            // --- G2 COLUMN (with style div like sample) ---
            html += "<td class='" + dayClass + "'>";
            html += "<div class='div-g2-c" + item.G2 + "'>" + (extractNameById(item.G2) || "") + "</div>";
            html += "</td>";

            // --- G3 COLUMN ---
            html += "<td class='" + dayClass + "'>" + (extractNameById(item.G3) || "") + "</td>";

            // --- G4 COLUMN (Repeat style box) ---
            html += "<td class='" + dayClass + "'> <div class='div-g4-c" + item.G4 + "'>" + (extractNameById(item.G4) || "") + "</div> </td>";

            html += "</tr>";

        });

        $("#gridTableBudget tbody").html(html);
        selectToLast();
        //'no-css id-2738'
        $("tr.no-css.id-" + previousSelectTrID).addClass("dynamic-bg-tr");
        //$('#tblExpensive > #' + previousSelectTrID).addClass('dynamic-bg-tr');

        getTotalSum();

        //$("#gridTableBudget tbody").addClass("flex-reverse");

        // Attach event handlers to dynamically added elements
        $(document).off('click', '.class-btnDeleteBudget').on('click', '.class-btnDeleteBudget', function (e) {
            e.preventDefault();
            var id = $(this).data('id');
            DeleteBudgetById(id);
        });

        $(document).off('click', '.class-btnUpdateBudget').on('click', '.class-btnUpdateBudget', function (e) {
            e.preventDefault();
            var id = $(this).data('id');
            GetBudgetById(id);
        });

    }

    //31 Oct 2025 (Fri)
    function ToDateAndDay(jsonDate) {
        if (!jsonDate) return "";

        // Extract ticks from /Date(1762626600000)/
        var ticks = parseInt(jsonDate.replace(/\/Date\((\d+)\)\//, "$1"));

        var date = new Date(ticks);

        // Day, Month, Year
        var day = date.getDate();
        var year = date.getFullYear();

        // Short month names
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Day names (3 letters)
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        var monthName = months[date.getMonth()];
        var dayName = days[date.getDay()];

        // Final output
        return `${day} ${monthName} ${year} (${dayName})`;
    }

    function DeleteBudgetById(id) {
        if (!confirm("Are you sure you want to delete this record?")) return;

        $.ajax({
            url: "/Budget/DeleteBudgetById",
            type: "POST",
            data: { id: id },
            dataType: "json",
            success: function (res) {
                if (res && res.Success) {
                    showMessage(' deleted.')
                    GetAllBudgetFromToWithGroup();
                } else {
                    alert("Error: Failed to delete record");
                }
            },
            error: function (xhr, status, error) {
                alert("Error occurred: " + error);
            }
        });
    }

    function GetBudgetById(id) {
        $.ajax({
            url: "/Budget/GetBudgetById",
            type: "GET",
            data: { id: id },
            dataType: "json",
            success: function (item) {
                if (item) {
                    $("#hidenBudgetID").val(item.Id);
                    $("#ddlYear").val(item.Year);
                    $("#ddlMonth").val(item.Month);
                    $("#txtDate").val(formatDateForInput(item.SpendDate));
                    $("#txtAmt").val(item.Amount);
                    $("#txtDetails").val(item.Details || "");
                    if (item.G1) $("#searchDDlG1").val(item.G1);
                    if (item.G2) $("#searchDDlG2").val(item.G2);
                    if (item.G3) $("#searchDDlG3").val(item.G3);
                    if (item.G4) $("#searchDDlG4").val(item.G4);

                    // Change button to Update mode (optional - implement as needed)
                    $('html,body').animate({ scrollTop: 0 }, 'fast');
                } else {
                    alert("Record not found");
                }
            },
            error: function (xhr, status, error) {
                alert("Error occurred: " + error);
            }
        });
    }

    function formatDate(val) {
        if (!val) return "";
        var d = new Date(val);
        if (isNaN(d)) return val;
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return (d.getDate()) + ' ' + months[d.getMonth()] + ' ' + days[d.getDay()];
    }

    function formatDateForInput(val) {

        if (!val) return "";
        var d = new Date(val);
        if (isNaN(d)) return '';
        var yyyy = d.getFullYear();
        var mm = ('0' + (d.getMonth() + 1)).slice(-2);
        var dd = ('0' + d.getDate()).slice(-2);
        return yyyy + '-' + mm + '-' + dd;
    }

    function formatAmount(val) {
        if (!val) return "0.00";
        return parseFloat(val).toFixed(2);
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

    function GetGroupMasterNameById(id) {
        if (!GobalGroupMasterUncut || !GobalGroupMasterUncut.length) return '';
        var gid = parseInt(id, 10);
        if (isNaN(gid)) return '';
        var item = GobalGroupMasterUncut.find(function (g) { return parseInt(g.GroupId, 10) === gid; });
        return item ? (item.GroupName || '') : '';
    }

    //set current month & year
    function setThisYearMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // getMonth() returns 0–11

        $("#ddlYear").val(year);
        $("#ddlMonth").val(month);

        GetAllBudgetFromToWithGroup();//load data to grid
    }

    var globalSave = 1;
    function selectToLast() {
        if (globalSave == 1) {
            var tbody = $("#gridTableBudget tbody");
            var rows = tbody.find("tr");

            if (rows.length === 0) {
                console.warn("No rows found in table");
                return;
            }

            // Get the last row
            var lastRow = rows.eq(rows.length - 1);

            // Scroll the container to show the last row
            var container = tbody.closest(".div-responsive");

            if (container.length) {
                // Scroll to the last row
                container.scrollTop(
                    lastRow.position().top + container.scrollTop() - container.height() + lastRow.outerHeight()
                );
            } else {
                // Fallback: if no specific container, scroll window
                $('html, body').animate({
                    scrollTop: lastRow.offset().top - ($(window).height() / 2)
                }, 500);
            }
            globalSave = 0
            console.log("Scrolled to last row");
        }
    }

    function getTotalSum() {
        var total = 0;

        $('.amt-class').each(function () {
            // Get value (works for input fields or text elements)
            var val = $(this).val() || $(this).text();

            // Convert to number safely
            var num = parseFloat(val) || 0;

            total += num;
        });

        $('#spanTotal').text(Intl.NumberFormat('en-IN').format(total));
        globalTotal = total;
        getTotalSaveSum();
    }

    var globalTotal = 0;
    function getTotalSaveSum() {
        var totalSave = 0;

        $('.amt-save').each(function () {
            // Get value (works for input fields or text elements)
            var val = $(this).val() || $(this).text();

            // Convert to number safely
            var num = parseFloat(val) || 0;

            totalSave += num;
        });
        $('#spanTotalSave').text(Intl.NumberFormat('en-IN').format(totalSave));

        var allTotal = parseFloat(globalTotal);

        var remainAmt = allTotal - totalSave;
        $('#spanTotalSpend').text(Intl.NumberFormat('en-IN').format(remainAmt));

    }

});