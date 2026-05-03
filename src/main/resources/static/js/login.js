const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

const users = [
  {
    username: "user1",
    password: "1234"
  },
  {
    username: "user2",
    password: "1234"
  }
];

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const foundUser = users.find(function (user) {
    return user.username === username && user.password === password;
  });

  if (foundUser) {
    localStorage.setItem("loggedInUser", foundUser.username);
    window.location.href = "chat.html";
  } else {
    errorMessage.textContent = "Username or password is wrong.";
  }
});