
const $ = id => document.getElementById(id);

let conversations = JSON.parse(localStorage.getItem("void_history") || "[]");
let currentMessages = [];
let currentMode = "Fast";
let selectedFile = null;

function saveHistory() {
  localStorage.setItem("void_history", JSON.stringify(conversations));
}

function toast(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

function addMessage(role, content) {
  const container = $("messages");
  if (!container) return;

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "YOU" : "VOID AI";

  const body = document.createElement("div");
  body.className = "message-content";
  body.textContent = content;

  message.append(label, body);
  container.appendChild(message);

  const scroll = $("chatScroll");
  if (scroll) scroll.scrollTop = scroll.scrollHeight;

  return message;
}

function showWelcome() {
  const welcome = $("welcome");
  if (welcome) welcome.style.display = "block";

  const messages = $("messages");
  if (messages) messages.innerHTML = "";

  currentMessages = [];
}

function newChat() {
  currentMessages = [];
  showWelcome();
  toast("New chat started");
}

async function sendMessage() {
  const input = $("messageInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";

  const welcome = $("welcome");
  if (welcome) welcome.style.display = "none";

  currentMessages.push({ role: "user", content: text });
  addMessage("user", text);

  const sendButton = $("sendButton");
  if (sendButton) sendButton.disabled = true;

  const loading = addMessage("assistant", "VOID AI sedang berpikir...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: currentMessages,
        mode: currentMode
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Terjadi kesalahan server");
    }

    const answer =
      data.reply ||
      data.output ||
      data.message ||
      "VOID AI tidak memberikan jawaban.";

    loading.querySelector(".message-content").textContent = answer;

    currentMessages.push({
      role: "assistant",
      content: answer
    });

    conversations.push({
      title: text.slice(0, 40),
      messages: currentMessages,
      date: Date.now()
    });

    saveHistory();
    renderHistory();

  } catch (error) {
    loading.querySelector(".message-content").textContent =
      "Gagal menghubungi server: " + error.message;
  }

  if (sendButton) sendButton.disabled = false;
  input.focus();
}

function renderHistory() {
  const list = $("historyList");
  if (!list) return;

  list.innerHTML = "";

  conversations.slice(-30).reverse().forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.textContent = item.title || "Percakapan baru";

    button.onclick = () => {
      currentMessages = [...(item.messages || [])];

      const welcome = $("welcome");
      if (welcome) welcome.style.display = "none";

      const container = $("messages");
      if (container) container.innerHTML = "";

      currentMessages.forEach(message => {
        addMessage(
          message.role === "user" ? "user" : "assistant",
          message.content
        );
      });

      toast("Percakapan dibuka");
    };

    list.appendChild(button);
  });
}

function setMode(mode) {
  currentMode = mode;

  document.querySelectorAll(".top-chip").forEach(button => {
    button.classList.toggle(
      "selected",
      button.textContent.trim().toLowerCase() === mode.toLowerCase()
    );
  });

  toast(mode + " mode dipilih");
}

function toggleSidebar() {
  const sidebar = $("sidebar");
  if (sidebar) sidebar.classList.toggle("open");
}

function closeSidebar() {
  const sidebar = $("sidebar");
  if (sidebar) sidebar.classList.remove("open");
}

function openSettings() {
  const modal = $("settingsModal");
  if (modal) modal.classList.add("open");
}

function closeSettings() {
  const modal = $("settingsModal");
  if (modal) modal.classList.remove("open");
}

function switchPage(page) {
  document.querySelectorAll(".page").forEach(el => {
    el.classList.remove("active");
  });

  const target = $(page + "Page");
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle(
      "active",
      el.dataset.page === page
    );
  });

  closeSidebar();
}

function switchSettingTab(tab) {
  document.querySelectorAll(".setting-tab").forEach(el => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });

  document.querySelectorAll(".setting-panel").forEach(el => {
    el.classList.toggle("active", el.id === tab + "Settings");
  });
}

function handleFile(file) {
  if (!file) return;

  selectedFile = file;
  toast("File dipilih: " + file.name);
}

function changeWallpaper(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  if (file.type.startsWith("image/")) {
    const url = URL.createObjectURL(file);
    document.body.style.setProperty("--wallpaper", `url("${url}")`);
    document.body.classList.add("wallpaper-image");
    toast("Wallpaper berhasil diubah");
  } else {
    toast("Pilih file gambar");
  }
}

function resetWallpaper() {
  document.body.classList.remove("wallpaper-image");
  document.body.style.removeProperty("--wallpaper");
  toast("Wallpaper direset");
}

function clearHistory() {
  if (!confirm("Hapus semua riwayat chat?")) return;

  conversations = [];
  currentMessages = [];
  saveHistory();
  renderHistory();
  showWelcome();
  toast("Riwayat dihapus");
}

function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => toast("Berhasil disalin"))
    .catch(() => toast("Tidak bisa menyalin teks"));
}

function useSuggestion(text) {
  const input = $("messageInput");
  if (!input) return;

  input.value = text;
  sendMessage();
}

document.addEventListener("DOMContentLoaded", () => {
  renderHistory();

  const send = $("sendButton");
  if (send) send.addEventListener("click", sendMessage);

  const input = $("messageInput");

  if (input) {
    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  const fileInput = $("fileInput");

  if (fileInput) {
    fileInput.addEventListener("change", event => {
      handleFile(event.target.files[0]);
    });
  }

  document.querySelectorAll("[data-mode]").forEach(button => {
    button.addEventListener("click", () => {
      setMode(button.dataset.mode);
    });
  });

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      switchPage(button.dataset.page);
    });
  });

  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      switchSettingTab(button.dataset.tab);
    });
  });

  const wallpaperInput = $("wallpaperInput");

  if (wallpaperInput) {
    wallpaperInput.addEventListener("change", event => {
      changeWallpaper(event.target);
    });
  }

  const newChatButton = $("newChatButton");
  if (newChatButton) {
    newChatButton.addEventListener("click", newChat);
  }

  const settingsButton = $("settingsButton");
  if (settingsButton) {
    settingsButton.addEventListener("click", openSettings);
  }

  const closeSettingsButton = $("closeSettings");
  if (closeSettingsButton) {
    closeSettingsButton.addEventListener("click", closeSettings);
  }

  const menuButton = $("menuButton");
  if (menuButton) {
    menuButton.addEventListener("click", toggleSidebar);
  }

  const closeSidebarButton = $("closeSidebar");
  if (closeSidebarButton) {
    closeSidebarButton.addEventListener("click", closeSidebar);
  }

  console.log("VOID AI initialized");
});
