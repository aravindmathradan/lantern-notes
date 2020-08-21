const textEditor = document.querySelector('.text-editor');
const preview = document.querySelector('.preview');
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

function switchTheme(btn) {
    let icon = btn.querySelector('i');
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
    document.body.classList.toggle("dark-theme");
}

function userAuth(btn) {
    let authForm = document.getElementById("authForm");
    if(authForm.style.display == "none")
        authForm.style.display = "flex";
    else
        authForm.style.display = "none";
}

function syncNotes(btn) {
    let icon = btn.querySelector('i');
    icon.classList.toggle("fa-spin");

    const userDetails = firebase.auth().currentUser;
    const userid = userDetails.uid;

    let mdText = textEditor.value;
    const data = {
        "name": "C++ notes",
        "content": mdText,
        "folder_id": "412342"
    };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    fetch('/notes', options)
        .then(res => {
            setTimeout(() => icon.classList.toggle("fa-spin"), 2000);
        })
        .catch(err => console.log(err));
}

function loadingFade() {
    setTimeout(() => {
        $("#loading-screen").fadeOut(0);
    }, 2000);
}

function renderPreview(mdText) {
    const html = converter.makeHtml(mdText);
    preview.innerHTML = html;
    // highlightjs syntax highlighting for code blocks
    preview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
    });
}

// Handling tab key press
textEditor.addEventListener('keydown', e => {
    if (e.keyCode == 9) {
        const mdText = e.target.value;
        const start = textEditor.selectionStart;
        const end = textEditor.selectionEnd;
        e.target.value = mdText.substring(0, start) + "\t" + mdText.substring(end);
        textEditor.selectionStart = textEditor.selectionEnd = start + 1;
        e.preventDefault();
    }
});

//  Rendering markdown preview from textArea on keyup event
textEditor.addEventListener('keyup', e => {
    const mdText = e.target.value;
    window.localStorage.setItem("markdown", mdText);
    renderPreview(mdText);
});

//  Loading stored markdown
const storedMarkdown = window.localStorage.getItem("markdown");
if (storedMarkdown) {
    textEditor.value = storedMarkdown;
    renderPreview(storedMarkdown);
}

// Switch view buttons
function toggleEditMode(btn) {
    let splitBtn = btn.parentNode.querySelector('.splitMode-button');
    let readBtn = btn.parentNode.querySelector('.readMode-button');
    readBtn.style.color = splitBtn.style.color = "#808080";
    btn.style.color = "#a972c9";

    preview.style.display = "none";
    if (textEditor.style.display == "none") {
        textEditor.style.display = "block";
    }
}

function toggleSplitMode(btn) {
    let editBtn = btn.parentNode.querySelector('.editMode-button');
    let readBtn = btn.parentNode.querySelector('.readMode-button');
    readBtn.style.color = editBtn.style.color = "#808080";
    btn.style.color = "#a972c9";

    if (textEditor.style.display == "none") {
        textEditor.style.display = "block";
    }
    if (preview.style.display == "none") {
        preview.style.display = "block";
    }
}

function toggleReadMode(btn) {
    let editBtn = btn.parentNode.querySelector('.editMode-button');
    let splitBtn = btn.parentNode.querySelector('.splitMode-button');
    splitBtn.style.color = editBtn.style.color = "#808080";
    btn.style.color = "#a972c9";

    textEditor.style.display = "none";
    if (preview.style.display == "none") {
        preview.style.display = "block";
    }
}

function downloadHtml() {
    let title = "Lantern MD";
    hTag = preview.querySelector('h1') || preview.querySelector('h2') || preview.querySelector('h3');
    if (hTag) title = hTag.textContent;
    let htmlDoc = document.implementation.createHTMLDocument(title);

    htmlDoc.head.innerHTML = document.head.innerHTML;
    htmlDoc.head.querySelector('title').textContent = title;
    htmlDoc.head.querySelectorAll('link').forEach(link => {
        if (link.rel == "icon") {
            link.remove();
        }
    });

    htmlDoc.body.innerHTML = preview.innerHTML;
    htmlDoc.body.setAttribute('class', "preview");
    htmlDoc.body.style.padding = "60px 100px";
    document.body.querySelectorAll('script').forEach(script => {
        htmlDoc.body.append(script);
    });

    let fileAsBlob = new Blob([htmlDoc.documentElement.innerHTML], { type: 'text/html' });
    let downloadLink = document.createElement("a");
    downloadLink.download = title + ".html";
    // This is specific to chrome. Will have to modify when backend is integrated
    // Firefox uses window.URL.createObjectURL
    downloadLink.href = window.webkitURL.createObjectURL(fileAsBlob);
    downloadLink.click();
}