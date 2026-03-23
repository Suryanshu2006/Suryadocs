const fs = require('fs');
fetch("http://localhost:5001/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "verify5", email: "verify5@test.com", password: "123" })
})
.then(async r => {
  const text = await r.text();
  fs.writeFileSync("error.log", text);
  console.log("Wrote to error.log");
})
.catch(e => console.error(e));
