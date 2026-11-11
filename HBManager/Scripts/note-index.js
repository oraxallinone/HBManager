$(function () {
    var notes = [];
    var editingSubNoteId = null;
    var expandedCardPlaceholder = null;
    var expandedCardPortal = null;
    var api = window.noteTaskUrls || {};

    $('#taskDate').val(today());
    loadNotes();

    $('#btnNewTask').on('click', function () {
        openTaskModal(null);
    });

    $('[data-close-modal]').on('click', closeTaskModal);

    $('#taskForm').on('submit', function (event) {
        event.preventDefault();
        var noteId = $('#taskId').val();
        var priority = parseInt($('#taskPriority').val(), 10);
        var payload = {
            noteName: $.trim($('#taskTitle').val()),
            noteDescription: $('#taskDescription').val(),
            dateOfNote: $('#taskDate').val(),
            notePriority: priority
        };

        if (!payload.noteName || !payload.dateOfNote || isNaN(priority)) {
            alert('Enter a title, due date, and numeric priority.');
            return;
        }

        var url = noteId ? api.updateNote : api.addNote;
        if (noteId) {
            payload.noteId = noteId;
        }
        $.post(url, payload)
            .done(function (response) {
                if (!response.success) {
                    alert(response.message || 'Unable to save task.');
                    return;
                }
                closeTaskModal();
                loadNotes();
            })
            .fail(showRequestError);
    });

    $('#taskSearch, #priorityFilter, #statusFilter').on('input change', applyFilters);

    $(document).on('change', '.task-complete', function () {
        var $checkbox = $(this);
        var $card = $checkbox.closest('.task-card');
        $.post(api.updateNoteCompletion, {
            noteId: $card.data('id'),
            isCompleted: $checkbox.is(':checked')
        }).done(function (response) {
            if (!response.success) {
                $checkbox.prop('checked', !$checkbox.is(':checked'));
                alert(response.message || 'Unable to update task status.');
                return;
            }
            loadNotes();
        }).fail(function () {
            $checkbox.prop('checked', !$checkbox.is(':checked'));
            showRequestError();
        });
    });

    $(document).on('click', '.task-edit', function () {
        var note = findNote($(this).closest('.task-card').data('id'));
        if (note) {
            openTaskModal(note);
        }
    });

    $(document).on('click', '.task-delete', function () {
        var noteId = $(this).closest('.task-card').data('id');
        if (!window.confirm('Delete this task and all its subtasks?')) {
            return;
        }
        $.post(api.deleteNote, { noteId: noteId })
            .done(function (response) {
                if (response.success) {
                    loadNotes();
                } else {
                    alert(response.message || 'Unable to delete task.');
                }
            })
            .fail(showRequestError);
    });

    $(document).on('click', '.task-maximize', function () {
        var $card = $(this).closest('.task-card');
        if ($card.hasClass('is-maximized')) {
            closeExpandedCard();
            return;
        }

        closeExpandedCard(false);
        expandedCardPlaceholder = $('<span hidden></span>').insertBefore($card);
        expandedCardPortal = $('<div class="task-page task-card-portal"></div>').appendTo('body');
        $('<div class="task-card-backdrop" aria-hidden="true"></div>')
            .appendTo(expandedCardPortal)
            .on('click', function () {
                closeExpandedCard();
            });
        expandedCardPortal.append($card);
        $card.addClass('is-maximized');
        $('body').addClass('task-card-expanded');
        var $subtaskPanel = $card.find('.subtask-panel');
        var $subtaskToggle = $card.find('.subtask-toggle');
        $subtaskPanel.prop('hidden', false);
        $subtaskToggle.attr('aria-expanded', 'true');
        if (!$subtaskPanel.data('loaded')) {
            loadSubNotes($card);
        }
        $card.find('.task-maximize')
            .attr({ 'aria-label': 'Restore task card', title: 'Restore task card', 'aria-expanded': 'true' })
            .html('<i class="fa fa-compress" aria-hidden="true"></i>')
            .trigger('focus');
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape' && $('.task-card.is-maximized').length && $('#taskModal').prop('hidden')) {
            closeExpandedCard();
        }
    });

    $(document).on('click', '.subtask-toggle', function () {
        var $button = $(this);
        var $card = $button.closest('.task-card');
        var $panel = $card.find('.subtask-panel');
        var opening = $panel.prop('hidden');
        $panel.prop('hidden', !opening);
        $button.attr('aria-expanded', opening ? 'true' : 'false');
        if (opening && !$panel.data('loaded')) {
            loadSubNotes($card);
        }
    });

    $(document).on('submit', '.subtask-form', function (event) {
        event.preventDefault();
        var $form = $(this);
        var $card = $form.closest('.task-card');
        var subNoteId = $form.find('.subtask-edit-id').val();
        var name = $.trim($form.find('.subtask-name').val());
        var date = $form.find('.subtask-date').val();
        if (!name || !date) {
            alert('Enter a subtask name and due date.');
            return;
        }

        var payload = {
            subNoteName: name,
            dateOfSubNote: date
        };
        var url = api.addSubNote;
        if (subNoteId) {
            payload.subNoteId = subNoteId;
            url = api.updateSubNote;
        } else {
            payload.noteId = $card.data('id');
        }

        $.post(url, payload)
            .done(function (response) {
                if (!response.success) {
                    alert(response.message || 'Unable to save subtask.');
                    return;
                }
                resetSubtaskForm($form);
                loadSubNotes($card);
            })
            .fail(showRequestError);
    });

    $(document).on('change', '.subtask-complete', function () {
        var $checkbox = $(this);
        var $row = $checkbox.closest('.subtask-row');
        var $card = $checkbox.closest('.task-card');
        $.post(api.updateSubNoteCompletion, {
            subNoteId: $row.data('id'),
            isCompleted: $checkbox.is(':checked')
        }).done(function (response) {
            if (!response.success) {
                $checkbox.prop('checked', !$checkbox.is(':checked'));
                alert(response.message || 'Unable to update subtask status.');
                return;
            }
            loadSubNotes($card);
        }).fail(function () {
            $checkbox.prop('checked', !$checkbox.is(':checked'));
            showRequestError();
        });
    });

    $(document).on('click', '.subtask-edit', function () {
        var $row = $(this).closest('.subtask-row');
        var $form = $row.closest('.subtask-panel').find('.subtask-form');
        $form.find('.subtask-edit-id').val($row.data('id'));
        $form.find('.subtask-name').val($row.data('name'));
        $form.find('.subtask-date').val(toInputDate($row.data('date')));
        $form.find('.subtask-save').text('Update subtask');
        $form.find('.subtask-cancel').prop('hidden', false);
        $form.find('.subtask-name').trigger('focus');
    });

    $(document).on('click', '.subtask-delete', function () {
        var $row = $(this).closest('.subtask-row');
        var $card = $(this).closest('.task-card');
        if (!window.confirm('Delete this subtask?')) {
            return;
        }
        $.post(api.deleteSubNote, { subNoteId: $row.data('id') })
            .done(function (response) {
                if (response.success) {
                    loadSubNotes($card);
                } else {
                    alert(response.message || 'Unable to delete subtask.');
                }
            })
            .fail(showRequestError);
    });

    function loadNotes() {
        $.getJSON(api.getNotes)
            .done(function (response) {
                if (!response.success) {
                    alert(response.message || 'Unable to load tasks.');
                    return;
                }
                notes = response.data || [];
                populatePriorities();
                applyFilters();
            })
            .fail(showRequestError);
    }

    function applyFilters() {
        var query = $.trim($('#taskSearch').val()).toLowerCase();
        var priority = $('#priorityFilter').val();
        var status = $('#statusFilter').val();
        var filtered = $.grep(notes, function (note) {
            var searchText = [
                note.noteName,
                note.noteDescription,
                note.subNoteNames
            ].join(' ').toLowerCase();
            return (!query || searchText.indexOf(query) !== -1) &&
                (!priority || String(note.notePriority) === priority) &&
                (!status || (status === 'completed') === !!note.isCompleted);
        });

        $('#totalCount').text(notes.length);
        $('#completedCount').text($.grep(notes, function (note) { return !!note.isCompleted; }).length);
        $('#pendingCount').text(notes.length - parseInt($('#completedCount').text(), 10));
        renderTasks(filtered);
        $('#emptyTasks').prop('hidden', filtered.length !== 0);
    }

    function populatePriorities() {
        var selected = $('#priorityFilter').val();
        var priorities = {};
        $.each(notes, function (_, note) {
            if (note.notePriority !== null && note.notePriority !== undefined && note.notePriority !== '') {
                priorities[String(note.notePriority)] = true;
            }
        });
        var values = Object.keys(priorities).sort(function (left, right) {
            return parseInt(left, 10) - parseInt(right, 10);
        });
        $('#priorityFilter').empty().append('<option value="">All Priorities</option>');
        $.each(values, function (_, value) {
            $('#priorityFilter').append($('<option></option>').val(value).text('Priority ' + value));
        });
        $('#priorityFilter').val(selected);
    }

    function renderTasks(list) {
        closeExpandedCard(false);
        var html = '';
        $.each(list, function (_, note) {
            var id = escapeHtml(note.noteId);
            var title = escapeHtml(note.noteName);
            var description = escapeHtml(note.noteDescription || '');
            var date = escapeHtml(note.dateOfNote || '');
            var priority = escapeHtml(note.notePriority);
            var priorityLabel = getPriorityLabel(note.notePriority);
            var priorityClass = getPriorityClass(note.notePriority);
            var priorityIcon = priorityClass === 'priority-band-9' ? '<i class="fa fa-trophy task-trophy" aria-hidden="true"></i>' : '';
            var isCompleted = !!note.isCompleted;
            var totalSubNotes = parseInt(note.subNoteCount, 10) || 0;
            var completedSubNotes = parseInt(note.completedSubNoteCount, 10) || 0;
            html += '<article class="task-card ' + priorityClass + (isCompleted ? ' is-completed' : '') + '" data-id="' + id + '">';
            html += '<div class="task-card-heading">';
            html += '<label class="task-check"><input class="task-complete" type="checkbox" ' + (isCompleted ? 'checked' : '') + ' aria-label="Mark ' + title + ' complete" /><span></span></label>';
            html += priorityIcon;
            html += '<h2 class="task-title">' + title + '</h2>';
            html += '<span class="task-priority ' + priorityClass + '">' + priorityLabel + ' ' + priority + '</span>';
            html += '</div>';
            if (description) {
                html += '<p class="task-description">' + description + '</p>';
            }
            html += '<p class="task-due-date"><i class="fa fa-calendar" aria-hidden="true"></i>' + date + '</p>';
            html += '<div class="task-card-footer">';
            html += '<button type="button" class="subtask-toggle" aria-expanded="false"><i class="fa fa-chevron-down" aria-hidden="true"></i> Subtasks (' + completedSubNotes + '/' + totalSubNotes + ')</button>';
            html += '<div class="task-card-actions"><button type="button" class="task-icon-button task-maximize" title="Maximize task card" aria-label="Maximize task card" aria-expanded="false"><i class="fa fa-expand" aria-hidden="true"></i></button><button type="button" class="task-icon-button task-edit" title="Edit task" aria-label="Edit task"><i class="fa fa-pencil-alt" aria-hidden="true"></i></button><button type="button" class="task-icon-button task-delete" title="Delete task" aria-label="Delete task"><i class="fa fa-trash" aria-hidden="true"></i></button></div>';
            html += '</div>';
            html += '<div class="subtask-panel" hidden><form class="subtask-form"><input class="subtask-edit-id" type="hidden" /><input class="subtask-name" type="text" maxlength="255" placeholder="Add a subtask..." required /><input class="subtask-date" type="date" value="' + today() + '" required /><button class="task-button task-button-primary subtask-save" type="submit">Add</button><button class="subtask-cancel" type="button" hidden>Cancel</button></form><div class="subtask-list"></div></div>';
            html += '</article>';
        });
        $('#taskGrid').html(html);
    }

    function closeExpandedCard(restoreFocus) {
        var $card = $('.task-card.is-maximized');
        if (!$card.length) {
            return;
        }

        $card.removeClass('is-maximized');
        $card.find('.task-maximize')
            .attr({ 'aria-label': 'Maximize task card', title: 'Maximize task card', 'aria-expanded': 'false' })
            .html('<i class="fa fa-expand" aria-hidden="true"></i>');
        if (expandedCardPlaceholder && expandedCardPlaceholder.length) {
            $card.insertBefore(expandedCardPlaceholder);
            expandedCardPlaceholder.remove();
        }
        if (expandedCardPortal && expandedCardPortal.length) {
            expandedCardPortal.remove();
        }
        expandedCardPlaceholder = null;
        expandedCardPortal = null;
        $('body').removeClass('task-card-expanded');
        if (restoreFocus !== false) {
            $card.find('.task-maximize').trigger('focus');
        }
    }

    function loadSubNotes($card) {
        $.getJSON(api.getSubNotes, { noteId: $card.data('id') })
            .done(function (response) {
                if (!response.success) {
                    alert(response.message || 'Unable to load subtasks.');
                    return;
                }
                var html = '';
                $.each(response.data || [], function (_, subNote) {
                    var name = escapeHtml(subNote.subNoteName);
                    var date = escapeHtml(subNote.dateOfSubNote);
                    html += '<div class="subtask-row' + (subNote.isCompleted ? ' is-completed' : '') + '" data-id="' + escapeHtml(subNote.subNoteId) + '" data-name="' + name + '" data-date="' + date + '">';
                    html += '<label class="subtask-check"><input class="subtask-complete" type="checkbox" ' + (subNote.isCompleted ? 'checked' : '') + ' aria-label="Mark ' + name + ' complete" /><span></span></label>';
                    html += '<span class="subtask-title">' + name + '</span><time>' + date + '</time>';
                    html += '<button type="button" class="task-icon-button subtask-edit" title="Edit subtask" aria-label="Edit subtask"><i class="fa fa-pencil-alt" aria-hidden="true"></i></button>';
                    html += '<button type="button" class="task-icon-button subtask-delete" title="Delete subtask" aria-label="Delete subtask"><i class="fa fa-trash" aria-hidden="true"></i></button></div>';
                });
                $card.find('.subtask-list').html(html || '<p class="subtask-empty">No subtasks yet.</p>');
                $card.find('.subtask-panel').data('loaded', true);
                var completed = $.grep(response.data || [], function (subNote) { return !!subNote.isCompleted; }).length;
                $card.find('.subtask-toggle').html('<i class="fa fa-chevron-down" aria-hidden="true"></i> Subtasks (' + completed + '/' + (response.data || []).length + ')');
                updateNoteSubtaskSummary($card.data('id'), response.data || []);
            })
            .fail(showRequestError);
    }

    function updateNoteSubtaskSummary(noteId, subNotes) {
        var note = findNote(noteId);
        if (!note) {
            return;
        }
        note.subNoteCount = subNotes.length;
        note.completedSubNoteCount = $.grep(subNotes, function (subNote) { return !!subNote.isCompleted; }).length;
        note.subNoteNames = $.map(subNotes, function (subNote) { return subNote.subNoteName || ''; }).join(' ');
    }

    function openTaskModal(note) {
        $('#taskForm')[0].reset();
        $('#taskId').val(note ? note.noteId : '');
        $('#taskTitle').val(note ? note.noteName : '');
        $('#taskDescription').val(note ? note.noteDescription : '');
        $('#taskDate').val(note ? toInputDate(note.dateOfNote) : today());
        $('#taskPriority').val(note && note.notePriority !== null ? note.notePriority : 0);
        $('#taskModalTitle').text(note ? 'Edit Task' : 'New Task');
        $('#btnSaveTask').text(note ? 'Save Changes' : 'Create Task');
        $('#taskModal').prop('hidden', false);
        $('#taskTitle').trigger('focus');
    }

    function closeTaskModal() {
        $('#taskModal').prop('hidden', true);
    }

    function resetSubtaskForm($form) {
        $form[0].reset();
        $form.find('.subtask-edit-id').val('');
        $form.find('.subtask-date').val(today());
        $form.find('.subtask-save').text('Add');
        $form.find('.subtask-cancel').prop('hidden', true);
    }

    $(document).on('click', '.subtask-cancel', function () {
        resetSubtaskForm($(this).closest('.subtask-form'));
    });

    function findNote(id) {
        for (var index = 0; index < notes.length; index++) {
            if (String(notes[index].noteId) === String(id)) {
                return notes[index];
            }
        }
        return null;
    }

    function getPriorityClass(priority) {
        var value = Number(priority);
        var band = isFinite(value) ? Math.floor(Math.max(value, 0) / 10) % 10 : 9;
        return 'priority-band-' + band;
    }

    function getPriorityLabel(priority) {
        var value = Number(priority);
        return isFinite(value) && value >= 0 && value <= 10 ? 'Pin' : 'Priority';
    }

    function escapeHtml(value) {
        return $('<div>').text(value === null || value === undefined ? '' : String(value)).html()
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function today() {
        var date = new Date();
        return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    }

    function toInputDate(value) {
        if (!value) {
            return today();
        }
        var parts = String(value).split('-');
        if (parts.length === 3 && parts[0].length === 2) {
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var month = months.indexOf(parts[1]);
            if (month >= 0) {
                return parts[2] + '-' + ('0' + (month + 1)).slice(-2) + '-' + parts[0];
            }
        }
        return value;
    }

    function showRequestError() {
        alert('The request could not be completed. Please try again.');
    }
});
