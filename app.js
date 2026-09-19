const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const OPAY_ACCOUNT_NAME =
  process.env.OPAY_ACCOUNT_NAME || "";

const OPAY_ACCOUNT_NUMBER =
  process.env.OPAY_ACCOUNT_NUMBER || "";

const services = [
  {
    id: 1,
    category: "Plumbing",
    name: "Plumber",
    price: 15000,
    description:
      "Leaks, pipe repairs, installations and plumbing work."
  },
  {
    id: 2,
    category: "Electrical",
    name: "Electrician",
    price: 12000,
    description:
      "Wiring, sockets, lights, switches and electrical repairs."
  },
  {
    id: 3,
    category: "Cleaning",
    name: "Home Cleaning",
    price: 8000,
    description:
      "Home and office cleaning services."
  },
  {
    id: 4,
    category: "Tailoring",
    name: "Tailor",
    price: 10000,
    description:
      "Clothing adjustments, sewing and custom outfits."
  },
  {
    id: 5,
    category: "Painting",
    name: "Painter",
    price: 18000,
    description:
      "Interior and exterior painting services."
  },
  {
    id: 6,
    category: "Carpentry",
    name: "Carpenter",
    price: 15000,
    description:
      "Furniture, doors, shelves and woodwork."
  },
  {
    id: 7,
    category: "Laundry",
    name: "Laundry Service",
    price: 5000,
    description:
      "Washing, ironing and clothing care."
  },
  {
    id: 8,
    category: "Technology",
    name: "Phone & Computer Repair",
    price: 7000,
    description:
      "Device diagnostics, repairs and setup."
  },
  {
    id: 9,
    category: "Beauty",
    name: "Hair & Barbing",
    price: 4000,
    description:
      "Hair styling, barbing and grooming."
  },
  {
    id: 10,
    category: "Catering",
    name: "Catering",
    price: 20000,
    description:
      "Small-event meals and food services."
  },
  {
    id: 11,
    category: "Photography",
    name: "Photography",
    price: 25000,
    description:
      "Event and portrait photography."
  },
  {
    id: 12,
    category: "Auto",
    name: "Auto Mechanic",
    price: 10000,
    description:
      "Vehicle inspection, servicing and repairs."
  },
  {
    id: 13,
    category: "Moving",
    name: "Moving Service",
    price: 20000,
    description:
      "Local moving and transportation assistance."
  },
  {
    id: 14,
    category: "Building",
    name: "Building & Renovation",
    price: 30000,
    description:
      "Masonry, renovation and general building work."
  }
];

const pending = new Map();
const sessions = new Map();
const orders = [];

