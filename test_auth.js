fetch("http://localhost:5001/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "verify3", email: "verify3@test.com", password: "123" })
})
.then(async r => {
  console.log("Status:", r.status);
  console.log("Response:", await r.text());
})
.catch(console.error);
