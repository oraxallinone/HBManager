using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    [HBManager.Filters.ValidateAntiForgeryTokenHeader]
    public class UploadController : Controller
    {
        private readonly IUploadService _uploadService;
        private const string UploadPath = "~/Upload";

        public UploadController(IUploadService uploadService)
        {
            _uploadService = uploadService ?? throw new ArgumentNullException(nameof(uploadService));
        }

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

                var file = Request.Files[0];
                if (file == null || file.ContentLength == 0)
                    return Json(new { success = false, message = "Empty file" });

                var name = _uploadService.SaveFile(file, Server.MapPath(UploadPath));
                return Json(new { success = true, name });
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
                return Json(_uploadService.GetFiles(Server.MapPath(UploadPath)), JsonRequestBehavior.AllowGet);
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
                if (string.IsNullOrEmpty(name))
                    return Json(new { success = false, message = "Invalid name" });
                if (_uploadService.DeleteFile(name, Server.MapPath(UploadPath)))
                    return Json(new { success = true });
                return Json(new { success = false, message = "File not found" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        public ActionResult GetFile(string name)
        {
            try
            {
                var path = _uploadService.GetFilePath(name, Server.MapPath(UploadPath));
                return File(path, MimeMapping.GetMimeMapping(path));
            }
            catch
            {
                return HttpNotFound();
            }
        }
    }
}
