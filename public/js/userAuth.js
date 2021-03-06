const firebaseConfig = {
    apiKey: "AIzaSyAaddWAT8DhMqJKKutVPJixRO1blsG_l28",
    authDomain: "lantern-notes-18e80.firebaseapp.com",
    databaseURL: "https://lantern-notes-18e80.firebaseio.com",
    projectId: "lantern-notes-18e80",
    storageBucket: "lantern-notes-18e80.appspot.com",
    messagingSenderId: "758697682218",
    appId: "1:758697682218:web:1a591eb94706fb5e2eea53",
    measurementId: "G-8P5E87BCRY"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

loginButton.addEventListener("click", e => {
    let email = document.getElementById("loginEmail").value;
    let password = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            let errorCode = error.code;
            if (errorCode == 'auth/wrong-password') {
                loginError.textContent = "*The email/password is incorrect.";
            }
            else if (errorCode == 'auth/user-not-found') {
                loginError.textContent = "*No such user exists.";
            }
            else if (errorCode == 'auth/user-disabled') {
                loginError.textContent = "*This user has been disabled!";
            }
            else if (errorCode == 'auth/invalid-email') {
                loginError.textContent = "*Enter a valid email id";
            }
            else {
                loginError.textContent = "*An error occured. Try again later!";
            }
        });
});

function showPassword() {
    if(loginPassword.type == "password") {
        loginPassword.type = "text";
    }
    else {
        loginPassword.type = "password";
    }
}

fpButton.addEventListener("click", e => {
    let email = document.getElementById("fpEmail").value;

    auth.sendPasswordResetEmail(email)
        .then(() => {
            modalContainer.style.display = "none";
            const alert = new Alert();
            alert.display("Check your email for password reset link!");
        })
        .catch(error => {
            let errorCode = error.code;
            if (errorCode == 'auth/invalid-email') {
                fpError.textContent = "*Enter a valid email id";
            }
            else if (errorCode == 'auth/user-not-found') {
                fpError.textContent = "*No user found with this email."
            }
            else {
                fpError.textContent = "*An error occured. Try again later!";
            }
        });
});

async function storeUserDetails(user, name) {
    let options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "name": name,
            "email": user.email,
            "userId": user.uid
        })
    };
    await user.updateProfile({ displayName: name });
    await fetch('/users', options);
}

signupButton.addEventListener("click", e => {
    let name = document.getElementById("signupDisplayname").value;
    let email = document.getElementById("signupEmail").value;
    let password = document.getElementById("signupPassword").value;
    let cnfPassword = document.getElementById("signupCnfPassword").value;

    if (password != cnfPassword) {
        signupError.textContent = "*Passwords do not match!";
        signupPassword.value = "";
        signupCnfPassword.value = "";
    }
    else {
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                let user = userCredential.user;
                user.sendEmailVerification();
                storeUserDetails(user, name)
                    .catch(err => console.log(err.message));
            })
            .catch(error => {
                let errorCode = error.code;
                if (errorCode == "auth/email-already-in-use") {
                    signupError.textContent = "*This email is already in use!";
                }
                else if (errorCode == "auth/invalid-email") {
                    signupError.textContent = "*Enter a valid email id!";
                }
                else if (errorCode == "auth/weak-password") {
                    signupError.textContent = "*Password is too weak. Use min. 6 characters!"
                }
                else {
                    signupError.textContent = "*An error occured. Try again later!";
                }
            });
    }
});

signoutButton.addEventListener("click", e => {
    if(getLocalStorageSession().active)
    {
        if(confirm("Logging out will stop the collaborative session. Continue?"))
        {
            stopSession();
            auth.signOut();
        }
    }
    else
        auth.signOut();
});

auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
        if (firebaseUser.displayName) {
            document.getElementById("loggedinMessageSpan").textContent = "Welcome back, " + firebaseUser.displayName + "!";
            if(firebaseUser.displayName[0].toUpperCase().match(/[A-Z]/i))
                document.getElementById("avatar").setAttribute("src", `assets/profilePictures/${firebaseUser.displayName[0].toUpperCase()}.png`);
        }
        else {
            document.getElementById("avatar").setAttribute("src", `assets/profilePictures/userAvatar.png`);
            document.getElementById("loggedinMessageSpan").textContent = "You are now logged in!";
        }
        openWindow("loggedinWindow");
        
        //  Assign a noteId to the note if its new on login.
        let currentNote = getLocalStorageNote();
        if (!currentNote.noteId) {
            currentNote.noteId = "note-" + uuidv4();
        }

        setLocalStorageNote(currentNote);
        setLocalStorageUser(firebaseUser);  //  Will store displayName only from second login.
        
        if(currentNote.content != defaultNote.content || currentNote.noteName != defaultNote.noteName) {
        //  Sync notes after login if edited.
            syncNotes(syncButton)
                .then(() => fetchNotes());
        }
        else {
            fetchNotes();
        }
    }
    else {
        //  Users current note will be open even after signout. Feature or Bug?
        setLocalStorageNote(defaultNote);
        setLocalStorageUser(firebaseUser);
        loadNoteToWindow(defaultNote);
        fetchNotes();
        document.getElementById("loggedinMessageSpan").textContent = "You are now signed out!";
        setTimeout(() => openWindow("loginWindow"), 1000);
    }
});