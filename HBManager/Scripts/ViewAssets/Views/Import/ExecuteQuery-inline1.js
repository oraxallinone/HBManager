
        function clearForm() {
            // Clears the textarea value
            var textarea = document.getElementById("SqlQueryTextArea");
            if (textarea) {
                textarea.value = "";
            }

            // Hides the success/error message alert box if it's visible
            var msgAlert = document.getElementById("messageAlert");
            if (msgAlert) {
                msgAlert.style.display = "none";
            }
        }

        document.getElementById("clearQueryFormButton").addEventListener("click", clearForm);
    