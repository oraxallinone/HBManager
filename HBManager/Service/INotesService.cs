using System;
using System.Collections.Generic;

namespace HBManager.Service
{
    public interface INotesService
    {
        List<object> GetNotesForDisplay();
        int AddNote(string noteName, string description, DateTime dateOfNote, int priority);
        bool UpdateNote(int noteId, string noteName, string description, DateTime dateOfNote, int priority);
        bool UpdateNoteCompletion(int noteId, bool isCompleted);
        bool DeleteNote(int noteId);
        List<object> GetSubNotesForDisplay(int noteId);
        int AddSubNote(int noteId, string subNoteName, DateTime dateOfSubNote);
        bool UpdateSubNote(int subNoteId, string subNoteName, DateTime dateOfSubNote);
        bool UpdateSubNoteCompletion(int subNoteId, bool isCompleted);
        bool DeleteSubNote(int subNoteId);
    }
}
