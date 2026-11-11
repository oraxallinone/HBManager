using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.Globalization;
using System.Linq;
using System.Web;

namespace HBManager.Service
{
    public class NotesService : INotesService
    {
        private string _connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;

        // Get all notes
        public DataTable GetNotes()
        {
            DataTable dt = new DataTable();
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("sp_getNotes", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        SqlDataAdapter adapter = new SqlDataAdapter(cmd);
                        adapter.Fill(dt);
                    }

                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching notes: " + ex.Message);
            }
            return dt;
        }

        public List<object> GetNotesForDisplay()
        {
            return GetNotes().AsEnumerable().Select(row => (object)new
            {
                noteId = row["NoteId"],
                noteName = row["NoteName"],
                noteDescription = row["NoteDescription"] == DBNull.Value ? string.Empty : row["NoteDescription"],
                dateOfNote = row["DateOfNote"] == DBNull.Value ? string.Empty : ((DateTime)row["DateOfNote"]).ToString("dd-MMM-yyyy", CultureInfo.InvariantCulture),
                notePriority = row["NotePriority"] == DBNull.Value ? (int?)null : Convert.ToInt32(row["NotePriority"]),
                isCompleted = row["IsCompleted"] != DBNull.Value && Convert.ToBoolean(row["IsCompleted"]),
                subNoteCount = Convert.ToInt32(row["SubNoteCount"]),
                completedSubNoteCount = Convert.ToInt32(row["CompletedSubNoteCount"]),
                subNoteNames = row["SubNoteNames"] == DBNull.Value ? string.Empty : row["SubNoteNames"].ToString()
            }).ToList();
        }

        // Add new note
        public int AddNote(string noteName, string description, DateTime dateOfNote, int priority)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("sp_addNote", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@NoteName", noteName);
                        cmd.Parameters.AddWithValue("@NoteDescription", (object)description ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@DateOfNote", dateOfNote);
                        cmd.Parameters.AddWithValue("@NotePriority", priority);

                        conn.Open();
                        object result = cmd.ExecuteScalar();

                        if (result != null && result != DBNull.Value)
                        {
                            int noteId = Convert.ToInt32(result);
                            return noteId;
                        }
                        else
                        {
                            throw new Exception("Failed to insert note. Procedure returned null.");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error adding note: " + ex.Message);
            }
        }

        // Update note
        public bool UpdateNote(int noteId, string noteName, string description, DateTime dateOfNote, int priority)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("sp_updateNote", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@NoteId", noteId);
                        cmd.Parameters.AddWithValue("@NoteName", noteName);
                        cmd.Parameters.AddWithValue("@NoteDescription", (object)description ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@DateOfNote", dateOfNote);
                        cmd.Parameters.AddWithValue("@NotePriority", priority);

                        conn.Open();
                        object result = cmd.ExecuteScalar();
                        return result != null && result != DBNull.Value && Convert.ToInt32(result) > 0;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error updating note: " + ex.Message);
            }
        }

        public bool UpdateNoteCompletion(int noteId, bool isCompleted)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                using (SqlCommand cmd = new SqlCommand("sp_updateNoteCompletion", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@NoteId", noteId);
                    cmd.Parameters.AddWithValue("@IsCompleted", isCompleted);
                    conn.Open();
                    object result = cmd.ExecuteScalar();
                    return result != null && result != DBNull.Value && Convert.ToInt32(result) > 0;
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error updating task status: " + ex.Message);
            }
        }

        // Delete note (and its subnotes)
        public bool DeleteNote(int noteId)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("sp_deleteNote", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@NoteId", noteId);

                        conn.Open();
                        int result = cmd.ExecuteNonQuery();
                        return result > 0;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error deleting note: " + ex.Message);
            }
        }

        // Get subnotes by note id
        public DataTable GetSubNotes(int noteId)
        {
            DataTable dt = new DataTable();
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("sp_getSubNotes", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@NoteId", noteId);
                        SqlDataAdapter adapter = new SqlDataAdapter(cmd);
                        adapter.Fill(dt);
                    }

                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching subnotes: " + ex.Message);
            }
            return dt;
        }

        public List<object> GetSubNotesForDisplay(int noteId)
        {
            return GetSubNotes(noteId).AsEnumerable().Select(row => (object)new
            {
                subNoteId = row["SubNoteId"],
                noteId = row["NoteId"],
                subNoteName = row["SubNoteName"],
                dateOfSubNote = row["DateOfSubNote"] == DBNull.Value ? string.Empty : ((DateTime)row["DateOfSubNote"]).ToString("dd-MMM-yyyy", CultureInfo.InvariantCulture),
                isCompleted = row["IsCompleted"] != DBNull.Value && Convert.ToBoolean(row["IsCompleted"])
            }).ToList();
        }

        public bool UpdateSubNoteCompletion(int subNoteId, bool isCompleted)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                using (SqlCommand cmd = new SqlCommand("sp_updateSubNoteCompletion", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@SubNoteId", subNoteId);
                    cmd.Parameters.AddWithValue("@IsCompleted", isCompleted);
                    conn.Open();
                    object result = cmd.ExecuteScalar();
                    return result != null && result != DBNull.Value && Convert.ToInt32(result) > 0;
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error updating subtask status: " + ex.Message);
            }
        }

        // Add new subnote
        public int AddSubNote(int noteId, string subNoteName, DateTime dateOfSubNote)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("sp_addSubNote", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@NoteId", noteId);
                        cmd.Parameters.AddWithValue("@SubNoteName", subNoteName);
                        cmd.Parameters.AddWithValue("@DateOfSubNote", dateOfSubNote);

                        conn.Open();
                        int subNoteId = (int)cmd.ExecuteScalar();
                        return subNoteId;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error adding subnote: " + ex.Message);
            }
        }

        // Update subnote
        public bool UpdateSubNote(int subNoteId, string subNoteName, DateTime dateOfSubNote)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("sp_updateSubNote", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@SubNoteId", subNoteId);
                        cmd.Parameters.AddWithValue("@SubNoteName", subNoteName);
                        cmd.Parameters.AddWithValue("@DateOfSubNote", dateOfSubNote);

                        conn.Open();
                        object result = cmd.ExecuteScalar();
                        return result != null && result != DBNull.Value && Convert.ToInt32(result) > 0;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error updating subnote: " + ex.Message);
            }
        }

        // Delete subnote
        public bool DeleteSubNote(int subNoteId)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand("sp_deleteSubNote", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@SubNoteId", subNoteId);

                        conn.Open();
                        int result = cmd.ExecuteNonQuery();
                        return result > 0;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error deleting subnote: " + ex.Message);
            }
        }
    }
}