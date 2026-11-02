document.addEventListener("DOMContentLoaded", function () {
    const logDisplay = document.getElementById("logContentArea");
    const refreshButton = document.getElementById("btnRefreshLogs");
    const clearButton = document.getElementById("btnClearLogs");
    const testExceptionButton = document.getElementById("btnTestException");
    const config = document.getElementById("errorLogsConfig");

    if (!logDisplay || !config) {
        return;
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatLogText(rawText) {
        const raw = rawText || "No error logs available.";
        const lines = raw.split(/\r?\n/);

        return lines.map(function (line) {
            const trimmedLine = line.trim();

            if (/^Error Type\s*:/i.test(trimmedLine)) {
                return '<span class="log-error-row">' + escapeHtml(line) + '</span>';
            }

            if (/^Message\s*:/i.test(trimmedLine)) {
                return '<span class="log-message-row">' + escapeHtml(line) + '</span>';
            }

            return escapeHtml(line);
        }).join("\n");
    }

    function fetchLogs() {
        if (!logDisplay) return;

        logDisplay.textContent = "Loading error logs...";

        fetch(config.dataset.getLogsUrl, {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data.success) {
                    logDisplay.innerHTML = formatLogText(data.logs);
                } else {
                    logDisplay.textContent = "Error loading logs: " + (data.message || "Unknown error");
                }
            })
            .catch(function () {
                logDisplay.textContent = "Network error: Unable to retrieve logs.";
            });
    }

    function clearLogs() {
        if (!confirm("Are you sure you want to permanently clear the error logs?")) {
            return;
        }

        fetch(config.dataset.clearLogsUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data.success) {
                    logDisplay.textContent = "No error logs found.";
                } else {
                    alert("Failed to clear logs: " + data.message);
                }
            })
            .catch(function () {
                alert("Network error: Unable to clear logs.");
            });
    }

    function writeTestException() {
        testExceptionButton.disabled = true;

        fetch(config.dataset.testExceptionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data.success) {
                    fetchLogs();
                } else {
                    alert("Failed to write test exception: " + data.message);
                }
            })
            .catch(function () {
                alert("Network error: Unable to write test exception.");
            })
            .then(function () {
                testExceptionButton.disabled = false;
            });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", fetchLogs);
    }

    if (clearButton) {
        clearButton.addEventListener("click", clearLogs);
    }

    if (testExceptionButton) {
        testExceptionButton.addEventListener("click", writeTestException);
    }

    fetchLogs();
});
