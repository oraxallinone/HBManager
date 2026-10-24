using System;
using System.Collections.Generic;

namespace HBManager.Service
{
    public interface INotesService
    {
        List<object> GetNotesForDisplay();
        int AddNote(string noteName, DateTime dateOfNote, int priority);
        bool UpdateNote(int noteId, string noteName, DateTime dateOfNote, int priority);
        bool DeleteNote(int noteId);
        List<object> GetSubNotesForDisplay(int noteId);
        int AddSubNote(int noteId, string subNoteName, DateTime dateOfSubNote);
        bool UpdateSubNote(int subNoteId, string subNoteName, DateTime dateOfSubNote);
        bool DeleteSubNote(int subNoteId);
    }
}
