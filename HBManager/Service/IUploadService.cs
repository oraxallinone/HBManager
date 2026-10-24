using System.Collections.Generic;
using System.Web;

namespace HBManager.Service
{
    public interface IUploadService
    {
        string SaveFile(HttpPostedFileBase file, string uploadDirectory);
        List<UploadedFileInfo> GetFiles(string uploadDirectory);
        bool DeleteFile(string name, string uploadDirectory);
        string GetFilePath(string name, string uploadDirectory);
    }

    public class UploadedFileInfo
    {
        public string name { get; set; }
        public long size { get; set; }
        public string ext { get; set; }
    }
}
