const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const OPAY_NAME =
  process.env.OPAY_ACCOUNT_NAME || "Akinremi Taiwo Zaccheaus";

const OPAY_NUMBER =
  process.env.OPAY_ACCOUNT_NUMBER || "9047073591";

const users = [];
const orders = [];

const services = [
  { id: 1, name: "Plumber", price: 15000 },
  { id: 2, name: "Tailor", price: 10000 },
  { id: 3, name: "Electrician", price: 12000 },
  { id: 4, name: "Home Cleaning", price: 8000 }
];

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(data));
}

function getBody(req, callback) {
  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      callback(JSON.parse(body));
    } catch {
      callback(null);
    }
  });
}

function page() {
  return `
<!DOCTYPE html>
<html>
<head>

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Ibadan Business</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f4f6f8;
  color: #222;
}

header {
  background: #111827;
  color: white;
  padding: 25px 15px;
  text-align: center;
}

.container {
  max-width: 850px;
  margin: auto;
  padding: 20px;
}

.card {
  background: white;
  padding: 20px;
  margin: 15px 0;
  border-radius: 14px;
  box-shadow: 0 3px 12px #0001;
}

input,
select {
  width: 100%;
  padding: 13px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
}

button {
  border: none;
  border-radius: 8px;
  padding: 13px 18px;
  background: #111827;
  color: white;
  cursor: pointer;
}

button:hover {
  opacity: .9;
}

.green {
  background: #16803c;
}

.hidden {
  display: none;
}

.service {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  margin: 10px 0;
}

.price {
  font-size: 20px;
  font-weight: bold;
}

.payment-option {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 18px;
  margin: 10px 0;
  cursor: pointer;
}

.payment-option:hover {
  background: #f3f4f6;
}

.transfer {
  background: #f3f4f6;
  padding: 18px;
  border-radius: 10px;
  margin-top: 15px;
}

.amount {
  font-size: 25px;
  font-weight: bold;
}

.success {
  background: #dcfce7;
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
}

</style>

</head>

<body>


<!-- LOGIN PAGE -->

<div id="loginPage" class="container">

  <div class="card">

    <h1>Ibadan Business</h1>

    <h2>Login</h2>

    <input
      id="loginEmail"
      type="email"
      placeholder="Email"
    >

    <input
      id="loginPassword"
      type="password"
      placeholder="Password"
    >

    <button onclick="login()">
      Login
    </button>

    <p id="loginMessage"></p>

    <hr>

    <h2>Create Account</h2>

    <input
      id="signupName"
      placeholder="Full name"
    >

    <input
      id="signupEmail"
      type="email"
      placeholder="Email"
    >

    <input
      id="signupPassword"
      type="password"
      placeholder="Password"
    >

    <button onclick="signup()">
      Create Account
    </button>

    <p id="signupMessage"></p>

  </div>

</div>


<!-- WEBSITE -->

<div id="website" class="hidden">

<header>

  <h1>Ibadan Business</h1>

  <p>Professional services at your convenience</p>

  <button onclick="logout()">
    Logout
  </button>

</header>


<div class="container">


  <!-- SERVICES -->

  <div class="card">

    <h2>Our Services</h2>

    <div id="services"></div>

  </div>


  <!-- BOOKING -->

  <div class="card">

    <h2>Book a Service</h2>

    <input
      id="customer"
      placeholder="Your name"
    >

    <input
      id="phone"
      placeholder="Phone number"
    >

    <select id="service">

      ${services.map(service => `
        <option value="${service.id}">
          ${service.name} - ₦${service.price.toLocaleString()}
        </option>
      `).join("")}

    </select>

    <button onclick="bookService()">
      Book Service
    </button>

    <p id="message"></p>

  </div>


  <!-- PAYMENT -->

  <div
    id="paymentSection"
    class="card hidden"
  >

    <h2>Complete Your Payment</h2>

    <p>Your total is:</p>

    <p
      id="paymentAmount"
      class="amount"
    ></p>


    <h3>Choose Payment Method</h3>


    <div
      class="payment-option"
      onclick="showBankTransfer()"
    >

      <b>🏦 Bank Transfer</b>

      <br>

      Pay by transferring the exact amount.

    </div>


    <div
      class="payment-option"
      onclick="showOpay()"
    >

      <b>📱 OPay</b>

      <br>

      Continue with OPay.

    </div>


    <!-- BANK TRANSFER -->

    <div
      id="bankTransfer"
      class="hidden"
    >

      <div class="transfer">

        <h3>Bank Transfer</h3>

        <p>
          Transfer the exact amount to:
        </p>

        <p>
          <b>Provider:</b> OPay
        </p>

        <p>
          <b>Account Name:</b>
          ${OPAY_NAME}
        </p>

        <p>
          <b>Account Number:</b>
          ${OPAY_NUMBER}
        </p>

        <button
          class="green"
          onclick="paymentMade()"
        >
          I Have Made The Transfer
        </button>

      </div>

    </div>


    <!-- OPAY -->

    <div
      id="opayPayment"
      class="hidden"
    >

      <div class="transfer">

        <h3>OPay Payment</h3>

        <p>
          Amount:
        </p>

        <p
          id="opayAmount"
          class="amount"
        ></p>

        <p>
          OPay online payment integration
          can be connected here.
        </p>

        <button
          class="green"
          onclick="paymentMade()"
        >
          Continue
        </button>

      </div>

    </div>


    <div id="paymentMessage"></div>

  </div>

</div>

</div>


<script>

let loggedIn = false;
let currentOrder = null;


/* CREATE ACCOUNT */

async function signup() {

  const name =
    document.getElementById("signupName")
      .value.trim();

  const email =
    document.getElementById("signupEmail")
      .value.trim();

  const password =
    document.getElementById("signupPassword")
      .value;

  if (!name || !email || !password) {

    document.getElementById("signupMessage")
      .textContent =
      "Please fill in all fields.";

    return;
  }

  const response =
    await fetch("/api/signup", {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        name,
        email,
        password
      })

    });

  const result =
    await response.json();

  document.getElementById("signupMessage")
    .textContent =
    result.message;
}


/* LOGIN */

async function login() {

  const email =
    document.getElementById("loginEmail")
      .value.trim();

  const password =
    document.getElementById("loginPassword")
      .value;

  const response =
    await fetch("/api/login", {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })

    });

  const result =
    await response.json();

  if (result.success) {

    loggedIn = true;

    document.getElementById("loginPage")
      .classList.add("hidden");

    document.getElementById("website")
      .classList.remove("hidden");

    document.getElementById("customer")
      .value = result.name;

  } else {

    document.getElementById("loginMessage")
      .textContent =
      result.message;

  }
}


/* LOGOUT */

function logout() {

  loggedIn = false;

  document.getElementById("website")
    .classList.add("hidden");

  document.getElementById("loginPage")
    .classList.remove("hidden");
}


/* BOOK SERVICE */

async function bookService() {

  const customer =
    document.getElementById("customer")
      .value.trim();

  const phone =
    document.getElementById("phone")
      .value.trim();

  const serviceId =
    Number(
      document.getElementById("service")
        .value
    );

  if (!customer || !phone) {

    document.getElementById("message")
      .textContent =
      "Please enter your name and phone number.";

    return;
  }

  const response =
    await fetch("/api/orders", {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        customer,
        phone,
        serviceId
      })

    });

  const result =
    await response.json();

  if (!result.success) {

    document.getElementById("message")
      .textContent =
      result.message;

    return;
  }

  currentOrder =
    result.order;

  document.getElementById("message")
    .textContent =
    "Booking created successfully.";

  document.getElementById("paymentSection")
    .classList.remove("hidden");

  document.getElementById("paymentAmount")
    .textContent =
    "₦" +
    result.order.price.toLocaleString();

  document.getElementById("opayAmount")
    .textContent =
    "₦" +
    result.order.price.toLocaleString();

  document.getElementById("paymentSection")
    .scrollIntoView({
      behavior: "smooth"
    });
}


/* PAYMENT OPTIONS */

function showBankTransfer() {

  document.getElementById("bankTransfer")
    .classList.remove("hidden");

  document.getElementById("opayPayment")
    .classList.add("hidden");
}


function showOpay() {

  document.getElementById("opayPayment")
    .classList.remove("hidden");

  document.getElementById("bankTransfer")
    .classList.add("hidden");
}


/* PAYMENT NOTICE */

async function paymentMade() {

  if (!currentOrder) {
    return;
  }

  const response =
    await fetch("/api/payment-notice", {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        orderId:
          currentOrder.id
      })

    });

  const result =
    await response.json();

  document.getElementById("paymentMessage")
    .innerHTML =
    '<div class="success">' +
    result.message +
    '</div>';
}


/* SERVICES */

const services =
  ${JSON.stringify(services)};

document.getElementById("services")
  .innerHTML =

  services.map(service => `

    <div class="service">

      <h3>
        \${service.name}
      </h3>

      <p class="price">
        ₦\${service.price.toLocaleString()}
      </p>

      <button
        onclick="selectService(\${service.id})"
      >
        Select
      </button>

    </div>

  `).join("");


function selectService(id) {

  document.getElementById("service")
    .value = id;

  document.getElementById("customer")
    .scrollIntoView({
      behavior: "smooth"
    });
}

</script>

</body>
</html>
`;
}


