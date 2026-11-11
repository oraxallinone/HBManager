using HBManager.Service;
using System;
using System.Globalization;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class NotesController : Controller
    {
        private readonly INotesService _notesService;

        public NotesController(INotesService notesService)
        {
            _notesService = notesService ?? throw new ArgumentNullException(nameof(notesService));
        }

        // GET: Notes
        public ActionResult NoteIndex()
        {
            return View();
        }

        // AJAX: Get all notes
        [HttpGet]
        public JsonResult GetNotes()
        {
            try
            {
                var notes = _notesService.GetNotesForDisplay();

                return Json(new { success = true, data = notes }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        // AJAX: Add new note
        [HttpPost]
        public JsonResult AddNote(string noteName, string noteDescription, string dateOfNote, int notePriority)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noteName))
                    return Json(new { success = false, message = "Note name is required" });

                DateTime noteDate;
                if (!DateTime.TryParseExact(dateOfNote, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out noteDate))
                    return Json(new { success = false, message = "A valid note date is required" });

                int noteId = _notesService.AddNote(noteName.Trim(), noteDescription, noteDate, notePriority);

                return Json(new { success = true, noteId = noteId, message = "Note added successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // AJAX: Update note
        [HttpPost]
        public JsonResult UpdateNote(int noteId, string noteName, string noteDescription, string dateOfNote, int notePriority)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noteName))
                    return Json(new { success = false, message = "Note name is required" });

                DateTime noteDate;
                if (!DateTime.TryParseExact(dateOfNote, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out noteDate))
                    return Json(new { success = false, message = "A valid note date is required" });

                bool result = _notesService.UpdateNote(noteId, noteName.Trim(), noteDescription, noteDate, notePriority);

                if (result)
                    return Json(new { success = true, message = "Note updated successfully" });
                else
                    return Json(new { success = false, message = "Failed to update note" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult UpdateNoteCompletion(int noteId, bool isCompleted)
        {
            try
            {
                bool result = _notesService.UpdateNoteCompletion(noteId, isCompleted);
                return Json(new { success = result, message = result ? "Task status updated" : "Task not found" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // AJAX: Delete note
        [HttpPost]
        public JsonResult DeleteNote(int noteId)
        {
            try
            {
                bool result = _notesService.DeleteNote(noteId);

                if (result)
                    return Json(new { success = true, message = "Note deleted successfully" });
                else
                    return Json(new { success = false, message = "Failed to delete note" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // AJAX: Get subnotes by note id
        [HttpGet]
        public JsonResult GetSubNotes(int noteId)
        {
            try
            {
                var subNotes = _notesService.GetSubNotesForDisplay(noteId);

                return Json(new { success = true, data = subNotes }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        // AJAX: Add new subnote
        [HttpPost]
        public JsonResult AddSubNote(int noteId, string subNoteName, string dateOfSubNote)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(subNoteName))
                    return Json(new { success = false, message = "SubNote name is required" });

                DateTime subNoteDate;
                if (!DateTime.TryParseExact(dateOfSubNote, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out subNoteDate))
                    return Json(new { success = false, message = "A valid subnote date is required" });

                int subNoteId = _notesService.AddSubNote(noteId, subNoteName.Trim(), subNoteDate);

                return Json(new { success = true, subNoteId = subNoteId, message = "SubNote added successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // AJAX: Update subnote
        [HttpPost]
        public JsonResult UpdateSubNote(int subNoteId, string subNoteName, string dateOfSubNote)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(subNoteName))
                    return Json(new { success = false, message = "SubNote name is required" });

                DateTime subNoteDate;
                if (!DateTime.TryParseExact(dateOfSubNote, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out subNoteDate))
                    return Json(new { success = false, message = "A valid subnote date is required" });

                bool result = _notesService.UpdateSubNote(subNoteId, subNoteName.Trim(), subNoteDate);
                return Json(new { success = result, message = result ? "SubNote updated successfully" : "Subnote not found" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult UpdateSubNoteCompletion(int subNoteId, bool isCompleted)
        {
            try
            {
                bool result = _notesService.UpdateSubNoteCompletion(subNoteId, isCompleted);
                return Json(new { success = result, message = result ? "Subtask status updated" : "Subtask not found" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // AJAX: Delete subnote
        [HttpPost]
        public JsonResult DeleteSubNote(int subNoteId)
        {
            try
            {
                bool result = _notesService.DeleteSubNote(subNoteId);

                if (result)
                    return Json(new { success = true, message = "SubNote deleted successfully" });
                else
                    return Json(new { success = false, message = "Failed to delete subnote" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}