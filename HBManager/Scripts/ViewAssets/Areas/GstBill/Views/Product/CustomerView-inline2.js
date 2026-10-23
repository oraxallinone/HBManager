
    $(document).ready(function () {
        var getGstType = $("#gstType").val();
        if (getGstType != '') {
            $("#gstTypeEdit").val(getGstType).change();
        }
        $("#gstTypeEdit").change(function () {
            const ddlValue = $(this).val();
            $("#gstType").val(ddlValue);
        });
    });
