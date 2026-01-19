$(function () {
    var currentNoteId = 0;
    var currentNoteData = {};
    var editingNoteId = null;
    var editingSubNoteId = null;

    // Load notes on page load
    loadNotes();

    // Add note
    $('#btnAddNote').on('click', function () {
        var noteName = $('#txtNoteName').val().trim();
        var dateOfNote = $('#txtNoteDate').val();
        var notePriority = $('#txtNotePriority').val();

        if (!noteName) {
            alert('Please enter note name');
            return;
        }
        if (!dateOfNote) {
            alert('Please select date');
            return;
        }
        if (!notePriority) {
            alert('Please enter priority');
            return;
        }

        if (editingNoteId) {
            // Update note
            $.post('/Notes/UpdateNote', {
                noteId: editingNoteId,
                noteName: noteName,
                dateOfNote: dateOfNote,
                notePriority: notePriority
            }, function (res) {
                if (res.success) {
                    clearNoteInputs();
                    editingNoteId = null;
                    $('#btnAddNote').text('Add');
                    loadNotes();
                } else {
                    alert(res.message || 'Failed to update note');
                }
            });
        } else {
            // Add new note
            $.post('/Notes/AddNote', {
                noteName: noteName,
                dateOfNote: dateOfNote,
                notePriority: notePriority
            }, function (res) {
                if (res.success) {
                    clearNoteInputs();
                    loadNotes();
                } else {
                    alert(res.message || 'Failed to add note');
                }
            });
        }
    });

    // Load all notes and rebuild accordion
    function loadNotes() {
        $.getJSON('/Notes/GetNotes', function (res) {
            if (res.success) {
                rebuildAccordion(res.data);
            } else {
                alert(res.message || 'Failed to load notes');
            }
        });
    }

    // Rebuild accordion with all notes
    function rebuildAccordion(notes) {
        var accordionHtml = '';
        $.each(notes, function (i, note) {
            accordionHtml += '<div class="accordion-item" id="accordionItem-' + note.noteId + '">';
            accordionHtml += '  <div class="accordion-header" id="accordionHeader-' + note.noteId + '">';
            accordionHtml += '    <div class="accordion-header-content">';
            accordionHtml += '      <h3>' + note.noteName + ' <span style="font-size: 0.8rem; color: #999;">(' + note.dateOfNote + ') - Priority: ' + note.notePriority + '</span></h3>';
            accordionHtml += '      <div class="accordion-header-buttons">';
            accordionHtml += '        <button class="btn btn-sm btn-edit-note" data-id="' + note.noteId + '" data-name="' + note.noteName + '" data-date="' + note.dateOfNote + '" data-priority="' + note.notePriority + '">Edit</button>';
            accordionHtml += '        <button class="btn btn-sm btn-delete-note" data-id="' + note.noteId + '">Delete</button>';
            accordionHtml += '      </div>';
            accordionHtml += '    </div>';
            accordionHtml += '    <span class="accordion-toggle">▼</span>';
            accordionHtml += '  </div>';
            accordionHtml += '  <div class="accordion-body" id="accordionBody-' + note.noteId + '">';
            accordionHtml += '    <div class="accordion-content">';
            accordionHtml += '      <div class="subnote-input-section">';
            accordionHtml += '        <div class="row g-3">';
            accordionHtml += '          <div class="col-md-5">';
            accordionHtml += '            <input type="text" class="form-control form-control-sm txt-subnote-name" placeholder="enter sub note" />';
            accordionHtml += '          </div>';
            accordionHtml += '          <div class="col-md-3">';
            accordionHtml += '            <input type="date" class="form-control form-control-sm txt-subnote-date" />';
            accordionHtml += '          </div>';
            accordionHtml += '          <div class="col-md-2">';
            accordionHtml += '            <button class="btn btn-add btn-sm btn-add-subnote w-100" data-note-id="' + note.noteId + '">Add SubNote</button>';
            accordionHtml += '          </div>';
            accordionHtml += '        </div>';
            accordionHtml += '      </div>';
            accordionHtml += '      <div class="subnote-grid-section">';
            accordionHtml += '        <table class="subnote-table subnote-table-' + note.noteId + '">';
            //accordionHtml += '          <thead>';
            //accordionHtml += '            <tr>';
            //accordionHtml += '              <th>SubNote</th>';
            //accordionHtml += '              <th>Date</th>';
            //accordionHtml += '              <th>Action</th>';
            //accordionHtml += '            </tr>';
            //accordionHtml += '          </thead>';
            accordionHtml += '          <tbody class="subnote-tbody-' + note.noteId + '"></tbody>';
            accordionHtml += '        </table>';
            accordionHtml += '      </div>';
            accordionHtml += '    </div>';
            accordionHtml += '  </div>';
            accordionHtml += '</div>';
        });
        $('#accordionContainer').html(accordionHtml);
    }

    // Accordion toggle button click handler - only expand on toggle click
    $(document).on('click', '.accordion-toggle', function (e) {
        e.stopPropagation();
        var $header = $(this).closest('.accordion-header');
        var itemId = $header.closest('.accordion-item').attr('id').replace('accordionItem-', '');
        currentNoteId = itemId;

        // Toggle active class
        if ($header.hasClass('active')) {
            $header.removeClass('active');
            $header.siblings('.accordion-body').removeClass('active');
        } else {
            // Remove active from all items
            $('#accordionContainer .accordion-header').removeClass('active');
            $('#accordionContainer .accordion-body').removeClass('active');

            // Add active to this item
            $header.addClass('active');
            $header.siblings('.accordion-body').addClass('active');

            // Load subnotes
            loadSubNotes(currentNoteId);
        }
    });

    // Prevent accordion toggle on button clicks
    $(document).on('click', '.accordion-header-buttons .btn-edit-note, .accordion-header-buttons .btn-delete-note', function (e) {
        e.stopPropagation();
    });

    // Load subnotes
    function loadSubNotes(noteId) {
        $.getJSON('/Notes/GetSubNotes', { noteId: noteId }, function (res) {
            if (res.success) {
                var html = '';
                $.each(res.data, function (i, subNote) {
                    html += '<tr>';
                    html += '<td>' + subNote.subNoteName + '</td>';
                    html += '<td>' + subNote.dateOfSubNote + '</td>';
                    html += '<td>';
                    html += '<button class="btn btn-sm btn-edit-subnote" data-id="' + subNote.subNoteId + '" data-name="' + subNote.subNoteName + '" data-date="' + subNote.dateOfSubNote + '" data-note-id="' + noteId + '">Edit</button> ';
                    html += '<button class="btn btn-sm btn-delete-subnote" data-id="' + subNote.subNoteId + '" data-note-id="' + noteId + '">Delete</button>';
                    html += '</td>';
                    html += '</tr>';
                });
                $('.subnote-tbody-' + noteId).html(html);
            } else {
                alert(res.message || 'Failed to load subnotes');
            }
        });
    }

    // Add subnote from accordion
    $(document).on('click', '.btn-add-subnote', function () {
        var noteId = $(this).data('note-id');
        var $accordionBody = $('#accordionBody-' + noteId);
        var subNoteName = $accordionBody.find('.txt-subnote-name').val().trim();
        var dateOfSubNote = $accordionBody.find('.txt-subnote-date').val();

        if (!subNoteName) {
            alert('Please enter subnote name');
            return;
        }
        if (!dateOfSubNote) {
            alert('Please select date');
            return;
        }

        if (editingSubNoteId) {
            // Update subnote
            $.post('/Notes/UpdateSubNote', {
                subNoteId: editingSubNoteId,
                subNoteName: subNoteName,
                dateOfSubNote: dateOfSubNote
            }, function (res) {
                if (res.success) {
                    $accordionBody.find('.txt-subnote-name').val('');
                    $accordionBody.find('.txt-subnote-date').val('');
                    editingSubNoteId = null;
                    loadSubNotes(noteId);
                } else {
                    alert(res.message || 'Failed to update subnote');
                }
            });
        } else {
            // Add new subnote
            $.post('/Notes/AddSubNote', {
                noteId: noteId,
                subNoteName: subNoteName,
                dateOfSubNote: dateOfSubNote
            }, function (res) {
                if (res.success) {
                    $accordionBody.find('.txt-subnote-name').val('');
                    $accordionBody.find('.txt-subnote-date').val('');
                    loadSubNotes(noteId);
                } else {
                    alert(res.message || 'Failed to add subnote');
                }
            });
        }
    });

    // Edit note
    $(document).on('click', '.btn-edit-note', function () {
        var noteId = $(this).data('id');
        var noteName = $(this).data('name');
        var dateOfNote = $(this).data('date');
        var notePriority = $(this).data('priority');

        $('#txtNoteName').val(noteName);
        $('#txtNoteDate').val(convertDateFormat(dateOfNote));
        $('#txtNotePriority').val(notePriority);
        editingNoteId = noteId;
        $('#btnAddNote').text('Update');

        $('html, body').animate({ scrollTop: 0 }, 'fast');
    });

    // Delete note
    $(document).on('click', '.btn-delete-note', function () {
        var noteId = $(this).data('id');
        if (!confirm('Delete this note and all its subnotes?')) return;

        $.post('/Notes/DeleteNote', { noteId: noteId }, function (res) {
            if (res.success) {
                loadNotes();
            } else {
                alert(res.message || 'Failed to delete note');
            }
        });
    });

    // Edit subnote
    $(document).on('click', '.btn-edit-subnote', function () {
        var subNoteId = $(this).data('id');
        var subNoteName = $(this).data('name');
        var dateOfSubNote = $(this).data('date');
        var noteId = $(this).data('note-id');

        var $accordionBody = $('#accordionBody-' + noteId);
        $accordionBody.find('.txt-subnote-name').val(subNoteName);
        $accordionBody.find('.txt-subnote-date').val(convertDateFormat(dateOfSubNote));
        editingSubNoteId = subNoteId;
            // Change button text to 'Update SubNote'
            $accordionBody.find('.btn-add-subnote').text('Update SubNote');
    });

    // Delete subnote
    $(document).on('click', '.btn-delete-subnote', function () {
        var subNoteId = $(this).data('id');
        var noteId = $(this).data('note-id');
        if (!confirm('Delete this subnote?')) return;

        $.post('/Notes/DeleteSubNote', { subNoteId: subNoteId }, function (res) {
            if (res.success) {
                loadSubNotes(noteId);
            } else {
                alert(res.message || 'Failed to delete subnote');
            }
        });
    });

    // Helper functions
    function clearNoteInputs() {
        $('#txtNoteName').val('');
        $('#txtNoteDate').val('');
        $('#txtNotePriority').val('');
    }

    function convertDateFormat(dateStr) {
        // Convert "dd-MMM-yyyy" to "yyyy-MM-dd" for date input
        var dateParts = dateStr.split('-');
        if (dateParts.length === 3) {
            var day = dateParts[0];
            var monthStr = dateParts[1];
            var year = dateParts[2];

            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var monthIndex = months.indexOf(monthStr);
            var month = (monthIndex + 1).toString().padStart(2, '0');

            return year + '-' + month + '-' + day.padStart(2, '0');
        }
        return '';
    }
});