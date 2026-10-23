
    $(document).ready(function () {

        $("#CustomerSubmit").click(function (e) {
            e.preventDefault();
            var custName = $("#custName").val();
            var addr1 = $("#addr1").val();
            var addr2 = $("#addr2").val();
            var gstIn = $("#gstIn").val();
            var gstType = $("#gstType").val();
            var isPost = false;
            if (custName == "") { swal("", "Customer Name should not be empty", "error"); return false; }
            if (addr1 == "") { swal("", "Address 1 should not be empty", "error"); return false; }
            if (addr2 == "") { swal("", "Address 2 should not be empty", "error"); return false; }
            if (gstIn == "") { swal("", "GstIn should not be empty", "error"); return false; }
            if (gstType == "" || gstType == 0) { swal("", "Gst Type should not be empty", "error"); return false; }
            isPost = true
            if (isPost == true) {
                $("#customerAddForm").submit();
            }
        });
    });
