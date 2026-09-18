const http = require("http");

const PORT = process.env.PORT || 3000;

const services = [
  {
    id: 1,
    name: "Plumber Service",
    description: "Leak repair • Installation • Pipe fitting",
    rating: "4.8",
    bookings: 120,
    price: 5000
  },
  {
    id: 2,
    name: "Tailor Service",
    description: "Clothing alterations • Custom tailoring • Embroidery",
    rating: "4.6",
    bookings: 95,
    price: 3500
  }
];

const orders = [];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ibadan Mart Pro</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#eee;color:#111}
.phone{max-width:600px;margin:auto;background:#fff;min-height:100vh}
header{background:#111;color:#fff;padding:20px;display:flex;align-items:center;gap:15px;border-bottom:5px solid #28c840}
.logo{width:52px;height:52px;border:4px solid #28c840;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:25px}
h1{font-size:25px;margin:0}
.location{margin:25px;padding:16px;background:#e5f6e8;border:1px solid #73a879;border-radius:15px;font-weight:bold}
main{padding:0 25px 30px}
h2{font-size:28px;margin-bottom:5px}
.sub{margin-top:0;color:#555}
.card{border:2px solid #222;border-radius:18px;padding:20px;margin:20px 0}
.service-icon{width:65px;height:65px;border-radius:50%;background:#32c34a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px}
.card-top{display:flex;gap:18px}
.price{color:#28a745;font-size:28px;font-weight:bold;margin-top:20px}
button{background:#28c840;color:#071108;border:0;border-radius:8px;padding:14px 20px;font-size:16px;font-weight:bold;cursor:pointer}
.pay{background:#111;color:#fff;border-radius:20px;padding:25px;margin-top:25px}
.pay h2{color:#fff;font-size:22px}
.account{background:#222;padding:18px;border-radius:12px;margin-top:15px}
input{width:100%;padding:14px;margin:8px 0;border:1px solid #aaa;border-radius:8px;font-size:16px}
#message{margin-top:15px;color:#28c840;font-weight:bold}
footer{padding:20px;text-align:center;background:#111;color:#aaa}
</style>
</head>
<body>
<div class="phone">

<header>
<div class="logo">🛒</div>
<h1>Ibadan Mart Pro</h1>
</header>

<div class="location">📍 Delivering to: Ibadan, Oyo State • Today</div>

<main>
<h2>Services</h2>
<p class="sub">Book trusted professionals on demand</p>

<div id="services"></div>

<div class="pay">
<h2>Payment Information</h2>
<p>After placing an order, use the account below for payment.</p>
<div class="account">
<strong>OPay</strong><br><br>
Account Name: <strong>Akinremi Taiwo Zaccheaus</strong><br>
Account Number: <strong>9047073591</strong>
</div>
</div>

<div class="pay">
<h2>Place an Order</h2>
<input id="customer" placeholder="Your name">
<input id="phone" placeholder="Your phone number">
<input id="service" placeholder="Service you want">
<button onclick="placeOrder()">Place Order</button>
<div id="message"></div>
</div>

</main>

<footer>
Ibadan Mart Pro © 2026
</footer>

</div>

<script>
async function loadServices(){
  const response = await fetch("/api/services");
  const data = await response.json();

  document.getElementById("services").innerHTML = data.map(s => \`
    <div class="card">
      <div class="card-top">
        <div class="service-icon">\${s.id === 1 ? "🔧" : "🧵"}</div>
        <div>
          <h2 style="font-size:22px;margin:5px 0">\${s.name}</h2>
          <p>\${s.description}</p>
          <p>⭐ \${s.rating} • \${s.bookings}+ bookings</p>
        </div>
      </div>
      <div class="price">₦\${s.price.toLocaleString()}</div>
      <button onclick="selectService('\${s.name}')">+ Add to Cart</button>
    </div>
  \`).join("");
}

function selectService(name){
  document.getElementById("service").value = name;
  document.getElementById("service").scrollIntoView({behavior:"smooth"});
}

async function placeOrder(){
  const customer = document.getElementById("customer").value;
  const phone = document.getElementById("phone").value;
  const service = document.getElementById("service").value;

  if(!customer || !phone || !service){
    document.getElementById("message").textContent =
      "Please fill in all the fields.";
    return;
  }

  const response = await fetch("/api/orders", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({customer,phone,service})
  });

  const result = await response.json();

  document.getElementById("message").textContent =
    "Order received successfully! Order #" + result.id;
}

loadServices();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {

  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, {"Content-Type":"text/html"});
    res.end(html);
    return;
  }

  if (req.url === "/api/services" && req.method === "GET") {
    res.writeHead(200, {"Content-Type":"application/json"});
    res.end(JSON.stringify(services));
    return;
  }

  if (req.url === "/api/orders" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const order = {
          id: orders.length + 1,
          customer: data.customer,
          phone: data.phone,
          service: data.service,
          date: new Date().toISOString()
        };

        orders.push(order);

        res.writeHead(201, {"Content-Type":"application/json"});
        res.end(JSON.stringify(order));

      } catch {
        res.writeHead(400, {"Content-Type":"application/json"});
        res.end(JSON.stringify({error:"Invalid order"}));
      }
    });

    return;
  }

  if (req.url === "/api/orders" && req.method === "GET") {
    res.writeHead(200, {"Content-Type":"application/json"});
    res.end(JSON.stringify(orders));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("Ibadan Mart Pro running on port " + PORT);
});
