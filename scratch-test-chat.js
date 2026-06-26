async function sendChat(message) {
  try {
    const res = await fetch("http://localhost:3000/api/chatbot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    console.log(`User: "${message}"`);
    console.log(`Bot:  "${data.reply}"`);
    console.log("--------------------------------------------------------------------------------");
  } catch (err) {
    console.error(`Error sending message "${message}":`, err.message);
  }
}

async function main() {
  console.log("=== TESTING BOOKING INTENTS FALLBACK ===\n");
  await sendChat("yes");
  await sendChat("how do I book?");
  await sendChat("sure, please");
}

main();
