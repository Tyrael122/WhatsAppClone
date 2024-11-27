import { WebSocketClient } from "./wsEventHandler.js";

function getUserNumberFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("userNumber");
}

export const userNumber = getUserNumberFromURL();

const socket = new WebSocketClient();

export function obtainInputMessage() {
  const messageInput = document.getElementById("messageInput");
  return messageInput.value.trim();
}

// Function to handle sending a message
export function addSentMessageToPage(messageText) {
  if (messageText !== "") {
    const messageContainer = document.getElementById("messages");

    // Create a new div for the sent message
    const sentMessage = document.createElement("div");
    sentMessage.classList.add("message", "sent");
    sentMessage.innerHTML = `<span>${messageText}</span>`;

    // Append the new message to the messages container
    messageContainer.appendChild(sentMessage);

    // Scroll to the bottom of the messages container
    messageContainer.scrollTop = messageContainer.scrollHeight;

    // Clear the input field after sending the message
    document.getElementById("messageInput").value = "";
  }
}

// Function to handle receiving a message
export function addReceivedMessageToPage(messageText) {
  if (messageText !== "") {
    const messageContainer = document.getElementById("messages");

    // Create a new div for the received message
    const receivedMessage = document.createElement("div");
    receivedMessage.classList.add("message", "received");
    receivedMessage.innerHTML = `<span>${messageText}</span>`;

    // Append the new message to the messages container
    messageContainer.appendChild(receivedMessage);

    // Scroll to the bottom of the messages container
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
}

// Function to handle contact click and reset chat
function handleContactClick(event) {
  // Find the parent div of the clicked element to get the correct data-contact
  const contactDiv = event.target.closest(".contact");
  const contactNumber = contactDiv
    ? contactDiv.getAttribute("data-contact")
    : null;

  if (contactNumber) {
    // Update the chat header with the selected contact's number
    const chatHeader = document.getElementById("chatHeader");
    chatHeader.textContent = contactNumber;

    // Clear the current messages
    const messagesContainer = document.getElementById("messages");
    messagesContainer.innerHTML = ""; // Clear the messages div

    socket.handleCurrentOutgoingContactChanged(contactNumber);
  }
}

export function clearAllContacts() {
  const contactsContainer = document.querySelector('.contacts');
  
  if (contactsContainer) {
    // Clear all content except the header
    const header = contactsContainer.querySelector('.header');
    contactsContainer.innerHTML = '';
    if (header) {
      contactsContainer.appendChild(header);
    }
  }  
}

// Function to add a new contact
export function addContact(phoneNumber) {
  // Select the contacts container
  const contactsDiv = document.querySelector(".contacts");

  // Create a new contact div
  const contactDiv = document.createElement("div");
  contactDiv.classList.add("contact");
  contactDiv.setAttribute("data-contact", phoneNumber);

  // Create a span element for the contact number
  const contactSpan = document.createElement("span");
  contactSpan.textContent = phoneNumber;

  // Append the span to the contact div
  contactDiv.appendChild(contactSpan);

  // Add a click event listener to the contact div
  contactDiv.addEventListener("click", handleContactClick);

  // Append the new contact to the contacts container
  contactsDiv.appendChild(contactDiv);
}

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("sendBtn")
    .addEventListener("click", socket.sendMessage);

  const messageInput = document.getElementById("messageInput");

  // Event listener for the "Enter" key in the message input field
  messageInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevents the default behavior of adding a new line
      socket.sendMessage();
    }
  });
});
