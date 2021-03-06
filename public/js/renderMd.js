const converter = new showdown.Converter({
    strikethrough: true,
    tables: true,
    tasklists: true,
    smoothLivePreview: true,
    parseImgDimensions: true,
    ghMentions: true,
    simpleLineBreaks: true,
    simplifiedAutoLink: true,
    literalMidWordUnderscores: true
});

let savedFlag = true;
let syncTimer = null;

function renderPreview(mdText) {
    const html = converter.makeHtml(mdText);
    preview.innerHTML = html;
    preview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
    });
}

//  Handling tab key press
textEditor.addEventListener('keydown', e => {
    if (e.keyCode == 9 || e.key == 9 || e.keyIdentifier == 9 || e.code == 9) {
        let mdText = e.target.value;
        let start = textEditor.selectionStart;
        let end = textEditor.selectionEnd;
        e.target.value = mdText.substring(0, start) + "\t" + mdText.substring(end);
        textEditor.selectionStart = textEditor.selectionEnd = start + 1;
        e.preventDefault();
    }
});

textEditor.addEventListener('keyup', e => {
    let mdText = e.target.value;
    renderPreview(mdText);

    let currentSession = getLocalStorageSession();
    if(currentSession.active) {
        currentSession.content = mdText;
        setLocalStorageSession(currentSession);
        socket.emit('collabSession', currentSession);
    }

    let currentNote = getLocalStorageNote();
    currentNote.content = mdText;
    setLocalStorageNote(currentNote);
    savedFlag = false;

    // Sync every 1.5 secs after an edit
    if(syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
    }
    syncTimer = setTimeout(() => syncNotes(syncButton), 1500);
});

socket.on('collabSession', (session) => {
    if(session.active) {
        // if new collaborator is joining, connect them.
        if(!session.adminId) {
            let currentSession = getLocalStorageSession();
            currentSession.userList.push(session.userList[0]);
            socket.emit('collabSession', currentSession);
            setLocalStorageSession(currentSession);

            if(session.message) {
                const alert = new Alert();
                alert.display(session.message);
            }
        }
        else {
            let currentNote = getLocalStorageNote();
            currentNote.noteName = session.noteName;
            currentNote.content = session.content;
            loadNoteToWindow(currentNote);
            setLocalStorageNote(currentNote);
            setLocalStorageSession(session);

            if(session.message) {
                const alert = new Alert();
                alert.display(session.message);
            }
        }
    }
    else {
        if(session.message) {
            const alert = new Alert();
            alert.display(session.message);
        }

        //  will have to delete the current note and open the new collab window
        if(!session.adminId) {
            document.getElementById('startSession').style.display = "none";
            document.getElementById('startNewSession').style.display = "block";
            document.getElementById('collabDivider').style.display = "block";
            document.getElementById('collabJoin').style.display = "block";
            document.getElementById('collabJoined').style.display = "none";

            deleteNote(getLocalStorageNote());
            setLocalStorageSession(defaultSession);
        }
    }
});