using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class StockTrackerController : Controller
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"]?.ConnectionString;

        [HttpGet]
        public ActionResult AddToWatchlist()
        {
            return View();
        }

        [HttpGet]
        public ActionResult Watchlist()
        {
            return View();
        }

        #region ================================================================ Stock Purchase Details ===========================================

        [HttpGet]
        public ActionResult PurchaseStockTrackerAdd()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetPurchaseStockDetails()
        {
            var records = new List<object>();

            try
            {
                using (var connection = new SqlConnection(connectionString))
                using (var command = new SqlCommand(@"
                    SELECT slno, StockName, PurchaseDate, PurchasePrice, PurchaseQty, IsSale, nsebse
                    FROM dbo.StocksPurchasedTracker
                    ORDER BY slno DESC", connection))
                {
                    connection.Open();

                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            records.Add(new
                            {
                                slno = Convert.ToInt32(reader["slno"]),
                                stockName = reader["StockName"] == DBNull.Value ? "" : reader["StockName"].ToString(),
                                purchaseDate = reader["PurchaseDate"] == DBNull.Value ? "" : Convert.ToDateTime(reader["PurchaseDate"]).ToString("yyyy-MM-dd"),
                                purchasePrice = reader["PurchasePrice"] == DBNull.Value ? 0m : Convert.ToDecimal(reader["PurchasePrice"]),
                                purchaseQty = reader["PurchaseQty"] == DBNull.Value ? 0m : Convert.ToDecimal(reader["PurchaseQty"]),
                                isSale = reader["IsSale"] != DBNull.Value && Convert.ToBoolean(reader["IsSale"]),
                                nsebse = reader["nsebse"] == DBNull.Value ? "" : reader["nsebse"].ToString()
                            });
                        }
                    }
                }

                return Json(new { success = true, data = records }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult AddPurchaseStockDetail(string stockName, DateTime purchaseDate, decimal purchasePrice, decimal purchaseQty, bool isSale, string nsebse)
        {
            return SavePurchaseStockDetail(null, stockName, purchaseDate, purchasePrice, purchaseQty, isSale, nsebse);
        }

        [HttpPost]
        public JsonResult UpdatePurchaseStockDetail(int slno, string stockName, DateTime purchaseDate, decimal purchasePrice, decimal purchaseQty, bool isSale, string nsebse)
        {
            return SavePurchaseStockDetail(slno, stockName, purchaseDate, purchasePrice, purchaseQty, isSale, nsebse);
        }

        [HttpPost]
        public JsonResult DeletePurchaseStockDetail(int slno)
        {
            try
            {
                using (var connection = new SqlConnection(connectionString))
                using (var command = new SqlCommand("DELETE FROM dbo.StocksPurchasedTracker WHERE slno = @slno", connection))
                {
                    command.Parameters.Add("@slno", SqlDbType.Int).Value = slno;
                    connection.Open();

                    if (command.ExecuteNonQuery() == 0)
                    {
                        return Json(new { success = false, message = "Purchase record was not found." });
                    }
                }

                return Json(new { success = true, message = "Purchase record deleted successfully." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        private JsonResult SavePurchaseStockDetail(int? slno, string stockName, DateTime purchaseDate, decimal purchasePrice, decimal purchaseQty, bool isSale, string nsebse)
        {
            if (string.IsNullOrWhiteSpace(stockName))
            {
                return Json(new { success = false, message = "Stock name is required." });
            }

            try
            {
                using (var connection = new SqlConnection(connectionString))
                using (var command = new SqlCommand(connection.ToString()))
                {
                    command.Connection = connection;
                    command.Parameters.Add("@StockName", SqlDbType.VarChar, 100).Value = stockName.Trim().ToUpperInvariant();
                    command.Parameters.Add("@PurchaseDate", SqlDbType.Date).Value = purchaseDate.Date;
                    command.Parameters.Add("@PurchasePrice", SqlDbType.Decimal).Value = purchasePrice;
                    command.Parameters.Add("@PurchaseQty", SqlDbType.Decimal).Value = purchaseQty;
                    command.Parameters.Add("@IsSale", SqlDbType.Bit).Value = isSale;
                    command.Parameters.Add("@nsebse", SqlDbType.VarChar, 10).Value = (nsebse ?? "").Trim().ToLowerInvariant();

                    if (slno.HasValue)
                    {
                        command.CommandText = @"
                            UPDATE dbo.StocksPurchasedTracker
                            SET StockName = @StockName, PurchaseDate = @PurchaseDate,
                                PurchasePrice = @PurchasePrice, PurchaseQty = @PurchaseQty,
                                IsSale = @IsSale, nsebse = @nsebse
                            WHERE slno = @slno";
                        command.Parameters.Add("@slno", SqlDbType.Int).Value = slno.Value;
                    }
                    else
                    {
                        command.CommandText = @"
                            INSERT INTO dbo.StocksPurchasedTracker
                                (StockName, PurchaseDate, PurchasePrice, PurchaseQty, IsSale, nsebse)
                            VALUES (@StockName, @PurchaseDate, @PurchasePrice, @PurchaseQty, @IsSale, @nsebse)";
                    }

                    connection.Open();
                    command.ExecuteNonQuery();
                }

                return Json(new { success = true, message = slno.HasValue ? "Purchase record updated successfully." : "Purchase record added successfully." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        #endregion

        [HttpGet]
        public async Task<JsonResult> GetStockDetails(string stockName, string stockExchange)
        {
            if (string.IsNullOrWhiteSpace(stockName))
            {
                return Json(new
                {
                    success = false,
                    message = "Stock name is required."
                }, JsonRequestBehavior.AllowGet);
            }

            var stock = new ActiveStockPrice
            {
                StockName = stockName.Trim().ToUpperInvariant(),
                StockExchange = string.IsNullOrWhiteSpace(stockExchange)
                    ? "NSE"
                    : stockExchange.Trim().ToUpperInvariant()
            };

            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(20);
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");
                    client.DefaultRequestHeaders.Accept.Add(
                        new MediaTypeWithQualityHeaderValue("application/json"));

                    stock.YahooSymbol = NormalizeYahooSymbol(stock.StockName, stock.StockExchange);
                    stock.CompanyName = stock.StockName;
                    await ApplyYahooDailyCloseAsync(client, stock);
                }

                return Json(new
                {
                    success = true,
                    data = stock
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public async Task<JsonResult> GetStockCandles(string stockName, string stockExchange, string range)
        {
            if (string.IsNullOrWhiteSpace(stockName))
            {
                return Json(new { success = false, message = "Stock name is required." }, JsonRequestBehavior.AllowGet);
            }

            var allowedRanges = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "1d", "5d", "1mo", "1y", "max"
            };
            var selectedRange = allowedRanges.Contains(range ?? string.Empty) ? range : "1d";
            var symbol = NormalizeYahooSymbol(stockName, stockExchange);

            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(30);
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");
                    client.DefaultRequestHeaders.Accept.Add(
                        new MediaTypeWithQualityHeaderValue("application/json"));

                    var url = "https://query1.finance.yahoo.com/v8/finance/chart/" +
                              Uri.EscapeDataString(symbol) +
                              "?range=" + selectedRange + "&interval=1d&events=history";

                    using (var response = await client.GetAsync(url))
                    {
                        var responseText = await response.Content.ReadAsStringAsync();
                        if (!response.IsSuccessStatusCode)
                        {
                            return Json(new { success = false, message = "Yahoo request failed." }, JsonRequestBehavior.AllowGet);
                        }

                        var root = JObject.Parse(responseText);
                        var result = root["chart"]?["result"]?[0];
                        var points = BuildCandlePoints(result);

                        return Json(new
                        {
                            success = true,
                            symbol = symbol,
                            range = selectedRange,
                            data = points
                        }, JsonRequestBehavior.AllowGet);
                    }
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public async Task<JsonResult> GetActiveStockPrices()
        {
            try
            {
                var stocks = new List<ActiveStockPrice>();

                using (var connection = new SqlConnection(connectionString))
                using (var command = new SqlCommand(@"
                    SELECT id, stockName, stockExchange, priority
                    FROM tblStockAnalysis
                    WHERE isActive = 1
                    ORDER BY priority ASC, stockName ASC", connection))
                {
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            stocks.Add(new ActiveStockPrice
                            {
                                Id = Convert.ToInt32(reader["id"]),
                                StockName = reader["stockName"].ToString(),
                                StockExchange = reader["stockExchange"].ToString(),
                                Priority = Convert.ToInt32(reader["priority"])
                            });
                        }
                    }
                }

                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(20);
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");
                    client.DefaultRequestHeaders.Accept.Add(
                        new MediaTypeWithQualityHeaderValue("application/json"));

                    foreach (var stock in stocks)
                    {
                        stock.YahooSymbol = NormalizeYahooSymbol(stock.StockName, stock.StockExchange);
                        stock.CompanyName = stock.StockName;
                        await ApplyYahooDailyCloseAsync(client, stock);
                    }
                }

                return Json(new
                {
                    success = true,
                    data = stocks
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                }, JsonRequestBehavior.AllowGet);
            }
        }

        private static async Task ApplyYahooDailyCloseAsync( HttpClient client, ActiveStockPrice stock)
        {
            var yahooSymbol = NormalizeYahooSymbol(stock.StockName, stock.StockExchange);
            var url = "https://query1.finance.yahoo.com/v8/finance/chart/" +
                      Uri.EscapeDataString(yahooSymbol) +
                      "?range=5d&interval=1d&events=history";

            try
            {
                using (var response = await client.GetAsync(url))
                {
                    var responseText = await response.Content.ReadAsStringAsync();
                    if (!response.IsSuccessStatusCode)
                    {
                        stock.Status = "Yahoo request failed";
                        return;
                    }

                    var root = JObject.Parse(responseText);
                    var result = root["chart"]?["result"]?[0];
                    var meta = result?["meta"];
                    stock.CompanyName = meta?["longName"]?.ToString()
                        ?? meta?["shortName"]?.ToString()
                        ?? stock.StockName;
                    stock.Currency = meta?["currency"]?.ToString();
                    stock.ExchangeName = meta?["exchangeName"]?.ToString();
                    stock.FullExchangeName = meta?["fullExchangeName"]?.ToString();
                    stock.InstrumentType = meta?["instrumentType"]?.ToString();
                    stock.FirstTradeDate = FormatUnixTime(meta?["firstTradeDate"]?.Value<long?>(), stock.Timezone);
                    stock.Timezone = meta?["exchangeTimezoneName"]?.ToString()
                        ?? meta?["timezone"]?.ToString();
                    stock.RegularMarketPrice = meta?["regularMarketPrice"]?.Value<decimal?>();
                    stock.RegularMarketTime = FormatUnixTime(meta?["regularMarketTime"]?.Value<long?>(), stock.Timezone);
                    stock.ChartPreviousClose = meta?["chartPreviousClose"]?.Value<decimal?>();
                    stock.PreviousClose = meta?["previousClose"]?.Value<decimal?>()
                        ?? stock.ChartPreviousClose;
                    stock.FiftyTwoWeekHigh = meta?["fiftyTwoWeekHigh"]?.Value<decimal?>();
                    stock.FiftyTwoWeekLow = meta?["fiftyTwoWeekLow"]?.Value<decimal?>();
                    stock.DayHigh = meta?["regularMarketDayHigh"]?.Value<decimal?>();
                    stock.DayLow = meta?["regularMarketDayLow"]?.Value<decimal?>();
                    stock.MarketVolume = meta?["regularMarketVolume"]?.Value<long?>();
                    stock.Actions = BuildCorporateActions(result);

                    var quote = result?["indicators"]?["quote"]?[0];
                    var closes = quote?["close"] as JArray;

                    if (closes == null)
                    {
                        stock.Status = "No close price";
                        return;
                    }

                    var latestIndex = FindLastValueIndex(closes);
                    if (latestIndex >= 0)
                    {
                        stock.TodayClose = closes[latestIndex]?.Value<decimal?>();
                        stock.LatestCandle = BuildLatestCandle(result, latestIndex);
                        stock.RegularMarketPrice = stock.RegularMarketPrice ?? stock.TodayClose;
                        stock.DayHigh = stock.DayHigh ?? stock.LatestCandle.High;
                        stock.DayLow = stock.DayLow ?? stock.LatestCandle.Low;
                        stock.MarketVolume = stock.MarketVolume ?? stock.LatestCandle.Volume;
                        stock.Status = "OK";
                        return;
                    }

                    stock.Status = "No close price";
                }
            }
            catch (Exception ex)
            {
                stock.Status = "Error: " + ex.Message;
            }
        }

        private sealed class ActiveStockPrice
        {
            public int Id { get; set; }
            public string StockName { get; set; }
            public string StockExchange { get; set; }
            public string YahooSymbol { get; set; }
            public string CompanyName { get; set; }
            public string Currency { get; set; }
            public string ExchangeName { get; set; }
            public string FullExchangeName { get; set; }
            public string InstrumentType { get; set; }
            public string FirstTradeDate { get; set; }
            public string Timezone { get; set; }
            public string RegularMarketTime { get; set; }
            public decimal? RegularMarketPrice { get; set; }
            public decimal? ChartPreviousClose { get; set; }
            public decimal? PreviousClose { get; set; }
            public decimal? FiftyTwoWeekHigh { get; set; }
            public decimal? FiftyTwoWeekLow { get; set; }
            public decimal? DayHigh { get; set; }
            public decimal? DayLow { get; set; }
            public long? MarketVolume { get; set; }
            public int Priority { get; set; }
            public decimal? TodayClose { get; set; }
            public LatestCandle LatestCandle { get; set; }
            public List<CorporateAction> Actions { get; set; } = new List<CorporateAction>();
            public string Status { get; set; } = "Loading";
        }

        private static int FindLastValueIndex(JArray values)
        {
            if (values == null)
            {
                return -1;
            }

            for (var index = values.Count - 1; index >= 0; index--)
            {
                if (values[index] != null && values[index].Type != JTokenType.Null)
                {
                    return index;
                }
            }

            return -1;
        }

        private sealed class LatestCandle
        {
            public string Date { get; set; }
            public decimal? Open { get; set; }
            public decimal? High { get; set; }
            public decimal? Low { get; set; }
            public decimal? Close { get; set; }
            public decimal? AdjustedClose { get; set; }
            public long? Volume { get; set; }
        }

        private sealed class CorporateAction
        {
            public string Type { get; set; }
            public string Date { get; set; }
            public decimal? Amount { get; set; }
        }

        private sealed class CandlePoint
        {
            public string Date { get; set; }
            public decimal Open { get; set; }
            public decimal High { get; set; }
            public decimal Low { get; set; }
            public decimal Close { get; set; }
            public decimal ChangeAmount { get; set; }
            public decimal ChangePercent { get; set; }
        }

        private static List<CandlePoint> BuildCandlePoints(JToken result)
        {
            var points = new List<CandlePoint>();
            var timestamps = result?["timestamp"] as JArray;
            var quote = result?["indicators"]?["quote"]?[0];
            var opens = quote?["open"] as JArray;
            var highs = quote?["high"] as JArray;
            var lows = quote?["low"] as JArray;
            var closes = quote?["close"] as JArray;

            if (timestamps == null || opens == null || highs == null || lows == null || closes == null)
            {
                return points;
            }

            decimal? previousClose = null;
            var count = Math.Min(timestamps.Count, closes.Count);

            for (var index = 0; index < count; index++)
            {
                var open = opens[index]?.Value<decimal?>();
                var high = highs[index]?.Value<decimal?>();
                var low = lows[index]?.Value<decimal?>();
                var close = closes[index]?.Value<decimal?>();
                var timestamp = timestamps[index]?.Value<long?>();
                if (!open.HasValue || !high.HasValue || !low.HasValue || !close.HasValue || !timestamp.HasValue)
                {
                    continue;
                }

                var changeAmount = previousClose.HasValue ? close.Value - previousClose.Value : 0m;
                var changePercent = previousClose.HasValue && previousClose.Value != 0m
                    ? (changeAmount / previousClose.Value) * 100m
                    : 0m;

                points.Add(new CandlePoint
                {
                    Date = DateTimeOffset.FromUnixTimeSeconds(timestamp.Value)
                        .ToString("yyyy-MM-dd"),
                    Open = open.Value,
                    High = high.Value,
                    Low = low.Value,
                    Close = close.Value,
                    ChangeAmount = changeAmount,
                    ChangePercent = changePercent
                });

                previousClose = close.Value;
            }

            return points;
        }

        private static LatestCandle BuildLatestCandle(JToken result, int index)
        {
            var quote = result?["indicators"]?["quote"]?[0];
            var adjusted = result?["indicators"]?["adjclose"]?[0]?["adjclose"] as JArray;
            var timestamps = result?["timestamp"] as JArray;
            var timestamp = timestamps != null && index < timestamps.Count
                ? timestamps[index]?.Value<long?>()
                : null;

            return new LatestCandle
            {
                Date = FormatUnixTime(timestamp, null),
                Open = GetDecimal(quote?["open"] as JArray, index),
                High = GetDecimal(quote?["high"] as JArray, index),
                Low = GetDecimal(quote?["low"] as JArray, index),
                Close = GetDecimal(quote?["close"] as JArray, index),
                AdjustedClose = GetDecimal(adjusted, index),
                Volume = GetLong(quote?["volume"] as JArray, index)
            };
        }

        private static List<CorporateAction> BuildCorporateActions(JToken result)
        {
            var actions = new List<CorporateAction>();
            AddActionValues(actions, result?["events"]?["dividends"], "Dividend");
            AddActionValues(actions, result?["events"]?["splits"], "Split");
            return actions;
        }

        private static void AddActionValues(List<CorporateAction> actions, JToken values, string type)
        {
            if (values == null || values.Type != JTokenType.Object)
            {
                return;
            }

            foreach (var property in ((JObject)values).Properties())
            {
                var action = property.Value;
                actions.Add(new CorporateAction
                {
                    Type = type,
                    Date = FormatUnixTime(action?["date"]?.Value<long?>() ?? ParseLong(property.Name), null),
                    Amount = action?["amount"]?.Value<decimal?>()
                });
            }
        }

        private static decimal? GetDecimal(JArray values, int index)
        {
            return values != null && index >= 0 && index < values.Count
                ? values[index]?.Value<decimal?>()
                : null;
        }

        private static long? GetLong(JArray values, int index)
        {
            return values != null && index >= 0 && index < values.Count
                ? values[index]?.Value<long?>()
                : null;
        }

        private static long ParseLong(string value)
        {
            long parsed;
            return long.TryParse(value, out parsed) ? parsed : 0L;
        }

        private static string FormatUnixTime(long? timestamp, string timezone)
        {
            if (!timestamp.HasValue)
            {
                return null;
            }

            return DateTimeOffset.FromUnixTimeSeconds(timestamp.Value)
                .ToString("yyyy-MM-dd HH:mm:ss zzz");
        }

        private static string NormalizeYahooSymbol(string stockName, string stockExchange)
        {
            var symbol = (stockName ?? string.Empty).Trim().ToUpperInvariant();
            if (symbol.Contains("."))
            {
                return symbol;
            }

            return symbol + (string.Equals(stockExchange, "BSE", StringComparison.OrdinalIgnoreCase)
                ? ".BO"
                : ".NS");
        }

        [HttpGet]
        public JsonResult GetAllStocks()
        {
            try
            {
                var stocks = new List<object>();

                using (var connection = new SqlConnection(connectionString))
                using (var command = new SqlCommand(@"
                    SELECT id, stockName, stockExchange, isActive, addedDate, priority
                    FROM tblStockAnalysis
                    ORDER BY priority ASC, addedDate DESC", connection))
                {
                    connection.Open();

                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            stocks.Add(new
                            {
                                id = Convert.ToInt32(reader["id"]),
                                stockName = reader["stockName"].ToString(),
                                stockExchange = reader["stockExchange"].ToString(),
                                isActive = Convert.ToBoolean(reader["isActive"]),
                                addedDate = Convert.ToDateTime(reader["addedDate"])
                                    .ToString("yyyy-MM-dd HH:mm"),
                                priority = Convert.ToInt32(reader["priority"])
                            });
                        }
                    }
                }

                return Json(new
                {
                    success = true,
                    data = stocks
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult AddStock(
            string stockName,
            string stockExchange,
            int priority)
        {
            try
            {
                stockName = (stockName ?? string.Empty).Trim().ToUpperInvariant();
                stockExchange = (stockExchange ?? string.Empty).Trim().ToUpperInvariant();

                if (string.IsNullOrWhiteSpace(stockName))
                {
                    return Json(new
                    {
                        success = false,
                        message = "Stock name is required."
                    });
                }

                if (stockExchange != "NSE" && stockExchange != "BSE")
                {
                    return Json(new
                    {
                        success = false,
                        message = "Please select NSE or BSE."
                    });
                }

                if (priority < 1 || priority > 10)
                {
                    priority = 5;
                }

                using (var connection = new SqlConnection(connectionString))
                {
                    connection.Open();

                    using (var duplicateCommand = new SqlCommand(@"
                        SELECT COUNT(1)
                        FROM tblStockAnalysis
                        WHERE UPPER(stockName) = @stockName
                          AND UPPER(stockExchange) = @stockExchange", connection))
                    {
                        duplicateCommand.Parameters.Add("@stockName", SqlDbType.VarChar, 100)
                            .Value = stockName;
                        duplicateCommand.Parameters.Add("@stockExchange", SqlDbType.VarChar, 50)
                            .Value = stockExchange;

                        if (Convert.ToInt32(duplicateCommand.ExecuteScalar()) > 0)
                        {
                            return Json(new
                            {
                                success = false,
                                isDuplicate = true,
                                message = "This stock already exists for the selected exchange."
                            });
                        }
                    }

                    using (var insertCommand = new SqlCommand(@"
                        INSERT INTO tblStockAnalysis
                            (stockName, stockExchange, isActive, priority)
                        VALUES
                            (@stockName, @stockExchange, 1, @priority)", connection))
                    {
                        insertCommand.Parameters.Add("@stockName", SqlDbType.VarChar, 100)
                            .Value = stockName;
                        insertCommand.Parameters.Add("@stockExchange", SqlDbType.VarChar, 50)
                            .Value = stockExchange;
                        insertCommand.Parameters.Add("@priority", SqlDbType.Int)
                            .Value = priority;

                        insertCommand.ExecuteNonQuery();
                    }
                }

                return Json(new
                {
                    success = true,
                    message = "Stock added successfully."
                });
            }
            catch (SqlException ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Number == 2601 || ex.Number == 2627
                        ? "This stock already exists for the selected exchange."
                        : ex.Message
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public JsonResult UpdateStock(
            int id,
            string stockName,
            string stockExchange,
            int priority,
            bool isActive)
        {
            try
            {
                stockName = (stockName ?? string.Empty).Trim().ToUpperInvariant();
                stockExchange = (stockExchange ?? string.Empty).Trim().ToUpperInvariant();

                if (string.IsNullOrWhiteSpace(stockName))
                {
                    return Json(new
                    {
                        success = false,
                        message = "Stock name is required."
                    });
                }

                using (var connection = new SqlConnection(connectionString))
                {
                    connection.Open();

                    using (var duplicateCommand = new SqlCommand(@"
                        SELECT COUNT(1)
                        FROM tblStockAnalysis
                        WHERE id <> @id
                          AND UPPER(stockName) = @stockName
                          AND UPPER(stockExchange) = @stockExchange", connection))
                    {
                        duplicateCommand.Parameters.Add("@id", SqlDbType.Int).Value = id;
                        duplicateCommand.Parameters.Add("@stockName", SqlDbType.VarChar, 100)
                            .Value = stockName;
                        duplicateCommand.Parameters.Add("@stockExchange", SqlDbType.VarChar, 50)
                            .Value = stockExchange;

                        if (Convert.ToInt32(duplicateCommand.ExecuteScalar()) > 0)
                        {
                            return Json(new
                            {
                                success = false,
                                isDuplicate = true,
                                message = "This stock already exists for the selected exchange."
                            });
                        }
                    }

                    using (var updateCommand = new SqlCommand(@"
                        UPDATE tblStockAnalysis
                        SET stockName = @stockName,
                            stockExchange = @stockExchange,
                            priority = @priority,
                            isActive = @isActive
                        WHERE id = @id", connection))
                    {
                        updateCommand.Parameters.Add("@id", SqlDbType.Int).Value = id;
                        updateCommand.Parameters.Add("@stockName", SqlDbType.VarChar, 100)
                            .Value = stockName;
                        updateCommand.Parameters.Add("@stockExchange", SqlDbType.VarChar, 50)
                            .Value = stockExchange;
                        updateCommand.Parameters.Add("@priority", SqlDbType.Int)
                            .Value = priority;
                        updateCommand.Parameters.Add("@isActive", SqlDbType.Bit)
                            .Value = isActive;

                        updateCommand.ExecuteNonQuery();
                    }
                }

                return Json(new
                {
                    success = true,
                    message = "Stock updated successfully."
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public JsonResult DeleteStock(int id)
        {
            try
            {
                using (var connection = new SqlConnection(connectionString))
                using (var command = new SqlCommand(
                    "DELETE FROM tblStockAnalysis WHERE id = @id",
                    connection))
                {
                    command.Parameters.Add("@id", SqlDbType.Int).Value = id;

                    connection.Open();

                    if (command.ExecuteNonQuery() == 0)
                    {
                        return Json(new
                        {
                            success = false,
                            message = "Stock record was not found."
                        });
                    }
                }

                return Json(new
                {
                    success = true,
                    message = "Stock deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}