/* SERVER */

const server =
  http.createServer((req, res) => {


  /* HOME */

  if (
    req.method === "GET" &&
    req.url === "/"
  ) {

    res.writeHead(200, {
      "Content-Type":
        "text/html"
    });

    res.end(page());

    return;
  }


  /* SIGN UP */

  if (
    req.method === "POST" &&
    req.url === "/api/signup"
  ) {

    getBody(req, data => {

      if (
        !data ||
        !data.name ||
        !data.email ||
        !data.password
      ) {

        sendJSON(res, 400, {
          message:
            "Please fill in all fields."
        });

        return;
      }


      const email =
        data.email.toLowerCase();


      if (
        users.some(
          user =>
            user.email === email
        )
      ) {

        sendJSON(res, 400, {
          message:
            "An account with this email already exists."
        });

        return;
      }


      users.push({

        name:
          data.name,

        email:
          email,

        password:
          hashPassword(data.password)

      });


      sendJSON(res, 200, {

        message:
          "Account created! You can now log in."

      });

    });

    return;
  }


  /* LOGIN */

  if (
    req.method === "POST" &&
    req.url === "/api/login"
  ) {

    getBody(req, data => {

      if (!data) {

        sendJSON(res, 400, {
          success: false,
          message:
            "Invalid request."
        });

        return;
      }


      const email =
        String(
          data.email || ""
        ).toLowerCase();


      const user =
        users.find(
          user =>
            user.email === email &&
            user.password ===
            hashPassword(
              data.password || ""
            )
        );


      if (!user) {

        sendJSON(res, 401, {

          success: false,

          message:
            "Incorrect email or password."

        });

        return;
      }


      sendJSON(res, 200, {

        success: true,

        name:
          user.name

      });

    });

    return;
  }


  /* ORDERS */

  if (
    req.method === "POST" &&
    req.url === "/api/orders"
  ) {

    getBody(req, data => {

      if (!data) {

        sendJSON(res, 400, {

          success: false,

          message:
            "Invalid request."

        });

        return;
      }


      const service =
        services.find(
          service =>
            service.id ===
            Number(data.serviceId)
        );


      if (!service) {

        sendJSON(res, 400, {

          success: false,

          message:
            "Invalid service."

        });

        return;
      }


      const order = {

        id:
          orders.length + 1,

        customer:
          data.customer,

        phone:
          data.phone,

        service:
          service.name,

        price:
          service.price,

        paymentNotice:
          false,

        date:
          new Date().toISOString()

      };


      orders.push(order);


      sendJSON(res, 200, {

        success: true,

        order:
          order

      });

    });

    return;
  }


  /* PAYMENT NOTICE */

  if (
    req.method === "POST" &&
    req.url === "/api/payment-notice"
  ) {

    getBody(req, data => {

      if (!data) {

        sendJSON(res, 400, {

          message:
            "Invalid request."

        });

        return;
      }


      const order =
        orders.find(
          order =>
            order.id ===
            Number(data.orderId)
        );


      if (!order) {

        sendJSON(res, 404, {

          message:
            "Order not found."

        });

        return;
      }


      order.paymentNotice = true;


      sendJSON(res, 200, {

        message:
          "Payment notice received. Your payment will be verified before the order is confirmed."

      });

    });

    return;
  }


  res.writeHead(404);

  res.end("Page not found");

});


server.listen(PORT, () => {

  console.log(
    "Server running on port " +
    PORT
  );

});app.js