function json(res, status, data) {
  const output = JSON.stringify(data);

  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(output)
  });

  res.end(output);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", chunk => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function page() {
  const serviceData = JSON.stringify(services);

  return `<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Ibadan Services</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f5f7fb;
  color: #182033;
}

#login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    linear-gradient(
      135deg,
      #111827,
      #334155
    );
}

.login-box {
  width: min(430px, 100%);
  background: white;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 20px 60px #0005;
}

.logo {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: #111827;
  color: white;
  display: grid;
  place-items: center;
  font-size: 25px;
  font-weight: 800;
  margin-bottom: 18px;
}

.login-box h1 {
  margin: 0 0 8px;
}

.muted {
  color: #667085;
}

.field {
  width: 100%;
  padding: 14px;
  border: 1px solid #d9dee8;
  border-radius: 12px;
  margin: 8px 0;
  outline: none;
}

.primary {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  background: #111827;
  color: white;
  font-weight: 700;
  margin-top: 8px;
  border: 0;
}

.note {
  font-size: 12px;
  color: #667085;
  margin-top: 12px;
  line-height: 1.5;
}

.err {
  color: #b42318;
  margin-top: 10px;
}

.ok {
  color: #067647;
  margin-top: 10px;
}

#app {
  display: none;
}

.top {
  background: #111827;
  color: white;
  padding: 18px 20px;
  position: sticky;
  top: 0;
  z-index: 5;
}

.nav {
  max-width: 1100px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav button {
  background: white;
  color: #111827;
  padding: 9px 13px;
  border-radius: 10px;
  border: 0;
}

.wrap {
  max-width: 1100px;
  margin: auto;
  padding: 22px 16px;
}

.hero {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 18px;
}

.search {
  width: 100%;
  padding: 14px;
  border: 1px solid #d9dee8;
  border-radius: 12px;
  margin-top: 14px;
}

.filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0;
}

.chip {
  white-space: nowrap;
  padding: 9px 13px;
  border-radius: 999px;
  background: #e9edf3;
  border: 0;
}

.chip.active {
  background: #111827;
  color: white;
}

.grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.card {
  background: white;
  border: 1px solid #e6e9ef;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 5px 18px #0000000a;
}

.price {
  font-weight: 800;
  font-size: 18px;
  margin: 12px 0;
}

.small {
  font-size: 13px;
  color: #667085;
  line-height: 1.5;
}

.book {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: #111827;
  color: white;
  font-weight: 700;
  border: 0;
}

.modal {
  position: fixed;
  inset: 0;
  background: #0008;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 20;
}

.modal-box {
  background: white;
  border-radius: 20px;
  padding: 22px;
  width: min(480px, 100%);
  max-height: 90vh;
  overflow: auto;
}

.payment {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  padding: 14px;
  margin-top: 12px;
}

.hidden {
  display: none;
}

</style>

</head>

<body>

<section id="login">

<div class="login-box">

<div class="logo">
IB
</div>

<h1>
Ibadan Services
</h1>

<p class="muted">
Sign in to access services, prices and bookings.
</p>

<div id="step1">

<input
id="contact"
class="field"
placeholder="Phone number or email">

<button
class="primary"
onclick="requestCode()">

Continue

</button>

</div>

<div
id="step2"
style="display:none">

<input
id="code"
class="field"
inputmode="numeric"
maxlength="6"
placeholder="6-digit verification code">

<button
class="primary"
onclick="verifyCode()">

Verify & Continue

</button>

<button
class="primary"
style="background:#e9edf3;color:#111827"
onclick="backLogin()">

Back

</button>

</div>

<div id="loginMsg">
</div>

<p class="note">

A real SMS/email provider must be connected
before verification codes can be delivered.

</p>

</div>

</section>

<section id="app">

<div class="top">

<div class="nav">

<strong>
Ibadan Services
</strong>

<button onclick="logout()">
Log out
</button>

</div>

</div>

<div class="wrap">

<div class="hero">

<h1>
Find services in Ibadan
</h1>

<p class="muted">
Browse services and estimated starting prices.
</p>

<input
id="search"
class="search"
placeholder="Search services..."
oninput="render()">

<div
id="filters"
class="filters">
</div>

</div>

<div
id="grid"
class="grid">
</div>

</div>

</section>

<div
id="modal"
class="modal">

<div class="modal-box">

<h2 id="mTitle">
</h2>

<p
id="mDesc"
class="small">
</p>

<p
id="mPrice"
class="price">
</p>

<input
id="cName"
class="field"
placeholder="Your name">

<input
id="cPhone"
class="field"
placeholder="Phone number">

<input
id="cAddress"
class="field"
placeholder="Service address">

<button
class="book"
onclick="book()">

Book service

</button>

<button
class="book"
style="margin-top:8px;background:#e9edf3;color:#111827"
onclick="closeModal()">

Cancel

</button>

<div id="bookMsg">
</div>

<div
id="payment"
class="payment hidden">

<strong>
Payment
</strong>

<p class="small">
Transfer after your booking is created.
</p>

<p>
<b>Provider:</b>
OPay
</p>

<p>
<b>Account name:</b>
${OPAY_ACCOUNT_NAME || "Configured by administrator"}
</p>

<p>
<b>Account number:</b>
${OPAY_ACCOUNT_NUMBER || "Configured by administrator"}
</p>

</div>

</div>

</div>

<script>

const services =
${serviceData};

let token =
localStorage.getItem("ib_token");

let selected = null;

let category = "All";

const categories = [
  "All",
  ...new Set(
    services.map(
      service => service.category
    )
  )
];

function loginMessage(text, success) {

  const element =
    document.getElementById(
      "loginMsg"
    );

  element.className =
    success ? "ok" : "err";

  element.textContent = text;
}

function requestCode() {

  const contact =
    document.getElementById(
      "contact"
    ).value.trim();

  if (!contact) {

    loginMessage(
      "Enter your phone number or email.",
      false
    );

    return;
  }

  fetch(
    "/api/request-code",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        contact
      })
    }
  )

  .then(response =>
    response.json()
  )

  .then(result => {

    if (!result.success) {

      loginMessage(
        result.message,
        false
      );

      return;
    }

    document.getElementById(
      "step1"
    ).style.display = "none";

    document.getElementById(
      "step2"
    ).style.display = "block";

    loginMessage(
      result.message,
      true
    );

  });

}

function verifyCode() {

  const contact =
    document.getElementById(
      "contact"
    ).value.trim();

  const code =
    document.getElementById(
      "code"
    ).value.trim();

  fetch(
    "/api/verify-code",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        contact,
        code
      })
    }
  )

  .then(response =>
    response.json()
  )

  .then(result => {

    if (!result.success) {

      loginMessage(
        result.message,
        false
      );

      return;
    }

    localStorage.setItem(
      "ib_token",
      result.token
    );

    token =
      result.token;

    showApp();

  });

}

function backLogin() {

  document.getElementById(
    "step2"
  ).style.display = "none";

  document.getElementById(
    "step1"
  ).style.display = "block";

  document.getElementById(
    "loginMsg"
  ).textContent = "";

}

function showApp() {

  document.getElementById(
    "login"
  ).style.display = "none";

  document.getElementById(
    "app"
  ).style.display = "block";

  render();

}

function logout() {

  localStorage.removeItem(
    "ib_token"
  );

  location.reload();

}

function render() {

  const filters =
    document.getElementById(
      "filters"
    );

  filters.innerHTML =
    categories.map(
      categoryName => {

        return (
          '<button class="chip ' +
          (categoryName === category
            ? "active"
            : "") +
          '" onclick="setCategory(' +
          JSON.stringify(
            categoryName
          ) +
          ')">' +
          categoryName +
          "</button>"
        );

      }
    ).join("");

  const search =
    document.getElementById(
      "search"
    ).value
    .toLowerCase();

  const list =
    services.filter(service => {

      const matchesCategory =
        category === "All" ||
        service.category ===
          category;

      const text =
        (
          service.name +
          " " +
          service.description
        ).toLowerCase();

      return (
        matchesCategory &&
        text.includes(search)
      );

    });

  document.getElementById(
    "grid"
  ).innerHTML =
    list.map(service => {

      return (
        '<div class="card">' +

        '<div class="small">' +
        service.category +
        "</div>" +

        "<h3>" +
        service.name +
        "</h3>" +

        '<p class="small">' +
        service.description +
        "</p>" +

        '<div class="price">' +
        "From ₦" +
        service.price.toLocaleString() +
        "</div>" +

        '<button class="book" ' +
        'onclick="openBook(' +
        service.id +
        ')">' +

        "Book service" +

        "</button>" +

        "</div>"
      );

    }).join("");

}

function setCategory(value) {

  category = value;

  render();

}

function openBook(id) {

  selected =
    services.find(
      service =>
        service.id === id
    );

  document.getElementById(
    "mTitle"
  ).textContent =
    selected.name;

  document.getElementById(
    "mDesc"
  ).textContent =
    selected.description;

  document.getElementById(
    "mPrice"
  ).textContent =
    "Starting from ₦" +
    selected.price.toLocaleString();

  document.getElementById(
    "modal"
  ).style.display = "flex";

  document.getElementById(
    "payment"
  ).classList.add(
    "hidden"
  );

  document.getElementById(
    "bookMsg"
  ).textContent = "";

}

function closeModal() {

  document.getElementById(
    "modal"
  ).style.display = "none";

}

function book() {

  const name =
    document.getElementById(
      "cName"
    ).value.trim();

  const phone =
    document.getElementById(
      "cPhone"
    ).value.trim();

  const address =
    document.getElementById(
      "cAddress"
    ).value.trim();

  if (
    !name ||
    !phone ||
    !address
  ) {

    document.getElementById(
      "bookMsg"
    ).textContent =
      "Complete your details first.";

    return;
  }

  fetch(
    "/api/orders",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "Authorization":
          "Bearer " + token
      },

      body: JSON.stringify({

        serviceId:
          selected.id,

        name,
        phone,
        address

      })
    }
  )

  .then(response =>
    response.json()
  )

  .then(result => {

    document.getElementById(
      "bookMsg"
    ).textContent =
      result.message;

    if (result.success) {

      document.getElementById(
        "payment"
      ).classList.remove(
        "hidden"
      );

    }

  });

}

if (token) {

  fetch(
    "/api/session",
    {
      headers: {
        "Authorization":
          "Bearer " + token
      }
    }
  )

  .then(response =>
    response.json()
  )

  .then(result => {

    if (result.valid) {

      showApp();

    } else {

      localStorage.removeItem(
        "ib_token"
      );

    }

  });

}

</script>

</body>

</html>`;
}

