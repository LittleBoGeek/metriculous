import Fastify from "fastify";

import { getIssues, sortPullRequests, getMetrics } from "./models/github.js";

const fastify = Fastify({ logger: true });

fastify
  .post("/metrics", async (req, rep) => {
    try {
      const issues = await getIssues();

      const [bugs, enhancements, documentation, questions, none] =
        sortPullRequests(issues);

      const mets = [bugs, enhancements, documentation, questions, none].map(
        (list) => getMetrics(list)
      );

      const simplifiedList = [].concat.apply([], mets);

      rep.send({ data: simplifiedList }).status(200);
    } catch (err) {
      rep.send({ message: `There was a problem ${err}` });
    }
  })
  .status(400);

fastify.listen({ port: 3000 }),
  (req, rep) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log("Listening on port 3000");
  };
