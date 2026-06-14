const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messageArea = document.getElementById("messageArea");
const logoutButton = document.getElementById("logoutButton");
const currentUserNameEl = document.getElementById("currentUserName");
const contactsList = document.getElementById("contactsList");
const chatHeaderName = document.getElementById("chatHeaderName");
const chatHeaderPersonalMsg = document.getElementById("chatHeaderPersonalMsg");
const activeReceiverAvatar = document.getElementById("activeReceiverAvatar");
const userStatusSelect = document.getElementById("userStatusSelect");
const currentUserPersonalMsg = document.getElementById("currentUserPersonalMsg");

const currentUser = localStorage.getItem("username");
window.currentUser = currentUser;

if (!currentUser) {
    window.location.href = "index.html";
}

currentUserNameEl.textContent = currentUser;

let activeReceiver = null;
window.activeReceiver = activeReceiver;
let allUsers = [];
let socket = null;

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

currentUserPersonalMsg.addEventListener("change", () => {
    const msg = currentUserPersonalMsg.value.trim();
    fetch("/updatePersonalMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, personalMessage: msg })
    })
        .then(res => {
            if (res.ok) loadUsers();
        });
});

userStatusSelect.addEventListener("change", () => {
    const status = userStatusSelect.value;
    fetch("/updateStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, status: status })
    })
        .then(res => {
            if (res.ok) loadUsers();
        });
});

function connectWebSocket() {
    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsUrl = wsProtocol + window.location.host + "/chat-ws?user=" + encodeURIComponent(currentUser);

    socket = new WebSocket(wsUrl);
    window.socket = socket;

    socket.onopen = function () {
        console.log("WebSocket verbunden.");
        loadMessages();
    };

    socket.onmessage = function (event) {
        const message = JSON.parse(event.data);
        const belongs = ((message.sender === currentUser && message.receiver === activeReceiver) ||
            (message.sender === activeReceiver && message.receiver === currentUser));
        if (belongs) appendMessage(message);
    };

    socket.onclose = function () {
        console.log("WebSocket getrennt. Erneute Verbindung...");
        setTimeout(connectWebSocket, 3000);
    };
}

messageForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!activeReceiver) { alert("Bitte wähle einen Kontakt aus."); return; }
    const text = messageInput.value.trim();
    if (text === "") return;
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ receiver: activeReceiver, text: text }));
        messageInput.value = "";
    } else {
        alert("Verbindungsfehler.");
    }
});

function loadUsers() {
    fetch("/users")
        .then(r => r.json())
        .then(users => {
            const me = users.find(u => u.username === currentUser);
            if (me) {
                if (document.activeElement !== currentUserPersonalMsg) {
                    currentUserPersonalMsg.value = me.personalMessage || "";
                }
                userStatusSelect.value = me.status || "Online";
            }

            allUsers = users.filter(u => u.username !== currentUser);
            contactsList.innerHTML = "";
            if (allUsers.length === 0) {
                contactsList.innerHTML = '<p style="padding: 20px; color: #888;">Keine Benutzer gefunden.</p>';
                activeReceiver = null; window.activeReceiver = null;
                chatHeaderName.textContent = "Kein Chat ausgewählt";
                chatHeaderPersonalMsg.textContent = "";
                activeReceiverAvatar.textContent = "?";
                messageArea.innerHTML = "";
                return;
            }

            const activeUserObj = allUsers.find(u => u.username === activeReceiver);
            if (activeUserObj) {
                updateHeaderAvatar(activeUserObj);
            }

            if (!activeReceiver && allUsers.length > 0) selectReceiver(allUsers[0]);

            const statusColorMap = {
                "Online": "#31a24c",
                "Busy": "#e02424",
                "Away": "#f59e0b",
                "Offline": "#9ca3af"
            };

            allUsers.forEach(user => {
                const div = document.createElement("div");
                div.className = "contact-box" + (user.username === activeReceiver ? " active" : "");
                const sc = statusColorMap[user.status] || "#31a24c";
                const displayStatus = user.status || "Online";

                const personalMsgHtml = user.personalMessage
                    ? `<p style="font-size: 10px; font-style: italic; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">"${escapeHTML(user.personalMessage)}"</p>`
                    : `<p style="font-size: 10px; color: #bbb;">Klicke zum Chatten</p>`;

                div.innerHTML = `
                    <div class="avatar small" style="border: 2px solid ${sc}; display: flex; align-items: center; justify-content: center;">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <h4 style="font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                            ${escapeHTML(user.username)} 
                            <span style="font-size: 10px; color: ${sc}">(${displayStatus})</span>
                        </h4>
                        ${personalMsgHtml}
                    </div>
                `;
                div.addEventListener("click", () => selectReceiver(user));
                contactsList.appendChild(div);
            });
        });
}

function selectReceiver(user) {
    activeReceiver = user.username;
    window.activeReceiver = activeReceiver;
    chatHeaderName.textContent = user.username;

    const statusColorMap = {
        "Online": "#31a24c",
        "Busy": "#e02424",
        "Away": "#f59e0b",
        "Offline": "#9ca3af"
    };
    const sc = statusColorMap[user.status] || "#31a24c";
    chatHeaderPersonalMsg.innerHTML = `<span style="color: ${sc}; font-weight: bold;">${escapeHTML(user.status || "Online")}</span>${user.personalMessage ? ' - "' + escapeHTML(user.personalMessage) + '"' : ''}`;

    updateHeaderAvatar(user);

    document.querySelectorAll("#contactsList .contact-box").forEach(b => {
        const h4 = b.querySelector("h4");
        if (h4 && h4.textContent.trim().startsWith(user.username)) {
            b.classList.add("active");
        } else {
            b.classList.remove("active");
        }
    });
    loadMessages();
}

function updateHeaderAvatar(user) {
    activeReceiverAvatar.innerHTML = user.username.charAt(0).toUpperCase();
    activeReceiverAvatar.style.display = "flex";
    activeReceiverAvatar.style.alignItems = "center";
    activeReceiverAvatar.style.justifyContent = "center";
}

function appendMessage(message) {
    const div = document.createElement("div");
    div.className = "message-line " + (message.sender === currentUser ? "self" : "buddy");
    div.innerHTML = `<div class="msg-header">${escapeHTML(message.sender)} (${escapeHTML(message.time)}):</div>
        <div class="msg-body">${escapeHTML(message.text)}</div>`;
    messageArea.appendChild(div);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function loadMessages() {
    if (!activeReceiver) { messageArea.innerHTML = ""; return; }
    fetch("/messages?user=" + currentUser)
        .then(r => r.json())
        .then(messages => {
            messageArea.innerHTML = "";
            messages.filter(m => (m.sender === currentUser && m.receiver === activeReceiver) ||
                (m.sender === activeReceiver && m.receiver === currentUser))
                .forEach(m => appendMessage(m));
            messageArea.scrollTop = messageArea.scrollHeight;
        });
}

logoutButton.addEventListener("click", function () {
    if (socket) socket.close();
    localStorage.removeItem("username");
    window.location.href = "index.html";
});

loadUsers();
connectWebSocket();
setInterval(loadUsers, 5000);