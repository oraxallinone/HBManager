using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace HBManager.Service
{
    public class UploadService : IUploadService
    {
        public string SaveFile(HttpPostedFileBase file, string uploadDirectory)
        {
            var safeName = Path.GetFileName(Path.GetFileName(file.FileName));
            if (!Directory.Exists(uploadDirectory))
                Directory.CreateDirectory(uploadDirectory);
            file.SaveAs(Path.Combine(uploadDirectory, safeName));
            return safeName;
        }

        public List<UploadedFileInfo> GetFiles(string uploadDirectory)
        {
            if (!Directory.Exists(uploadDirectory))
                return new List<UploadedFileInfo>();

            return Directory.GetFiles(uploadDirectory)
                .Select(path => new FileInfo(path))
                .Select(file => new UploadedFileInfo
                {
                    name = file.Name,
                    size = file.Length,
                    ext = file.Extension.ToLower()
                })
                .OrderByDescending(file => file.name)
                .ToList();
        }

        public bool DeleteFile(string name, string uploadDirectory)
        {
            var path = Path.Combine(uploadDirectory, Path.GetFileName(name));
            if (!File.Exists(path))
                return false;

            File.Delete(path);
            return true;
        }

        public string GetFilePath(string name, string uploadDirectory)
        {
            var path = Path.Combine(uploadDirectory, Path.GetFileName(name));
            if (!File.Exists(path))
                throw new FileNotFoundException("File not found.", path);
            return path;
        }
    }
}
