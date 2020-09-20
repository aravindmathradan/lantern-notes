const defaultSession = {
    "sessionId" : null,
    "adminId" : null,
    "userList" : [],
    "noteName" : "Collab note",
    "content" : "Waiting for owner to start collaboration...",
    "active" : false
};

let localSession = getLocalStorageSession();
if(localSession) {
    sessionIdspan.textContent = localSession.sessionId;
    if(localSession.adminId == getLocalStorageUser().uid) {
        document.getElementById('startSession').style.display = "block";
        document.getElementById('startNewSession').style.display = "none";
        document.getElementById('collabDivider').style.display = "none";
        document.getElementById('collabJoin').style.display = "none";
    }
    socket.emit('collabSession', localSession);
}
else
    setLocalStorageSession(defaultSession);

function setLocalStorageSession(session) {
    window.localStorage.setItem("session", JSON.stringify(session));
}

function getLocalStorageSession() {
    return JSON.parse(window.localStorage.getItem("session"));
}

function startNewSession() {
    document.getElementById('startSession').style.display = "block";
    document.getElementById('startNewSession').style.display = "none";
    document.getElementById('collabDivider').style.display = "none";
    document.getElementById('collabJoin').style.display = "none";

    // Generate collab session id and store
    let currentUser = getLocalStorageUser();
    let currentNote = getLocalStorageNote();
    let sessionId = "session-" + uuidv4();
    sessionIdspan.textContent = sessionId;
    currentSession = {
        "sessionId" : sessionId,
        "adminId" : currentUser.uid,
        "userList" : [currentUser.uid],
        "noteName" : currentNote.noteName,
        "content" : currentNote.content,
        "active" : true
    };
    copySessionId(document.getElementById("copyButton"));
    setLocalStorageSession(currentSession);
    socket.emit('collabSession', currentSession);
}

function stopSession() {
    document.getElementById('startSession').style.display = "none";
    document.getElementById('startNewSession').style.display = "block";
    document.getElementById('collabDivider').style.display = "block";
    document.getElementById('collabJoin').style.display = "block";

    let currentSession = getLocalStorageSession();
    if(getLocalStorageUser().uid == currentSession.adminId) {
        currentSession.active = false;
        socket.emit("collabSession", currentSession);
        setLocalStorageSession(defaultSession);
    }
}

function generateSessionId() {
    stopSession();
    startNewSession();
}

function copySessionId(btn) {
    const el = document.createElement('textarea');
    el.value = sessionIdspan.textContent;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    btn.textContent = "Copied!";

    setTimeout(() => {
        btn.textContent = "Copy to clipboard ";
        const i = document.createElement("i");
        i.setAttribute("class", "fa fa-clipboard fa-fw");
        btn.appendChild(i);
    }, 3000);
}

function joinSession() {
    let sessionId = document.getElementById('collabJoinId').value;
    let currentUser = getLocalStorageUser();
    let currentSession = {
        "sessionId" : null,
        "adminId" : null,
        "userList" : [],
        "noteName" : "Collab note",
        "content" : "Waiting for owner to start collaboration...",
        "active" : false
    };
    currentSession.sessionId = sessionId;
    currentSession.active = true;
    currentSession.userList.push(currentUser.uid);
    createNewNote()
        .then(() => {
            let currentNote = getLocalStorageNote();
            currentNote.noteName  = currentSession.noteName = "Collab note";
            currentNote.content = currentSession.content = "Waiting for owner to start the session...";
            loadNoteToWindow(currentNote);
            setLocalStorageNote(currentNote);
            setLocalStorageSession(currentSession);
            socket.emit('collabSession', currentSession);
        });
}