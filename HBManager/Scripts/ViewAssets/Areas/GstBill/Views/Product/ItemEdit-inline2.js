
    $(document).ready(function () {
        var getItemGstValue = $("#Gst").val();
        if (getItemGstValue != "") {
            $("#itemGstValue").val(getItemGstValue).change();
        }
        else {
            $("#itemGstValue").val(-1).change();
        }

        $("#updateItem").click(function (e) {
            e.preventDefault();
            var ItemCode = $("#ItemCode").val();
            var ItemDetails = $("#ItemDetails").val();
            var ItemPart = $("#ItemPart").val();
            var HSN = $("#HSN").val();
            var Rate = $("#Rate").val();
            var Gst = $("#itemGstValue").val();
            var isPost = false;
            if (ItemCode == "") { swal("", "Item Code should not be empty", "error"); return false; }
            if (ItemDetails == "") { swal("", "Item Details should not be empty", "error"); return false; }
            if (ItemPart == "") { swal("", "Item Part should not be empty", "error"); return false; }
            if (HSN == "") { swal("", "HSN should not be empty", "error"); return false; }
            if (Rate == "") { swal("", "Rate should not be empty", "error"); return false; }
            if (Gst == -1) { swal("", "Choose a Item GST value", "error"); return false; }
            isPost = true

            if (isPost == true) {
                $("#editItemForm").submit();
            }
        });

        $('[id^=Rate]').keypress(validateNumber);
        $('[id^=Gst]').keypress(validateNumber);

        function validateNumber(event) {
            var key = window.event ? event.keyCode : event.which;
            if (event.keyCode === 8 || event.keyCode === 46) {
                return true;
            } else if (key < 48 || key > 57) {
                return false;
            } else {
                return true;
            }
        };

        $('#itemGstValue').change(function () {
            var gst = $(this).val();
            var tempGst = parseInt(gst);
            $("#Gst").val(tempGst);
        });

    });
