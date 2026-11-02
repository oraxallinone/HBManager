# SQL Server Session State Configuration Guide (ASP.NET 4.8)

This guide documents the end-to-end implementation for storing ASP.NET 4.8 session state in Microsoft SQL Server. This configuration prevents client-side session storage conflicts in environments restricted by VPNs or enterprise proxies like Zscaler.

---

## 1. Architecture Overview

In default ASP.NET configurations, session data resides in-memory (`InProc`). Under restrictive network environments where proxies inspect, drop, or alter client cookies or where servers are load-balanced:

1. **SQL Server Mode (`mode="SQLServer"`):** Moves session memory off the web server process (`w3wp.exe`) and persists it to the configured SQL Server database.
2. **Cookieless Routing (`cookieless="AutoDetect"` or `"UseUri"`):** If Zscaler or a gateway drops the standard `ASP.NET_SessionId` cookie, ASP.NET embeds the session ID token into the URL path (e.g., `/(S(4x1...))/Account/Dashboard`), while storing the actual session values server-side.

---

## 2. Database Setup

The application database created by `SQL_Scripts/backup-2026-10-24-schema.sql` is also the session-state database in this deployment. Install the complete ASP.NET session schema into that existing database with the official registration tool; a hand-written partial schema is not compatible because the built-in SQL Server session provider requires the full set of ASP.NET stored procedures and objects. This preserves the application tables while adding the required session tables and procedures.

### Option A: Using `aspnet_regsql.exe` (Recommended)
Run the ASP.NET SQL registration tool from an elevated **Developer Command Prompt for Visual Studio**. For SQL authentication, target the existing application database:

```cmd
aspnet_regsql.exe -S <DB_SERVER_NAME> -U <SQL_LOGIN> -P <SQL_PASSWORD> -d cbtsplco_annapurna -ssadd -sstype c
```

- `-S`: Target SQL Server instance (e.g., `localhost` or `10.0.0.5`).
- `-U` / `-P`: Use the SQL login authorized to create the session database and schema. Protect the password and avoid committing it or saving it in shell history.
- `-d`: Target the existing application database created from `SQL_Scripts/backup-2026-10-24-schema.sql`.
- `-ssadd`: Installs the session state schema.
- `-sstype c`: Installs session state in the **custom database** specified by `-d`; the database and application tables remain in place.

If the SQL login used by the application differs from the installation login, grant it the permissions required to execute the ASP.NET session-state procedures in `cbtsplco_annapurna`.

---

## 3. Application Configuration (`Web.config`)

Update `<system.web>` to use the `SQLServer` session mode and provide the SQL connection string. Because the connection targets the custom `cbtsplco_annapurna` database, set `allowCustomSqlDatabase="true"`. In this application, supply the SQL password through deployment configuration; do not commit real credentials.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <connectionStrings>
    <!-- Application DB (Optional) -->
    <add name="DefaultConnection" 
         connectionString="Data Source=localhost;Initial Catalog=MyAppDb;Integrated Security=True;" 
         providerName="System.Data.SqlClient" />
  </connectionStrings>

  <system.web>
    <compilation debug="true" targetFramework="4.8" />
    <httpRuntime targetFramework="4.8" />

    <!-- 
      mode="SQLServer": Directs session storage to SQL Server.
      sqlConnectionString: Connection details for the SQL instance containing the session tables.
      cookieless="AutoDetect": Detects if Zscaler or browser drops cookies and falls back to URL tokens.
      timeout: Idle timeout in minutes.
    -->
    <sessionState mode="SQLServer"
                  sqlConnectionString="Data Source=&lt;DB_SERVER_NAME&gt;;Initial Catalog=cbtsplco_annapurna;User ID=&lt;SQL_LOGIN&gt;;Password=&lt;DEPLOYMENT_SECRET&gt;;"
                  allowCustomSqlDatabase="true"
                  cookieless="AutoDetect"
                  regenerateExpiredSessionId="true"
                  timeout="20" />
  </system.web>

  <system.webServer>
    <modules runAllManagedModulesForAllRequests="true" />
  </system.webServer>
