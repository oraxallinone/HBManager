using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class UploadController : Controller
    {
        private readonly string _uploadPath = "~/Upload";

        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public JsonResult UploadFile()
        {
            try
            {
                if (Request.Files.Count == 0)
                    return Json(new { success = false, message = "No file uploaded" });

                var f = Request.Files[0];
                if (f == null || f.ContentLength == 0)
                    return Json(new { success = false, message = "Empty file" });

                var fileName = Path.GetFileName(f.FileName);
                var safeName = Path.GetFileName(fileName); // basic sanitize
                var saveDir = Server.MapPath(_uploadPath);
                if (!Directory.Exists(saveDir)) Directory.CreateDirectory(saveDir);

                var savePath = Path.Combine(saveDir, safeName);
                f.SaveAs(savePath);

                return Json(new { success = true, name = safeName });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        public JsonResult GetFiles()
        {
            try
            {
                var dir = Server.MapPath(_uploadPath);
                if (!Directory.Exists(dir)) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                var files = Directory.GetFiles(dir)
                    .Select(p => new FileInfo(p))
                    .Select(fi => new
                    {
                        name = fi.Name,
                        size = fi.Length,
                        ext = fi.Extension.ToLower()
                    }).OrderByDescending(f => f.name).ToList();

                return Json(files, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DeleteFile(string name)
        {
            try
            {
                if (string.IsNullOrEmpty(name)) return Json(new { success = false, message = "Invalid name" });

                var path = Path.Combine(Server.MapPath(_uploadPath), Path.GetFileName(name));
                if (System.IO.File.Exists(path))
                {
                    System.IO.File.Delete(path);
                    return Json(new { success = true });
                }
                return Json(new { success = false, message = "File not found" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // Stream file to browser (for download/view)
        public ActionResult GetFile(string name)
        {
            try
            {
                var path = Path.Combine(Server.MapPath(_uploadPath), Path.GetFileName(name));
                if (!System.IO.File.Exists(path)) return HttpNotFound();

                var contentType = MimeMapping.GetMimeMapping(path);
                // return inline when possible so images/pdf/xlsx viewer can open in browser
                return File(path, contentType);
            }
            catch
            {
                return HttpNotFound();
            }
        }
    }
}