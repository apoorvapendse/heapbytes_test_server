//3600 seconds

let timeForOneRequest = (3600 * 1000) / 500;
let count = 0;
console.log("time interval for every req:", timeForOneRequest);
let interval = setInterval(async () => {
  try {
    console.log("sending request");
    const resp = await fetch("https://secureninja.onrender.com");
    const data = await resp.json();
    console.log(data);
  } catch (err) {
    console.log(err);
  }
  if (count ==500) {
    clearInterval(interval);
  }
  count++;
}, timeForOneRequest);
