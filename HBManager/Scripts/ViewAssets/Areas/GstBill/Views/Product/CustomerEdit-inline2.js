
    $(document).ready(function () {
        var getGstType = $("#gstType").val();
        if (getGstType != "")
        {
            $("#gstTypeEdit").val(getGstType).change();
        }
        else {
            $("#gstTypeEdit").val(0).change();
        }

        $("#gstTypeEdit").change(function () {
            const ddlValue = $(this).val();
            $("#gstType").val(ddlValue);
        });

        $("#CustomerUpdate").click(function (e) {
            e.preventDefault();
            ;
            var custName = $("#custName").val();
            var addr1 = $("#addr1").val();
            var addr2 = $("#addr2").val();
            var gstIn = $("#gstIn").val();
            var gstType = $("#gstType").val()

            var isPost = false;

            if (custName == "") { swal("", "Customer Name should not be empty", "error"); return false; }
            if (addr1 == "") { swal("", "Address 1 should not be empty", "error"); return false; }
            if (addr2 == "") { swal("", "Address 2 should not be empty", "error"); return false; }
            if (gstIn == "") { swal("", "GstIn should not be empty", "error"); return false; }
            if (gstType == 0) { swal("", "Please select GST Type"); return false; }
            isPost = true
            if (isPost == true) {
                $("#customerEditForm").submit();
            }
        });
    });