const server =
  http.createServer(
    async (req, res) => {

      try {

        if (
          req.method === "GET" &&
          req.url === "/"
        ) {

          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8"
            }
          );

          return res.end(
            page()
          );
        }

        if (
          req.method === "POST" &&
          req.url ===
            "/api/request-code"
        ) {

          const data =
            await readBody(req);

          const contact =
            String(
              data.contact || ""
            )
            .trim()
            .toLowerCase();

          if (!contact) {

            return json(
              res,
              400,
              {
                success: false,
                message:
                  "Enter a phone number or email."
              }
            );
          }

          const code =
            String(
              Math.floor(
                100000 +
                Math.random() *
                900000
              )
            );

          pending.set(
            contact,
            {
              code,
              expires:
                Date.now() +
                10 * 60 * 1000
            }
          );

          console.log(
            "Verification code for",
            contact,
            ":",
            code
          );

          return json(
            res,
            200,
            {
              success: true,
              message:
                "Verification code requested."
            }
          );
        }

        if (
          req.method === "POST" &&
          req.url ===
            "/api/verify-code"
        ) {

          const data =
            await readBody(req);

          const contact =
            String(
              data.contact || ""
            )
            .trim()
            .toLowerCase();

          const entry =
            pending.get(
              contact
            );

          if (
            !entry ||
            Date.now() >
              entry.expires ||
            String(
              data.code || ""
            ) !== entry.code
          ) {

            return json(
              res,
              401,
              {
                success: false,
                message:
                  "Invalid or expired verification code."
              }
            );
          }

          const token =
            crypto.randomBytes(
              24
            ).toString("hex");

          sessions.set(
            token,
            {
              contact,
              created:
                Date.now()
            }
          );

          pending.delete(
            contact
          );

          return json(
            res,
            200,
            {
              success: true,
              token
            }
          );
        }

        if (
          req.method === "GET" &&
          req.url ===
            "/api/session"
        ) {

          const token =
            (
              req.headers.authorization ||
              ""
            ).replace(
              "Bearer ",
              ""
            );

          return json(
            res,
            200,
            {
              valid:
                sessions.has(
                  token
                )
            }
          );
        }

        if (
          req.method === "POST" &&
          req.url ===
            "/api/orders"
        ) {

          const token =
            (
              req.headers.authorization ||
              ""
            ).replace(
              "Bearer ",
              ""
            );

          if (
            !sessions.has(
              token
            )
          ) {

            return json(
              res,
              401,
              {
                success: false,
                message:
                  "Please log in first."
              }
            );
          }

          const data =
            await readBody(req);

          const service =
            services.find(
              item =>
                item.id ===
                Number(
                  data.serviceId
                )
            );

          if (!service) {

            return json(
              res,
              400,
              {
                success: false,
                message:
                  "Service not found."
              }
            );
          }

          if (
            !data.name ||
            !data.phone ||
            !data.address
          ) {

            return json(
              res,
              400,
              {
                success: false,
                message:
                  "Complete all booking details."
              }
            );
          }

          const 
