

        function PrintDiv() {
            var divContents = document.getElementById("tblInvoice").innerHTML;
            var printWindow = window.open('', '', 'height=600,width=1200');
            printWindow.document.write("<html><head><title>Bill Content2</title> " + "<link rel='stylesheet' href='" + document.getElementById('tblInvoice').dataset.printCss + "'>" + "");
            printWindow.document.write('</head><body >');
            printWindow.document.write(divContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
        document.getElementById('printInvoiceButton').addEventListener('click', PrintDiv);

        $(document).ready(function () {
            var total_partA = 0.00, total_partB = 0.00;

            $('.partA-total').each(function () {
                let tempA = parseFloat($(this).html());
                total_partA = total_partA + tempA;
            });
            $('.partB-total').each(function () {
                let tempB = parseFloat($(this).html());
                total_partB = total_partB + tempB;
            });
            
            let percentage25 = 2.5;
            let percentage5 = 5;

            let pA = total_partA.toFixed(2);
            let pB = total_partB.toFixed(2);

            let result25 = ((percentage25 / 100) * pA).toFixed(2);
            let result5 = ((percentage5 / 100) * pA).toFixed(2);


            let partASubTotal = (parseFloat(result5) + parseFloat(pA)).toFixed(2);



            let partBSubtotal = parseFloat(pB).toFixed(2);
            let grandTotal = Math.round(parseFloat(partASubTotal) + parseFloat(partBSubtotal));

            $('#lbl_sum_partA').html(pA);
            $('#lbl_cgst').html(result25);
            $('#lbl_sgst').html(result25);
            $('#lbl_toal_gst').html(result5);

            $('#lbl_partA_subTotal').html(partASubTotal);
            
            $('#lbl_partB_subTotal').html(partBSubtotal);
            let finalAmt = grandTotal.toFixed(2);
            $('#lbl_grandTotal').html(finalAmt);

            let rupeesInWords = Math.round(grandTotal);
            $('#totalPartA_PartB').html(rupeesInWords);

            $.ajax({
                url: '/GstBill/Invoice/GetRupeesInWords',
                type: "GET",
                dataType: "json",
                data: { rps: parseFloat(rupeesInWords) },
                success: function (data) {
                    $('#wordprint').html(data);
                }
            });

        });
    