$(document).ready(function () {
    var screenWidth = window.screen.width;
    console.log(screenWidth);
    $(".div-responsive").css("height", "69vh", "important");

    $("#lnkMaximize").click(function () {
        $(".div-responsive").css("height", "74vh", "important");
    });

    $("#lnkMinimize").click(function () {
        $(".div-responsive").css("height", "69vh", "important");
    });

    var selectedBudgetIds = [];  // Global array to store selected IDs

    // global container for uncut group list (name requested)
    var GobalGroupMasterUncut = [];

    //var screenWidth = window.screen.width; console.log(screenWidth);

    $("#ddlYear").change(function () {
        if (!$('#checkForAll').is(':checked')) {
            GetAllBudgetFromToWithGroup();
        }
    });

    $("#ddlMonth").change(function () {
        if (!$('#checkForAll').is(':checked')) {
            GetAllBudgetFromToWithGroup();
        }
    });

    function getAllBudgetForGroupOnly() {
        var year = $("#ddlYear").val();
        var month = $("#ddlMonth").val();
        var isAll = $('#checkForAll').prop('checked');
        // Get group dropdown values
        var g1 = parseInt($("#searchDDlG1").val(), 10) || 0;
        var g2 = parseInt($("#searchDDlG2").val(), 10) || 0;
        var g3 = parseInt($("#searchDDlG3").val(), 10) || 0;
        var g4 = parseInt($("#searchDDlG4").val(), 10) || 0;
        // Call API with year=0, month=0 to get all data for group
        $.ajax({
            url: "/Budget/GetAllBudgetFromToWithGroup",
            type: "GET",
            data: { year: 0, month: 0, g1: g1, g2: g2, g3: g3, g4: g4, isAll: isAll },
            dataType: "json",
            success: function (res) {
                if (res && res.length > 0) {
                    $("#gridTableBudget tbody").empty();
                    bindBudgetTable(res);//bind rows
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

    $("#searchDDlG1, #searchDDlG2, #searchDDlG3, #searchDDlG4").change(function () {
        if ($('#checkForAll').is(':checked')) {
            getAllBudgetForGroupOnly();
        } else {
            GetAllBudgetFromToWithGroup();
        }
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
        if (e.which === 13) {
            var $focused = $(e.target);
            if ($focused.hasClass("inline-edit-details")) {
                e.preventDefault();
                var $updateBtn = $focused.closest('td').find(".inline-update-details");
                if ($updateBtn.length > 0) {
                    $updateBtn.click();
                } else {
                    console.error("Could not find the '.inline-update-details' button inside this cell.");
                }
            }
            else {
                let hidId = $('#hidenBudgetID').val();
                if (hidId == 0) {
                    InsertBudget();
                    $('#txtAmt').focus();
                }
                else {
                    UpdateBudgetGroupSingle();
                }
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
            $("#btnsingleSearch").hide();
            $("#btnUpdateBudgetGroupSingle").hide();
            $("#btnUpdateBudgetGroup").show();

            $("#divdllOnRender").hide();
            $("#divDDLSingle").hide();
            $("#divDDLMulti").show();
        }
        else {
            $('#btnsingleSearch').show();
            $('#btnUpdateBudgetGroupSingle').hide();
            $('#btnUpdateBudgetGroup').hide();
            $('#divdllOnRender').show();
            $('#divDDLSingle').hide();
            $('#divDDLMulti').hide();
        }
        console.log("Selected Budget IDs:", selectedBudgetIds);
    });

    // Modal HTML injection (only once)
    if ($('#customEditModal').length === 0) {
        var modalHtml = `
        <div id="customEditModal" style="display:none; position:fixed; z-index:99999; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3);">
            <div style="background:#fff; margin:10% auto; padding:20px; border-radius:8px; width:320px; position:relative; box-shadow:0 0 10px #333;">
                <input type="hidden" id="modalHiddenId" />
                <label for="modalEditInput">Edit Details:</label>
                <input type="text" id="modalEditInput" class="form-control" style="margin-bottom:10px;" />
                <button id="modalUpdateBtn" class="btn btn-primary" style="margin-right:10px;">Update</button>
                <button id="modalCloseBtn" class="btn btn-secondary">Close</button>
            </div>
        </div>`;
        $('body').append(modalHtml);
    }

    //with double click open popup
    // Inline edit for Details cell
    $(document).on('dblclick', '.doubleClick', function () {
        var $td = $(this);
        // Prevent multiple editors
        if ($td.find('.inline-edit-details').length > 0) return;
        var titleValue = $td.attr('title');   // get title value (ID)
        var valueOfTd = $td.text();
        // Save original for cancel
        $td.data('original-content', valueOfTd);
        // Build inline editor
        var editorHtml = `
                <input type="text" class="inline-edit-details form-control" value="${valueOfTd.replace(/"/g, '&quot;')}" style="width:195px; height:24px; font-size:12px; padding:2px 4px; display:inline-block; vertical-align:middle;" />
                <button class="btn btn-success inline-update-details" data-id="${titleValue}" style="margin-left:4px; padding:2px 8px; font-size:12px; height:26px; line-height:1;">U</button>
                <button class="btn btn-secondary inline-cancel-details" style="margin-left:2px; padding:2px 8px; font-size:12px; height:26px; line-height:1;">x</button>
            `;
        $td.html(editorHtml);
        $td.find('input').focus();
    });

    // Close modal

    // Cancel inline edit
    $(document).on('click', '.inline-cancel-details', function (e) {
        var $td = $(this).closest('td');
        var original = $td.data('original-content');
        $td.html(original);
    });

    // Update inline edit: call backend to update
    $(document).on('click', '.inline-update-details', function (e) {
        var $td = $(this).closest('td');
        var id = $(this).data('id');
        var newVal = $td.find('input').val();
        // AJAX call to update details
        $.ajax({
            url: '/Budget/UpdateText',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ id: id, details: newVal }),
            dataType: 'json',
            success: function (res) {
                if (res && res.Success) {
                    $td.html(newVal);
                    showMessage('Updated');
                } else {
                    showMessageError();
                    $td.html($td.data('original-content'));
                }
            },
            error: function () {
                showMessageError();
                $td.html($td.data('original-content'));
            }
        });
    });

    // Update button click
    $(document).on('click', '#modalUpdateBtn', function () {
        var id = $('#modalHiddenId').val();
        // You can add your update logic here, for now just alert
        alert('Selected Row ID: ' + id);
        $('#customEditModal').fadeOut(100);
    });

    $(document).on("keydown", ".only-numeric", function (e) {

        // Allow: backspace, delete, tab, escape, enter
        if (
            $.inArray(e.keyCode, [8, 9, 13, 27, 46]) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.ctrlKey === true && $.inArray(e.keyCode, [65, 67, 86, 88]) !== -1) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)
        ) {
            return;
        }

        // Allow minus (-) only at the beginning
        if (e.keyCode === 189 || e.keyCode === 109) { // - key
            if ($(this).val().length !== 0) {
                e.preventDefault();
            }
            return;
        }

        // Allow decimal point (.)
        if (e.keyCode === 190 || e.keyCode === 110) {
            // Prevent more than one dot
            if ($(this).val().indexOf('.') !== -1) {
                e.preventDefault();
            }
            return;
        }

        // Block anything that is not a number (0–9)
        if (
            (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
            (e.keyCode < 96 || e.keyCode > 105)
        ) {
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

        if (amount.trim() === "" || isNaN(amount)) {
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

                    //div
                    $("#btnsingleSearch").hide();
                    $("#btnUpdateBudgetGroupSingle").show();
                    $("#btnUpdateBudgetGroup").hide();
                    //btns
                    $("#divdllOnRender").hide();
                    $("#divDDLSingle").show();
                    $("#divDDLMulti").hide();
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



    // Double-click to toggle IsVerified
    $(document).on('dblclick', '.validated-row', function () {
        var $tr = $(this).closest('tr');
        var id = $tr.attr('id');
        if (!id) return;
        $.ajax({
            url: '/Budget/UpdateBudgetVerificationById',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ Id: parseInt(id), IsVerified: false }),
            dataType: 'json',
            success: function (res) {
                if (res > 0) {
                    showMessage('Marked as not validated');
                    GetAllBudgetFromToWithGroup();
                } else {
                    showMessageError();
                }
            },
            error: function () {
                showMessageError();
            }
        });
    });

    $(document).on('dblclick', '.not-validated-row', function () {
        var $tr = $(this).closest('tr');
        var id = $tr.attr('id');
        if (!id) return;
        $.ajax({
            url: '/Budget/UpdateBudgetVerificationById',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ Id: parseInt(id), IsVerified: true }),
            dataType: 'json',
            success: function (res) {
                if (res > 0) {
                    showMessage('Marked as validated');
                    GetAllBudgetFromToWithGroup();
                } else {
                    showMessageError();
                }
            },
            error: function () {
                showMessageError();
            }
        });
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

    //execute on page load
    function GetAllBudgetFromToWithGroup() {
        var year = $("#ddlYear").val();
        var month = $("#ddlMonth").val();
        var isAll = $('#checkForAll').prop('checked');

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
            data: { year: year, month: month, g1: g1, g2: g2, g3: g3, g4: g4, isAll: isAll },
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
            var IsSafeDiv = item.IsVerified ?
            "<i class='fa-solid fa-lock validated-row'></i>"
            : "<i class='fa-solid fa-xmark not-validated-row'></i>";

            html += "<tr class='no-css id-" + item.Id + "' id='" + item.Id + "'>";

            // --- ICON COLUMN ---
            html += "<td class='" + dayClass + "'>";
            //html += IsSafeDiv;
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
            html += "" + IsSafeDiv + " </td>";

            // --- DETAILS COLUMN ---
            html += "<td class='" + dayClass + " doubleClick' title=" + item.Id + " >" + (item.Details || "") + "</td>";

            // --- G1 COLUMN ---
            const itmClass = parseInt(item.G1) > 56 ? '14' : item.G1;
            html += `<td class="${dayClass}"><div class="div-g1-c${itmClass}">${extractNameById(item.G1) || ""}</div></td>`;

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

        var ticks = parseInt(jsonDate.replace(/\/Date\((\d+)\)\//, "$1"));
        var date = new Date(ticks);

        var istOptions = {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        var formatter = new Intl.DateTimeFormat('en-IN', istOptions);
        var parts = formatter.formatToParts(date);

        var d = parts.find(p => p.type === 'day').value;
        var m = parts.find(p => p.type === 'month').value;
        var y = parts.find(p => p.type === 'year').value;
        var h = parts.find(p => p.type === 'hour').value;
        var min = parts.find(p => p.type === 'minute').value;
        var dayPeriod = parts.find(p => p.type === 'dayPeriod').value;

        var dayName = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(date);

        // Initial base string
        var formattedResult = `${d} ${m} ${y} (${dayName})`;

        // Check if it is NOT 12:00 AM
        // Using !== for string comparison
        if (!(h === "12" && min === "00" && dayPeriod.toUpperCase() === "AM")) {
            formattedResult += ` ${h}:${min} ${dayPeriod.toUpperCase()}`;
        }

        return formattedResult;
    }
    //function ToDateAndDay(jsonDate) {
    //    if (!jsonDate) return "";

    //    // Extract ticks from /Date(1762626600000)/
    //    var ticks = parseInt(jsonDate.replace(/\/Date\((\d+)\)\//, "$1"));
    //    var date = new Date(ticks);

    //    // --- Base Date Components (Runs for all dates) ---
    //    var day = date.getDate();
    //    var year = date.getFullYear();

    //    // Short month names
    //    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    //        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    //    // Day names (3 letters)
    //    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    //    var monthName = months[date.getMonth()];
    //    var dayName = days[date.getDay()];

    //    // Ensure day always has a leading zero if below 10 (e.g., "05" instead of "5")
    //    var strDay = day < 10 ? '0' + day : day;

    //    // Construct the base format: "31 Oct 2025 (Fri)"
    //    var formattedResult = `${strDay} ${monthName} ${year} (${dayName})`;

    //    // Set the target comparison date: 22 May 2026 (00:00:00 Local Time)
    //    var targetDate = new Date(2026, 4, 19); // Month is 0-indexed (4 = May)

    //    // --- Conditional Time Extension ---
    //    // Check if the date is greater than or equal to 22 May 2026
    //    if (date >= targetDate) {
    //        var hours = date.getHours();
    //        var minutes = date.getMinutes();
    //        var ampm = hours >= 12 ? 'PM' : 'AM';

    //        // Convert 24-hour format to 12-hour format
    //        hours = hours % 12;
    //        hours = hours ? hours : 12; // The hour '0' should be '12'

    //        // Pad single-digit hours and minutes with a leading zero
    //        var strHours = hours < 10 ? '0' + hours : hours;
    //        var strMinutes = minutes < 10 ? '0' + minutes : minutes;

    //        // Append the time to the base date string
    //        formattedResult += ` ${strHours}:${strMinutes} ${ampm}`;
    //    }

    //    // --- Clean up 12:00 AM ---
    //    // If the result ends with " 12:00 AM", remove it
    //    return formattedResult.replace(/ 12:00 AM$/, "");
    //}


    //function ToDateAndDay(jsonDate) {
    //    if (!jsonDate) return "";

    //    // Extract ticks from /Date(1762626600000)/
    //    var ticks = parseInt(jsonDate.replace(/\/Date\((\d+)\)\//, "$1"));

    //    var date = new Date(ticks);

    //    // Day, Month, Year
    //    var day = date.getDate();
    //    var year = date.getFullYear();

    //    // Short month names
    //    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    //        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    //    // Day names (3 letters)
    //    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    //    var monthName = months[date.getMonth()];
    //    var dayName = days[date.getDay()];

    //    // Final output
    //    return `${day} ${monthName} ${year} (${dayName})`;
    //}

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