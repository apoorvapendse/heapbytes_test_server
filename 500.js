//3600 seconds
const REQUESTSPERHOUR = 500;
let timeForOneRequest = (3600 * 1000) / REQUESTSPERHOUR;
let count = 0;
console.log(`time interval for every req:${timeForOneRequest}ms`);
let interval = setInterval(async () => {
  try {
    console.log("sending request number:", count + 1);
    const resp = await fetch("https://secureninja.onrender.com");
    const data = await resp.json();
    console.log(data);
  } catch (err) {
    console.log(err);
  }
  if (count == REQUESTSPERHOUR) {
    clearInterval(interval);
  }
  count++;
}, timeForOneRequest);