</configuration>
```

---

## 4. Application Implementation

### A. Session Model (`Models/UserProfileSession.cs`)
> **Important:** Any custom object saved into an out-of-process session must have the `[Serializable]` attribute, or ASP.NET will throw a `SerializationException`.

```csharp
using System;

namespace SessionDemoApp.Models
{
    [Serializable]
    public class UserProfileSession
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public string Department { get; set; }
        public DateTime LoginTime { get; set; }
    }
}
```

---

### B. Controller (`Controllers/AccountController.cs`)

```csharp
using System;
using System.Web.Mvc;
using SessionDemoApp.Models;

namespace SessionDemoApp.Controllers
{
    public class AccountController : Controller
    {
        // GET: /Account/Login
        [HttpGet]
        public ActionResult Login()
        {
            return View();
        }

        // POST: /Account/Login
        [HttpPost]
        public ActionResult Login(string username)
        {
            // Create user session data
            var sessionData = new UserProfileSession
            {
                UserId = 101,
                Username = username,
                Department = "Information Technology",
                LoginTime = DateTime.UtcNow
            };

            // Serialized automatically and written to the configured database's ASPStateTempSessions table
            Session["CurrentUser"] = sessionData;

            return RedirectToAction("Dashboard");
        }

        // GET: /Account/Dashboard
        [HttpGet]
        public ActionResult Dashboard()
        {
            // Retrieved and deserialized from SQL Server
            var userSession = Session["CurrentUser"] as UserProfileSession;

            if (userSession == null)
            {
                return RedirectToAction("Login");
            }

            return View(userSession);
        }

        // GET: /Account/Logout
        [HttpGet]
        public ActionResult Logout()
        {
            // Deletes the active session record in SQL Server
            Session.Clear();
            Session.Abandon();

            return RedirectToAction("Login");
        }
    }
}
```

---

### C. Views

#### `Views/Account/Login.cshtml`
```html
@{
    Layout = null;
}
<!DOCTYPE html>
<html>
<head>
    <title>Login - SQL Session</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 40px;">
    <h2>Sign In</h2>
    @using (Html.BeginForm("Login", "Account", FormMethod.Post))
    {
        <div>
            <label for="username">Username:</label><br />
            <input type="text" id="username" name="username" required style="padding: 6px; margin: 6px 0;" />
        </div>
        <button type="submit" style="padding: 6px 14px;">Log In</button>
    }
</body>
</html>
```

#### `Views/Account/Dashboard.cshtml`
```html
@model SessionDemoApp.Models.UserProfileSession
@{
    Layout = null;
}
<!DOCTYPE html>
<html>
<head>
    <title>Session Dashboard</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 40px;">
    <h2>User Dashboard</h2>
    <p>Session ID: <strong>@Session.SessionID</strong></p>

    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <tr>
            <th>User ID</th>
            <td>@Model.UserId</td>
        </tr>
        <tr>
            <th>Username</th>
            <td>@Model.Username</td>
        </tr>
        <tr>
            <th>Department</th>
            <td>@Model.Department</td>
        </tr>
        <tr>
            <th>Login Timestamp (UTC)</th>
            <td>@Model.LoginTime.ToString("u")</td>
        </tr>
    </table>

    <br />
    <a href="@Url.Action("Logout", "Account")">Logout</a>
</body>
</html>
```

---

## 5. Verification and Troubleshooting

1. **Verify Database Records:**
   After logging in, run the following query in SSMS:
   ```sql
   SELECT SessionId, Created, Expires, Timeout, Locked 
   FROM cbtsplco_annapurna.dbo.ASPStateTempSessions;
   ```
   You should see a active record with your session's ID.

2. **Common Issues:**
   * **`SerializationException`:** Occurs if an object in `Session[...]` lacks `[Serializable]`.
   * **Login Loops under Zscaler:** If cookies are stripped, set `cookieless="UseUri"` explicitly in `Web.config` to force session IDs into the URL path.
   * **Session Cleanup:** Ensure the **SQL Server Agent** service is running so expired session rows are cleaned up by the scheduled maintenance job created by `aspnet_regsql.exe`.