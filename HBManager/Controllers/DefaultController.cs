using HBManager.Service;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

namespace HBManager.Controllers
{
    public class DefaultController : Controller
    {
        private readonly GraphService _graphService = new GraphService();
        private readonly DashboardService _dashboardService = new DashboardService();

        public ActionResult Dashboard()
        {
            return View();
        }

        public ActionResult BarChart()
        {
            return View();
        }

        public ActionResult StockCandle()
        {
            return View();
        }

        public ActionResult StockTechData()
        {
            return View();
        }

        [HttpPost]
        public async Task<JsonResult> GetNseStockCandles(string stockSymbol, string stockExchange = "NSE")
        {
            if (string.IsNullOrWhiteSpace(stockSymbol))
            {
                return Json(new { success = false, message = "Please enter a stock symbol." }, JsonRequestBehavior.AllowGet);
            }

            var normalizedSymbol = stockSymbol.Trim();
            if (string.IsNullOrWhiteSpace(normalizedSymbol))
            {
                return Json(new { success = false, message = "Please enter a stock symbol." }, JsonRequestBehavior.AllowGet);
            }

            normalizedSymbol = normalizedSymbol.ToUpperInvariant();
            var exchangeSuffix = string.Equals(stockExchange, "BSE", StringComparison.OrdinalIgnoreCase) ? ".BO" : ".NS";
            if (!normalizedSymbol.EndsWith(".NS", StringComparison.OrdinalIgnoreCase) &&
                !normalizedSymbol.EndsWith(".BO", StringComparison.OrdinalIgnoreCase))
            {
                normalizedSymbol += exchangeSuffix;
            }

            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");
                    var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{Uri.EscapeDataString(normalizedSymbol)}?range=9mo&interval=1d";

                    using (var response = await client.GetAsync(url))
                    {
                        var responseText = await response.Content.ReadAsStringAsync();
                        if (!response.IsSuccessStatusCode)
                        {
                            return Json(new { success = false, message = $"Yahoo Finance request failed: {response.StatusCode}" }, JsonRequestBehavior.AllowGet);
                        }

                        var root = JObject.Parse(responseText);
                        var chartError = root["chart"]?["error"]?.ToString();
                        if (!string.IsNullOrWhiteSpace(chartError))
                        {
                            return Json(new { success = false, message = chartError }, JsonRequestBehavior.AllowGet);
                        }

                        var result = root["chart"]?["result"]?[0];
                        if (result == null)
                        {
                            return Json(new { success = false, message = "No market data returned for the symbol." }, JsonRequestBehavior.AllowGet);
                        }

                        var timestamps = result["timestamp"] as JArray;
                        var quote = result["indicators"]?["quote"]?[0];
                        if (timestamps == null || quote == null)
                        {
                            return Json(new { success = false, message = "No candle data was returned for this symbol." }, JsonRequestBehavior.AllowGet);
                        }

                        var opens = quote["open"] as JArray;
                        var highs = quote["high"] as JArray;
                        var lows = quote["low"] as JArray;
                        var closes = quote["close"] as JArray;
                        var volumes = quote["volume"] as JArray;

                        var candles = new List<object>();

                        for (int i = 0; i < timestamps.Count; i++)
                        {
                            if (opens == null || highs == null || lows == null || closes == null || volumes == null)
                            {
                                continue;
                            }

                            var timeStampValue = timestamps[i]?.Value<long?>();
                            if (!timeStampValue.HasValue)
                            {
                                continue;
                            }

                            var openValue = opens[i]?.Value<decimal?>();
                            var highValue = highs[i]?.Value<decimal?>();
                            var lowValue = lows[i]?.Value<decimal?>();
                            var closeValue = closes[i]?.Value<decimal?>();
                            var volumeValue = volumes[i]?.Value<long?>();

                            if (!openValue.HasValue || !highValue.HasValue || !lowValue.HasValue || !closeValue.HasValue || !volumeValue.HasValue)
                            {
                                continue;
                            }

                            var date = DateTimeOffset.FromUnixTimeSeconds(timeStampValue.Value).LocalDateTime;
                            candles.Add(new
                            {
                                date = date.ToString("yyyy-MM-dd"),
                                open = openValue.Value,
                                high = highValue.Value,
                                low = lowValue.Value,
                                close = closeValue.Value,
                                volume = volumeValue.Value
                            });
                        }

                        return Json(new
                        {
                            success = true,
                            symbol = normalizedSymbol.Replace(".NS", "").Replace(".BO", ""),
                            candles = candles
                        }, JsonRequestBehavior.AllowGet);
                    }
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public async Task<JsonResult> GetStockFundamentalData(string stockSymbol)
        {
            if (string.IsNullOrWhiteSpace(stockSymbol))
            {
                return Json(new { success = false, message = "Please enter a stock symbol." }, JsonRequestBehavior.AllowGet);
            }

            var normalizedSymbol = stockSymbol.Trim().ToUpperInvariant();

            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

                // Try Alpha Vantage API first
                var fundamentals = await FetchFromAlphaVantage(normalizedSymbol);

                if (fundamentals != null && fundamentals.success)
                {
                    return Json(new
                    {
                        success = true,
                        data = fundamentals.data
                    }, JsonRequestBehavior.AllowGet);
                }

                // Fallback to Financial Modeling Prep if Alpha Vantage fails
                fundamentals = await FetchFromFMP(normalizedSymbol);

                if (fundamentals != null && fundamentals.success)
                {
                    return Json(new
                    {
                        success = true,
                        data = fundamentals.data
                    }, JsonRequestBehavior.AllowGet);
                }

                return Json(new { success = false, message = "Unable to fetch fundamental data from available sources." }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        private async Task<dynamic> FetchFromAlphaVantage(string symbol)
        {
            try
            {
                // Alpha Vantage free API key - replace with your own from https://www.alphavantage.co/api/
                string apiKey = "demo"; // Use 'demo' for testing, get your own free key

                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");

                    // Fetch Overview data
                    var overviewUrl = $"https://www.alphavantage.co/query?function=OVERVIEW&symbol={Uri.EscapeDataString(symbol)}&apikey={apiKey}";
                    using (var response = await client.GetAsync(overviewUrl))
                    {
                        var responseText = await response.Content.ReadAsStringAsync();
                        if (!response.IsSuccessStatusCode || responseText.Contains("\"Error Message\""))
                        {
                            return null;
                        }

                        var data = JObject.Parse(responseText);

                        // Check if we got valid data
                        if (data["Symbol"] == null)
                        {
                            return null;
                        }

                        var fundamentals = new
                        {
                            symbol = data["Symbol"]?.ToString() ?? symbol,
                            name = data["Name"]?.ToString(),
                            sector = data["Sector"]?.ToString(),
                            industry = data["Industry"]?.ToString(),
                            marketCapitalization = data["MarketCapitalization"]?.ToString(),
                            peRatio = data["PERatio"]?.ToString(),
                            eps = data["EPS"]?.ToString(),
                            bookValue = data["BookValue"]?.ToString(),
                            priceToBookRatio = data["PriceToBookRatio"]?.ToString(),
                            dividendPerShare = data["DividendPerShare"]?.ToString(),
                            dividendYield = data["DividendYield"]?.ToString(),
                            profitMargin = data["ProfitMargin"]?.ToString(),
                            operatingMarginTTM = data["OperatingMarginTTM"]?.ToString(),
                            returnOnAssetsTTM = data["ReturnOnAssetsTTM"]?.ToString(),
                            returnOnEquityTTM = data["ReturnOnEquityTTM"]?.ToString(),
                            quarterlyRevenueGrowthYoY = data["QuarterlyRevenueGrowthYoY"]?.ToString(),
                            quarterlyEarningsGrowthYoY = data["QuarterlyEarningsGrowthYoY"]?.ToString(),
                            analystTargetPrice = data["AnalystTargetPrice"]?.ToString(),
                            trailingPE = data["TrailingPE"]?.ToString(),
                            forwardPE = data["ForwardPE"]?.ToString(),
                            priceToSalesRatio = data["PriceToSalesRatioTTM"]?.ToString(),
                            beta = data["Beta"]?.ToString(),
                            fiftyTwoWeekHigh = data["52WeekHigh"]?.ToString(),
                            fiftyTwoWeekLow = data["52WeekLow"]?.ToString(),
                            fiftyDayMovingAverage = data["50DayMovingAverage"]?.ToString(),
                            twoHundredDayMovingAverage = data["200DayMovingAverage"]?.ToString(),
                            currency = data["Currency"]?.ToString() ?? "USD"
                        };

                        return new { success = true, data = fundamentals };
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Alpha Vantage Error: {ex.Message}");
                return null;
            }
        }

        private async Task<dynamic> FetchFromFMP(string symbol)
        {
            try
            {
                // Financial Modeling Prep free API key - get yours at https://financialmodelingprep.com/developer/docs
                string apiKey = "demo"; // Use 'demo' for testing, get your own free key

                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");

                    // Fetch Company Profile data
                    var profileUrl = $"https://financialmodelingprep.com/api/v3/profile/{Uri.EscapeDataString(symbol)}?apikey={apiKey}";
                    using (var response = await client.GetAsync(profileUrl))
                    {
                        var responseText = await response.Content.ReadAsStringAsync();
                        if (!response.IsSuccessStatusCode)
                        {
                            return null;
                        }

                        var dataArray = JArray.Parse(responseText);
                        if (dataArray.Count == 0)
                        {
                            return null;
                        }

                        var data = dataArray[0];

                        // Fetch Key Metrics
                        var metricsUrl = $"https://financialmodelingprep.com/api/v3/key-metrics/{Uri.EscapeDataString(symbol)}?limit=1&apikey={apiKey}";
                        JArray metricsArray = null;
                        try
                        {
                            using (var metricsResponse = await client.GetAsync(metricsUrl))
                            {
                                var metricsText = await metricsResponse.Content.ReadAsStringAsync();
                                metricsArray = JArray.Parse(metricsText);
                            }
                        }
                        catch { /* Ignore metrics errors */ }

                        var metrics = metricsArray?.Count > 0 ? metricsArray[0] : null;

                        var fundamentals = new
                        {
                            symbol = data["symbol"]?.ToString() ?? symbol,
                            name = data["companyName"]?.ToString(),
                            sector = data["sector"]?.ToString(),
                            industry = data["industry"]?.ToString(),
                            marketCapitalization = data["mktCap"]?.ToString(),
                            peRatio = metrics?["peRatio"]?.ToString() ?? data["price"]?.ToString(),
                            eps = data["eps"]?.ToString(),
                            bookValue = metrics?["bookValuePerShare"]?.ToString(),
                            priceToBookRatio = metrics?["pbRatio"]?.ToString(),
                            dividendPerShare = metrics?["dividendPerShare"]?.ToString(),
                            dividendYield = metrics?["dividendYield"]?.ToString(),
                            profitMargin = metrics?["netProfitMargin"]?.ToString(),
                            operatingMarginTTM = metrics?["operatingProfitMargin"]?.ToString(),
                            returnOnAssetsTTM = metrics?["returnOnAssets"]?.ToString(),
                            returnOnEquityTTM = metrics?["returnOnEquity"]?.ToString(),
                            priceToSalesRatio = metrics?["psRatio"]?.ToString(),
                            beta = data["beta"]?.ToString(),
                            fiftyTwoWeekHigh = data["ipoDate"]?.ToString(),
                            fiftyTwoWeekLow = data["defaultImage"]?.ToString(),
                            currency = data["currency"]?.ToString() ?? "USD"
                        };

                        return new { success = true, data = fundamentals };
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"FMP Error: {ex.Message}");
                return null;
            }
        }

        [HttpPost]

        public JsonResult GetBarGraphByGroup(int? g1, int? g2, int? g3, int? g4)
        {
            try
            {
                var result = _graphService.GetBarGraphByGroupService(g1, g2, g3, g4);
                return Json(result, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult GetCurrentMonthSalaryDetails(int year, int month)
        {
            try
            {
                var data = _dashboardService.GetCurrentMonthSalaryDetails(year, month);
                return Json(data, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        #region Purchase Stock Tracker

        [HttpGet]
        public ActionResult PurchaseStockTracker()
        {
            return View();
        }

        [HttpGet]
        public async Task<JsonResult> GetPurchaseStockTrackerData()
        {
            var result = new List<object>();
            var connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"]?.ConnectionString;

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return Json(new { success = false, message = "Connection string not found." }, JsonRequestBehavior.AllowGet);
            }

            try
            {
                using (var conn = new SqlConnection(connectionString))
                {
                    var savedStatuses = new Dictionary<int, string>();
                    using (var statusCommand = new SqlCommand("SELECT slno, Status FROM dbo.StocksPurchasedTracker", conn))
                    {
                        await conn.OpenAsync();
                        try
                        {
                            using (var statusReader = await statusCommand.ExecuteReaderAsync())
                            {
                                while (await statusReader.ReadAsync())
                                {
                                    var statusSlno = Convert.ToInt32(statusReader["slno"]);
                                    savedStatuses[statusSlno] = statusReader["Status"] == DBNull.Value
                                        ? "1"
                                        : statusReader["Status"].ToString();
                                }
                            }
                        }
                        catch (SqlException)
                        {
                            // Older databases may not have the Status column yet.
                        }
                    }

                    using (var cmd = new SqlCommand("dbo.GetPurchaseStockTracker", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@OnlyActive", 1);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var slno = reader["slno"] == DBNull.Value ? 0 : Convert.ToInt32(reader["slno"]);
                                var stockName = reader["StockName"]?.ToString();
                                var purchaseDate = reader["PurchaseDate"] == DBNull.Value ? DateTime.Today : Convert.ToDateTime(reader["PurchaseDate"]);
                                var purchasePrice = reader["PurchasePrice"] == DBNull.Value ? 0m : Convert.ToDecimal(reader["PurchasePrice"]);
                                var quantity = reader["PurchaseQty"] == DBNull.Value ? 1m : Convert.ToDecimal(reader["PurchaseQty"]);
                                var exchange = reader["nsebse"]?.ToString();

                                if (string.IsNullOrWhiteSpace(stockName))
                                {
                                    continue;
                                }

                                var status = savedStatuses.ContainsKey(slno) ? savedStatuses[slno] : "1";
                                if (status == "4")
                                {
                                    const string placeholderValue = "--";
                                    result.Add(new
                                    {
                                        slno = slno,
                                        stockName = stockName,
                                        exchange = GetExchangeLabel(exchange),
                                        exchangeCode = exchange,
                                        status = status,
                                        purchaseDate = purchaseDate.ToString("yyyy-MM-dd"),
                                        ageOfStock = Math.Max(0, (DateTime.Today - purchaseDate.Date).Days),
                                        purchasePrice = purchasePrice,
                                        quantity = quantity,
                                        lastClosePrice = placeholderValue,
                                        currentPrice = placeholderValue,
                                        amountChange = placeholderValue,
                                        percentChange = placeholderValue,
                                        myChangeAmount = placeholderValue,
                                        myChangePercent = placeholderValue,
                                        increaseDays = placeholderValue,
                                        decreaseDays = placeholderValue,
                                        dailyChanges = new List<object>()
                                    });
                                    continue;
                                }

                                var stockData = await GetYahooStockSnapshotAsync(stockName, purchaseDate, purchasePrice, exchange);
                                var myChangeAmount = quantity * (stockData.lastClosePrice - purchasePrice);
                                var myChangePercent = purchasePrice == 0 || quantity == 0 ? 0m : (myChangeAmount / (purchasePrice * quantity)) * 100m;

                                result.Add(new
                                {
                                    slno = slno,
                                    stockName = stockName,
                                    exchange = GetExchangeLabel(exchange),
                                    exchangeCode = exchange,
                                    status = status,
                                    purchaseDate = purchaseDate.ToString("yyyy-MM-dd"),
                                    ageOfStock = stockData.ageOfStock,
                                    purchasePrice = purchasePrice,
                                    quantity = quantity,
                                    lastClosePrice = stockData.lastClosePrice,
                                    currentPrice = stockData.lastClosePrice,
                                    amountChange = stockData.amountChange,
                                    percentChange = stockData.percentChange,
                                    myChangeAmount = myChangeAmount,
                                    myChangePercent = myChangePercent,
                                    increaseDays = stockData.increaseDays,
                                    decreaseDays = stockData.decreaseDays,
                                    dailyChanges = stockData.dailyChanges ?? new List<object>()
                                });
                            }
                        }
                    }
                }

                return Json(new { success = true, data = result }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UpdatePurchaseStockTracker(int slno, string nsebse, string status)
        {
            var allowedExchanges = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "NSE", "BSE" };
            var allowedStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "1", "2", "3", "4", "5"
            };

            var normalizedExchange = (nsebse ?? "").Trim().ToUpperInvariant();
            var normalizedStatus = (status ?? "").Trim();
            if (!allowedExchanges.Contains(normalizedExchange) || !allowedStatuses.Contains(normalizedStatus))
            {
                return Json(new { success = false, message = "Invalid exchange or status." });
            }

            try
            {
                using (var connection = new SqlConnection(ConfigurationManager.ConnectionStrings["ConnectionString"]?.ConnectionString))
                using (var command = new SqlCommand(@"
                    UPDATE dbo.StocksPurchasedTracker
                    SET nsebse = @nsebse, Status = @Status
                    WHERE slno = @slno", connection))
                {
                    command.Parameters.Add("@nsebse", SqlDbType.VarChar, 10).Value = normalizedExchange.ToLowerInvariant();
                    command.Parameters.Add("@Status", SqlDbType.VarChar, 20).Value = normalizedStatus;
                    command.Parameters.Add("@slno", SqlDbType.Int).Value = slno;
                    connection.Open();

                    if (command.ExecuteNonQuery() == 0)
                    {
                        return Json(new { success = false, message = "Stock record was not found." });
                    }
                }

                return Json(new { success = true, message = "Stock updated successfully." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        private async Task<dynamic> GetYahooStockSnapshotAsync(string stockName, DateTime purchaseDate, decimal purchasePrice, string exchange = null)
        {
            try
            {
                var normalizedSymbol = NormalizeYahooSymbol(stockName, exchange);
                var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{Uri.EscapeDataString(normalizedSymbol)}?range=9mo&interval=1d";

                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");
                    client.Timeout = TimeSpan.FromSeconds(30);

                    using (var request = new HttpRequestMessage(HttpMethod.Get, url))
                    {
                        request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                        using (var response = await client.SendAsync(request))
                        {
                            var responseText = await response.Content.ReadAsStringAsync();
                            if (!response.IsSuccessStatusCode)
                            {
                                return new
                                {
                                    ageOfStock = GetAgeInDays(purchaseDate),
                                    lastClosePrice = 0m,
                                    amountChange = 0m,
                                    percentChange = 0m,
                                    increaseDays = 0,
                                    decreaseDays = 0
                                };
                            }

                            var root = JObject.Parse(responseText);
                            var result = root["chart"]?["result"]?[0];
                            var timestamps = result?["timestamp"] as JArray;
                            var quote = result?["indicators"]?["quote"]?[0];

                            if (timestamps == null || quote == null)
                            {
                                return new
                                {
                                    ageOfStock = GetAgeInDays(purchaseDate),
                                    lastClosePrice = 0m,
                                    amountChange = 0m,
                                    percentChange = 0m,
                                    increaseDays = 0,
                                    decreaseDays = 0
                                };
                            }

                            var closes = quote["close"] as JArray;
                            if (closes == null || closes.Count == 0)
                            {
                                return new
                                {
                                    ageOfStock = GetAgeInDays(purchaseDate),
                                    lastClosePrice = 0m,
                                    amountChange = 0m,
                                    percentChange = 0m,
                                    increaseDays = 0,
                                    decreaseDays = 0
                                };
                            }

                            var validCloses = new List<decimal>();
                            foreach (var item in closes)
                            {
                                if (item == null || item.Type == JTokenType.Null)
                                {
                                    continue;
                                }

                                decimal closeValue;
                                if (decimal.TryParse(item.ToString(), out closeValue))
                                {
                                    validCloses.Add(closeValue);
                                }
                            }

                            if (validCloses.Count == 0)
                            {
                                return new
                                {
                                    ageOfStock = GetAgeInDays(purchaseDate),
                                    lastClosePrice = 0m,
                                    amountChange = 0m,
                                    percentChange = 0m,
                                    increaseDays = 0,
                                    decreaseDays = 0
                                };
                            }

                            var lastClosePrice = validCloses.Last();
                            var amountChange = lastClosePrice - purchasePrice;
                            var percentChange = purchasePrice == 0 ? 0m : (amountChange / purchasePrice) * 100m;
                            var counts = CountIncreaseDecreaseDays(validCloses);
                            var dailyChanges = BuildDailyChanges(timestamps, quote, validCloses.Count);

                            return new
                            {
                                ageOfStock = GetAgeInDays(purchaseDate),
                                lastClosePrice = lastClosePrice,
                                amountChange = amountChange,
                                percentChange = percentChange,
                                increaseDays = counts.increaseDays,
                                decreaseDays = counts.decreaseDays,
                                dailyChanges = dailyChanges
                            };
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Yahoo stock snapshot error for {stockName}: {ex.Message}");
                return new
                {
                    ageOfStock = GetAgeInDays(purchaseDate),
                    lastClosePrice = 0m,
                    amountChange = 0m,
                    percentChange = 0m,
                    increaseDays = 0,
                    decreaseDays = 0
                };
            }
        }

        private static string NormalizeYahooSymbol(string stockName, string exchange = null)
        {
            if (string.IsNullOrWhiteSpace(stockName))
            {
                return "RELIANCE.NS";
            }

            var exchangeCode = GetExchangeCode(exchange);
            var symbol = stockName.Trim().ToUpperInvariant();
            if (symbol.Contains("."))
            {
                return symbol;
            }

            return symbol + exchangeCode;
        }

        private static string GetExchangeCode(string exchange)
        {
            var normalizedExchange = (exchange ?? string.Empty).Trim();

            if (normalizedExchange.Equals("bse", StringComparison.OrdinalIgnoreCase))
            {
                return ".BO";
            }

            return ".NS";
        }

        private static string GetExchangeLabel(string exchange)
        {
            var normalizedExchange = (exchange ?? string.Empty).Trim();

            if (normalizedExchange.Equals("bse", StringComparison.OrdinalIgnoreCase))
            {
                return "BSE";
            }

            return "NSE";
        }

        private static int GetAgeInDays(DateTime purchaseDate)
        {
            return Math.Max(0, (DateTime.Today - purchaseDate).Days);
        }

        private static dynamic CountIncreaseDecreaseDays(List<decimal> closes)
        {
            var increaseDays = 0;
            var decreaseDays = 0;

            for (int i = 1; i < closes.Count; i++)
            {
                if (closes[i] > closes[i - 1])
                {
                    increaseDays++;
                }
                else if (closes[i] < closes[i - 1])
                {
                    decreaseDays++;
                }
            }

            return new { increaseDays, decreaseDays };
        }

        private static List<object> BuildDailyChanges(JArray timestamps, JToken quote, int maxEntries)
        {
            var dailyChanges = new List<object>();
            var opens = quote?["open"] as JArray;
            var highs = quote?["high"] as JArray;
            var lows = quote?["low"] as JArray;
            var closes = quote?["close"] as JArray;
            var volumes = quote?["volume"] as JArray;

            if (timestamps == null || timestamps.Count == 0 || opens == null || highs == null || lows == null || closes == null || volumes == null)
            {
                return dailyChanges;
            }

            decimal? previousClose = null;
            var totalEntries = Math.Min(Math.Max(maxEntries, 0), timestamps.Count);

            for (int i = Math.Max(0, timestamps.Count - totalEntries); i < timestamps.Count; i++)
            {
                var timestampValue = timestamps[i]?.Value<long?>();
                if (timestampValue == null)
                {
                    continue;
                }

                var date = DateTimeOffset.FromUnixTimeSeconds(timestampValue.Value).UtcDateTime.ToString("yyyy-MM-dd");
                var openValue = ParseDecimal(opens, i);
                var highValue = ParseDecimal(highs, i);
                var lowValue = ParseDecimal(lows, i);
                var closeValue = ParseDecimal(closes, i);
                var volumeValue = ParseLong(volumes, i);

                decimal changeAmount = 0m;
                decimal changePercent = 0m;

                if (previousClose.HasValue && previousClose.Value != 0m && closeValue != 0m)
                {
                    changeAmount = closeValue - previousClose.Value;
                    changePercent = (changeAmount / previousClose.Value) * 100m;
                }

                dailyChanges.Add(new
                {
                    date = date,
                    open = openValue,
                    high = highValue,
                    low = lowValue,
                    close = closeValue,
                    changePercent = changePercent,
                    changeAmount = changeAmount,
                    changeStatus = GetChangeStatus(changeAmount),
                    volume = volumeValue
                });

                previousClose = closeValue;
            }

            return dailyChanges;
        }

        private static decimal ParseDecimal(JArray values, int index)
        {
            if (values == null || index < 0 || index >= values.Count)
            {
                return 0m;
            }

            var token = values[index];
            if (token == null || token.Type == JTokenType.Null)
            {
                return 0m;
            }

            decimal parsed;
            return decimal.TryParse(token.ToString(), out parsed) ? parsed : 0m;
        }

        private static long ParseLong(JArray values, int index)
        {
            if (values == null || index < 0 || index >= values.Count)
            {
                return 0;
            }

            var token = values[index];
            if (token == null || token.Type == JTokenType.Null)
            {
                return 0;
            }

            long parsed;
            return long.TryParse(token.ToString(), out parsed) ? parsed : 0;
        }

        private static string GetChangeStatus(decimal changeAmount)
        {
            if (changeAmount > 0m)
            {
                return "UP";
            }

            if (changeAmount < 0m)
            {
                return "DOWN";
            }

            return "FLAT";
        }

        #endregion

        [HttpPost]
        public async Task<JsonResult> GetStockTechFundamentalData(string stockSymbol)
        {
            if (string.IsNullOrWhiteSpace(stockSymbol))
            {
                return Json(new { success = false, message = "Please enter a stock symbol." }, JsonRequestBehavior.AllowGet);
            }

            var normalizedSymbol = stockSymbol.Trim().ToUpperInvariant();

            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");
                    client.Timeout = TimeSpan.FromSeconds(30);

                    var profileData = await FetchYahooCompanyProfile(client, normalizedSymbol);
                    var metricsData = await FetchYahooKeyMetrics(client, normalizedSymbol);
                    var growthData = await FetchYahooGrowth(client, normalizedSymbol);
                    var incomeData = await FetchYahooIncomeStatement(client, normalizedSymbol);
                    var balanceData = await FetchYahooBalanceSheet(client, normalizedSymbol);
                    var cashFlowData = await FetchYahooCashFlow(client, normalizedSymbol);

                    return Json(new
                    {
                        success = true,
                        profile = profileData,
                        metrics = metricsData,
                        ratios = metricsData,
                        growth = growthData,
                        income = incomeData,
                        balance = balanceData,
                        cashFlow = cashFlowData
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Yahoo] Exception: {ex.Message}\n{ex.StackTrace}");
                return Json(new { success = false, message = "Error: " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        private async Task<dynamic> FetchYahooCompanyProfile(HttpClient client, string symbol)
        {
            try
            {
                var url = $"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{Uri.EscapeDataString(symbol)}?modules=price,assetProfile,summaryDetail,defaultKeyStatistics,financialData";

                using (var request = new HttpRequestMessage(HttpMethod.Get, url))
                {
                    request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    using (var response = await client.SendAsync(request))
                    {
                        var responseText = await response.Content.ReadAsStringAsync();
                        if (!response.IsSuccessStatusCode)
                        {
                            Console.WriteLine($"Yahoo CompanyProfile Error: {response.StatusCode} - {responseText}");
                            return null;
                        }

                        var json = JObject.Parse(responseText);
                        var result = json["quoteSummary"]?["result"]?[0];
                        if (result == null)
                            return null;

                        var price = result["price"];
                        var assetProfile = result["assetProfile"];
                        var summaryDetail = result["summaryDetail"];

                        return new
                        {
                            symbol = symbol,
                            companyName = price?["shortName"]?.ToString() ?? symbol,
                            name = price?["shortName"]?.ToString() ?? symbol,
                            sector = assetProfile?["sector"]?.ToString(),
                            industry = assetProfile?["industry"]?.ToString(),
                            country = assetProfile?["country"]?.ToString(),
                            website = assetProfile?["website"]?.ToString(),
                            currency = price?["currency"]?.ToString() ?? "USD",
                            currentPrice = price?["regularMarketPrice"]?["raw"]?.Value<decimal?>(),
                            marketCap = summaryDetail?["marketCap"]?["raw"]?.Value<long?>(),
                            fiftyTwoWeekHigh = summaryDetail?["fiftyTwoWeekHigh"]?["raw"]?.Value<decimal?>(),
                            fiftyTwoWeekLow = summaryDetail?["fiftyTwoWeekLow"]?["raw"]?.Value<decimal?>()
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Yahoo CompanyProfile Exception: {ex.Message}");
                return null;
            }
        }

        private async Task<dynamic> FetchYahooKeyMetrics(HttpClient client, string symbol)
        {
            try
            {
                var url = $"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{Uri.EscapeDataString(symbol)}?modules=defaultKeyStatistics,financialData,summaryDetail";

                using (var request = new HttpRequestMessage(HttpMethod.Get, url))
                {
                    request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    var response = await client.SendAsync(request);
                    var responseText = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"Yahoo KeyMetrics Error: {response.StatusCode} - {responseText}");
                        return null;
                    }

                    var json = JObject.Parse(responseText);
                    var result = json["quoteSummary"]?["result"]?[0];

                    if (result == null)
                        return null;

                    var defaultKeyStats = result["defaultKeyStatistics"];
                    var financialData = result["financialData"];
                    var summaryDetail = result["summaryDetail"];

                    return new
                    {
                        ReturnOnEquity = financialData?["returnOnEquity"]?["raw"]?.Value<decimal?>(),
                        ReturnOnAssets = financialData?["returnOnAssets"]?["raw"]?.Value<decimal?>(),
                        OperatingMargins = financialData?["operatingMargins"]?["raw"]?.Value<decimal?>(),
                        ProfitMargins = financialData?["profitMargins"]?["raw"]?.Value<decimal?>(),
                        DebtToEquity = financialData?["debtToEquity"]?["raw"]?.Value<decimal?>(),
                        TotalDebt = financialData?["totalDebt"]?["raw"]?.Value<long?>(),
                        FreeCashFlow = financialData?["freeCashflow"]?["raw"]?.Value<long?>(),
                        OperatingCashFlow = financialData?["operatingCashflow"]?["raw"]?.Value<long?>(),
                        TrailingPE = summaryDetail?["trailingPE"]?["raw"]?.Value<decimal?>(),
                        ForwardPE = defaultKeyStats?["forwardPE"]?["raw"]?.Value<decimal?>(),
                        PriceToBook = defaultKeyStats?["priceToBook"]?["raw"]?.Value<decimal?>(),
                        PegRatio = defaultKeyStats?["pegRatio"]?["raw"]?.Value<decimal?>(),
                        EnterpriseValue = defaultKeyStats?["enterpriseValue"]?["raw"]?.Value<long?>(),
                        MarketCap = summaryDetail?["marketCap"]?["raw"]?.Value<long?>(),
                        revenueGrowth = financialData?["revenueGrowth"]?["raw"]?.Value<decimal?>(),
                        earningsGrowth = financialData?["earningsGrowth"]?["raw"]?.Value<decimal?>(),
                        grossMargins = financialData?["grossMargins"]?["raw"]?.Value<decimal?>(),
                        ebitdaMargins = financialData?["ebitdaMargins"]?["raw"]?.Value<decimal?>(),
                        freeCashflowMargins = financialData?["freeCashflowMargins"]?["raw"]?.Value<decimal?>()
                    };
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Yahoo KeyMetrics Exception: {ex.Message}");
                return null;
            }
        }

        private async Task<dynamic> FetchYahooGrowth(HttpClient client, string symbol)
        {
            var metrics = await FetchYahooKeyMetrics(client, symbol);
            if (metrics == null)
                return null;

            return new
            {
                revenueGrowth = metrics.revenueGrowth,
                earningsGrowth = metrics.earningsGrowth,
                grossMargins = metrics.grossMargins,
                ebitdaMargins = metrics.ebitdaMargins,
                freeCashflowMargins = metrics.freeCashflowMargins
            };
        }

        private async Task<dynamic> FetchYahooIncomeStatement(HttpClient client, string symbol)
        {
            try
            {
                var url = $"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{Uri.EscapeDataString(symbol)}?modules=financialData,defaultKeyStatistics";

                using (var request = new HttpRequestMessage(HttpMethod.Get, url))
                {
                    request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    var response = await client.SendAsync(request);
                    var responseText = await response.Content.ReadAsStringAsync();
                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"Yahoo Income Error: {response.StatusCode} - {responseText}");
                        return null;
                    }

                    var json = JObject.Parse(responseText);
                    var result = json["quoteSummary"]?["result"]?[0];
                    var financialData = result?["financialData"];
                    var defaultKeyStats = result?["defaultKeyStatistics"];

                    return new
                    {
                        revenue = financialData?["totalRevenue"]?["raw"]?.Value<decimal?>(),
                        grossProfit = financialData?["grossProfits"]?["raw"]?.Value<decimal?>(),
                        operatingIncome = financialData?["operatingIncome"]?["raw"]?.Value<decimal?>(),
                        netIncome = financialData?["freeCashflow"]?["raw"]?.Value<decimal?>(),
                        eps = defaultKeyStats?["trailingEps"]?["raw"]?.Value<decimal?>()
                    };
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Yahoo Income Exception: {ex.Message}");
                return null;
            }
        }

        private async Task<dynamic> FetchYahooBalanceSheet(HttpClient client, string symbol)
        {
            try
            {
                var obj = await FetchYahooKeyMetrics(client, symbol);
                if (obj == null)
                    return null;

                return new
                {
                    totalAssets = obj.MarketCap,
                    totalLiabilities = obj.TotalDebt,
                    totalCurrentAssets = obj.MarketCap,
                    totalCurrentLiabilities = obj.TotalDebt,
                    totalStockholdersEquity = obj.MarketCap,
                    commonStock = obj.MarketCap,
                    retainedEarnings = obj.MarketCap
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Yahoo Balance Exception: {ex.Message}");
                return null;
            }
        }

        private async Task<dynamic> FetchYahooCashFlow(HttpClient client, string symbol)
        {
            try
            {
                var obj = await FetchYahooKeyMetrics(client, symbol);
                if (obj == null)
                    return null;

                return new
                {
                    operatingCashFlow = obj.OperatingCashFlow,
                    investingCashFlow = default(long?),
                    financingCashFlow = default(long?),
                    freeCashFlow = obj.FreeCashFlow,
                    capitalExpenditure = obj.FreeCashFlow,
                    depreciationAndAmortization = default(long?)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Yahoo CashFlow Exception: {ex.Message}");
                return null;
            }
        }
    }
}