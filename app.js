const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const OPAY_ACCOUNT_NAME = process.env.OPAY_ACCOUNT_NAME || "";
const OPAY_ACCOUNT_NUMBER = process.env.OPAY_ACCOUNT_NUMBER || "";

const services = [
  { id: 1, name: "Plumber", price: 15000 },
  { id: 2, name: "Tailor", price: 10000 },
  { id: 3, name: "Electrician", price: 12000 },
  { id: 4, name: "Home Cleaning", price: 8000 }
];

const users = [];
const orders = [];

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);

  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });

  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 1000000) {
        req.destroy();
        reject(new Error("Request too large"));
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function page() {
  const safeServices = JSON.stringify(services);

  return `<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Ibadan Business Hub</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f5f7fb;
  color: #172033;
}

header {
  background: #111827;
  color: white;
  padding: 22px 16px;
  text-align: center;
}

header h1 {
  margin: 0 0 6px;
  font-size: 28px;
}

header p {
  margin: 0;
  color: #d1d5db;
}

.container {
  max-width: 900px;
  margin: auto;
  padding: 18px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin: 16px 0;
  box-shadow: 0 4px 18px rgba(0,0,0,.08);
}

h2 {
  margin-top: 0;
}

input,
select,
button {
  width: 100%;
  padding: 13px;
  margin: 7px 0;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 16px;
}

button {
  background: #111827;
  color: white;
  border: 0;
  cursor: pointer;
  font-weight: bold;
}

button.secondary {
  background: #e5e7eb;
  color: #111827;
}

.service-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.service {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
}

.price {
  font-weight: bold;
  font-size: 19px;
}

.hidden {
  display: none;
}

.payment-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 15px;
  border-radius: 12px;
  margin-top: 10px;
}

.message {
  padding: 12px;
  border-radius: 10px;
  margin-top: 10px;
}

.success {
  background: #dcfce7;
  color: #166534;
}

.error {
  background: #fee2e2;
  color: #991b1b;
}

.small {
  font-size: 13px;
  color: #6b7280;
}

</style>

</head>

<body>

<header>

<h1>Ibadan Business Hub</h1>

<p>Book trusted local services</p>

</header>

<div class="container">

<div class="card">

<h2>Create Account / Login</h2>

<input
id="name"
placeholder="Full name">

<input
id="email"
type="email"
placeholder="Email">

<input
id="password"
type="password"
placeholder="Password">

<button onclick="signup()">
Create Account
</button>

<button
class="secondary"
onclick="login()">
Login
</button>

<div id="authMessage"></div>

</div>


<div class="card">

<h2>Available Services</h2>

<div
id="services"
class="service-grid">
</div>

</div>


<div
class="card"
id="customer">

<h2>Book a Service</h2>

<select id="service">

<option value="">
Select a service
</option>

</select>

<input
id="customerName"
placeholder="Your name">

<input
id="phone"
placeholder="Phone number">

<input
id="address"
placeholder="Service address">

<button onclick="bookService()">
Book Service
</button>

<div id="bookingMessage"></div>

</div>


<div class="card">

<h2>Payment</h2>

<p id="orderText">
Create a booking first.
</p>

<select
id="paymentMethod"
onchange="showPayment()">

<option value="">
Choose payment method
</option>

<option value="bank">
Bank Transfer / OPay
</option>

<option value="opay">
OPay Online
</option>

</select>


<div
id="bankTransfer"
class="payment-box hidden">

<h3>Transfer to OPay</h3>

<p>
<strong>Provider:</strong>
OPay
</p>

<p>
<strong>Account name:</strong>
${OPAY_ACCOUNT_NAME || "Payment account configured by administrator"}
</p>

<p>
<strong>Account number:</strong>
${OPAY_ACCOUNT_NUMBER || "Payment account configured by administrator"}
</p>

<p class="small">
After making the transfer, tap the button below.
This sends a payment notice to the website.
It does not automatically verify the bank transfer.
</p>

<button onclick="paymentMade()">
I Have Made The Transfer
</button>

</div>


<div
id="opayPayment"
class="payment-box hidden">

<h3>OPay Online Payment</h3>

<p>
Online OPay gateway is not connected yet.
</p>

<p class="small">
Use Bank Transfer / OPay above until a
verified payment gateway is connected.
</p>

</div>

<div id="paymentMessage"></div>

</div>

</div>


<script>

let currentOrder = null;

const services = ${safeServices};


function showMessage(id, text, ok) {

  document.getElementById(id).innerHTML =
    '<div class="message ' +
    (ok ? 'success' : 'error') +
    '">' +
    text +
    '</div>';

}


function signup() {

  const name =
    document.getElementById("name")
    .value.trim();

  const email =
    document.getElementById("email")
    .value.trim();

  const password =
    document.getElementById("password")
    .value;

  fetch("/api/signup", {

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

  })

  .then(response => response.json())

  .then(result => {

    showMessage(
      "authMessage",
      result.message,
      result.success
    );

  })

  .catch(() => {

    showMessage(
      "authMessage",
      "Could not connect to the server.",
      false
    );

  });

}


function login() {

  const email =
    document.getElementById("email")
    .value.trim();

  const password =
    document.getElementById("password")
    .value;

  fetch("/api/login", {

    method: "POST",

    headers: {
      "Content-Type":
        "application/json"
    },

    body: JSON.stringify({
      email,
      password
    })

  })

  .then(response => response.json())

  .then(result => {

    showMessage(
      "authMessage",
      result.message,
      result.success
    );

    if (result.success && result.user) {

      document.getElementById(
        "customerName"
      ).value = result.user.name;

    }

  })

  .catch(() => {

    showMessage(
      "authMessage",
      "Could not connect to the server.",
      false
    );

  });

}


function renderServices() {

  const container =
    document.getElementById("services");

  container.innerHTML =
    services.map(service => {

      return (
        '<div class="service">' +

        '<h3>' +
        service.name +
        '</h3>' +

        '<p class="price">₦' +
        service.price.toLocaleString() +
        '</p>' +

        '<button onclick="selectService(' +
        service.id +
        ')">' +

        'Select' +

        '</button>' +

        '</div>'
      );

    }).join("");


  const select =
    document.getElementById("service");


  services.forEach(service => {

    const option =
      document.createElement("option");

    option.value = service.id;

    option.textContent =
      service.name +
      " - ₦" +
      service.price.toLocaleString();

    select.appendChild(option);

  });

}


function selectService(id) {

  document.getElementById(
    "service"
  ).value = id;

  document.getElementById(
    "customer"
  ).scrollIntoView({
    behavior: "smooth"
  });

}


function bookService() {

  const serviceId =
    Number(
      document.getElementById("service")
      .value
    );

  const name =
    document.getElementById(
      "customerName"
    ).value.trim();

  const phone =
    document.getElementById(
      "phone"
    ).value.trim();

  const address =
    document.getElementById(
      "address"
    ).value.trim();


  if (
    !serviceId ||
    !name ||
    !phone ||
    !address
  ) {

    showMessage(
      "bookingMessage",
      "Please complete all booking fields.",
      false
    );

    return;
  }


  fetch("/api/orders", {

    method: "POST",

    headers: {
      "Content-Type":
        "application/json"
    },

    body: JSON.stringify({
      serviceId,
      name,
      phone,
      address
    })

  })

  .then(response => response.json())

  .then(result => {

    if (result.success) {

      currentOrder =
        result.order;

      document.getElementById(
        "orderText"
      ).textContent =
        "Order #" +
        result.order.id +
        " created. Amount: ₦" +
        result.order.amount.toLocaleString();


      showMessage(
        "bookingMessage",
        result.message,
        true
      );

    } else {

      showMessage(
        "bookingMessage",
        result.message,
        false
      );

    }

  })

  .catch(() => {

    showMessage(
      "bookingMessage",
      "Could not create the booking.",
      false
    );

  });

}


function showPayment() {

  const method =
    document.getElementById(
      "paymentMethod"
    ).value;


  document.getElementById(
    "bankTransfer"
  ).classList.add("hidden");


  document.getElementById(
    "opayPayment"
  ).classList.add("hidden");


  if (method === "bank") {

    document.getElementById(
      "bankTransfer"
    ).classList.remove("hidden");

  }


  if (method === "opay") {

    document.getElementById(
      "opayPayment"
    ).classList.remove("hidden");

  }

}


function paymentMade() {

  if (!currentOrder) {

    showMessage(
      "paymentMessage",
      "Please create a booking first.",
      false
    );

    return;
  }


  fetch(
    "/api/payment-notice",
    {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        orderId:
          currentOrder.id
      })

    }
  )

  .then(response =>
    response.json()
  )

  .then(result => {

    showMessage(
      "paymentMessage",
      result.message,
      result.success
    );

  })

  .catch(() => {

    showMessage(
      "paymentMessage",
      "Could not send payment notice.",
      false
    );

  });

}


renderServices();

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

          const body = page();

          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8"
            }
          );

          res.end(body);

          return;
        }


        if (
          req.method === "POST" &&
          req.url === "/api/signup"
        ) {

          const data =
            await readBody(req);

          const name =
            String(data.name || "")
            .trim();

          const email =
            String(data.email || "")
            .trim()
            .toLowerCase();

          const password =
            String(data.password || "");


          if (
            !name ||
            !email ||
            !password
          ) {

            sendJson(
              res,
              400,
              {
                success: false,
                message:
                  "Please fill in all fields."
              }
            );

            return;
          }


          if (
            users.some(
              user =>
                user.email === email
            )
          ) {

            sendJson(
              res,
              400,
              {
                success: false,
                message:
                  "An account with this email already exists."
              }
            );

            return;
          }


          users.push({

            id:
              crypto.randomUUID(),

            name,

            email,

            password:
              hashPassword(password)

          });


          sendJson(
            res,
            201,
            {
              success: true,
              message:
                "Account created successfully."
            }
          );

          return;
        }


        if (
          req.method === "POST" &&
          req.url === "/api/login"
        ) {

          const data =
            await readBody(req);

          const email =
            String(data.email || "")
            .trim()
            .toLowerCase();

          const password =
            String(data.password || "");


          const user =
            users.find(
              item =>
                item.email === email &&
                item.password ===
                  hashPassword(password)
            );


          if (!user) {

            sendJson(
              res,
              401,
              {
                success: false,
                message:
                  "Incorrect email or password."
              }
            );

            return;
          }


          sendJson(
            res,
            200,
            {
              success: true,
              message:
                "Login successful.",

              user: {
                name: user.name,
                email: user.email
              }
            }
          );

          return;
        }


        if (
          req.method === "POST" &&
          req.url === "/api/orders"
        ) {

          const data =
            await readBody(req);


          const service =
            services.find(
              item =>
                item.id ===
                Number(data.serviceId)
            );


          if (!service) {

            sendJson(
              res,
              400,
              {
                success: false,
                message:
                  "Please select a valid service."
              }
            );

            return;
          }


          if (
            !data.name ||
            !data.phone ||
            !data.address
          ) {

            sendJson(
              res,
              400,
              {
                success: false,
                message:
                  "Please complete all booking fields."
              }
            );

            return;
          }


          const order = {

            id:
              crypto.randomUUID(),

            serviceId:
              service.id,

            service:
              service.name,

            amount:
              service.price,

            name:
              String(data.name),

            phone:
              String(data.phone),

            address:
              String(data.address),

            paymentStatus:
              "Pending",

            createdAt:
              new Date().toISOString()

          };


          orders.push(order);


          sendJson(
            res,
            201,
            {
              success: true,
              message:
                "Booking created successfully.",
              order
            }
          );

          return;
        }


        if (
          req.method === "POST" &&
          req.url ===
            "/api/payment-notice"
        ) {

          const data =
            await readBody(req);


          const order =
            orders.find(
              item =>
                item.id ===
                data.orderId
            );


          if (!order) {

            sendJson(
              res,
              404,
              {
                success: false,
                message:
                  "Order not found."
              }
            );

            return;
          }


          order.paymentStatus =
            "Customer reported transfer";


          sendJson(
            res,
            200,
            {
              success: true,
              message:
                "Payment notice received. The transfer still needs to be verified."
            }
          );

          return;
        }


        sendJson(
          res,
          404,
          {
            success: false,
            message:
              "Page not found."
          }
        );

      } catch (error) {

        console.error(error);

        sendJson(
          res,
          500,
          {
            success: false,
            message:
              "Server error."
          }
        );

      }

    }
  );


server.listen(
  PORT,
  () => {
    console.log(
      "Ibadan Business Hub running on port " +
      PORT
    );
  }
);
