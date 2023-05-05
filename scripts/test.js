import { main } from "../models/github.js";

await main()
  .then(() => {
    console.log("Eureka 🚀");
  })
  .catch((err) => {
    console.error(`Process failed. ${err} 🐛`);
  });
