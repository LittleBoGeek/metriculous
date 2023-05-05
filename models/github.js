import fetch from "node-fetch";
import { formatDuration, intervalToDuration } from "date-fns";
import { createObjectCsvWriter } from "csv-writer";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const csvWriter = createObjectCsvWriter({
  path: `./Metrics(${new Date().toLocaleDateString().replace(/\//g, "-")}).csv`,
  header: [
    { id: "Type", title: "TYPE" },
    { id: "Title", title: "TITLE" },
    { id: "Duration", title: "DURATION" },
    { id: "Total", title: "TOTAL" },
  ],
});

export async function main() {
  try {
    const issues = await getIssues();
    const [bugs, enhancements, documentation, questions, none] =
      sortPullRequests(issues);
    const mets = [bugs, enhancements, documentation, questions, none].map(
      (list) => getMetrics(list)
    );
    const flattenedLists = [].concat.apply([], mets);
    await csvWriter.writeRecords(flattenedLists).then(() => {
      console.log("CSV created successfully 📊");
    });
  } catch (err) {
    throw err;
  }
}

export async function getIssues(
  repo = "LittleBoGeek/littlebogeek.github.io",
  createdStart = "2019-08-28",
  createdEnd = "2023-03-30"
) {
  try {
    const issues = await fetch("https://api.github.com/graphql", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${process.env.GITHUB_TOKEN} `,
      },
      method: "POST",
      body: JSON.stringify({
        query: `query {
        search(query: "repo:${repo} is:closed created:${createdStart}..${createdEnd}", type: ISSUE, last: 100) {
          issueCount
            edges {
              node {
                ... on PullRequest {
                title
                  mergedAt
                  createdAt   
                  id
                  labels (first: 5){
                    nodes {
                      name
                    }
                  }
                }
              }
            }
          }
      }
        `,
      }),
    });

    const response = await issues.json();
    console.log(
      `✅ Successfully fetched ${response.data.search.issueCount} issues from GitHub`
    );
    return response.data.search.edges;
  } catch (error) {
    console.error(`There was an error fetching issues from GitHub ${error}`);
  }
}

export function sortPullRequests(arr) {
  const bugs = [];
  const enhancements = [];
  const questions = [];
  const documentation = [];
  const none = [];

  arr.forEach((issue) => {
    if (issue.node.labels.nodes.length === 0) {
      none.push(issue);
    } else {
      switch (issue.node.labels.nodes[0].name) {
        case "bug":
          bugs.push(issue);
          return;
        case "enhancement":
          enhancements.push(issue);
        case "documentation":
          documentation.push(issue);
        case "question":
          questions.push(issue);
          return;
        default:
          none.push(issue);
      }
    }
  });

  return [bugs, enhancements, documentation, questions, none];
}

export function getMetrics(list) {
  let total = 0;
  const mets = list.map((item) => {
    const startRange = new Date(item.node.createdAt);
    const endRange = new Date(item.node.mergedAt);

    total += endRange.getTime() - startRange.getTime();

    return {
      Type:
        item.node.labels.nodes.length >= 1
          ? item.node.labels.nodes[0].name
          : "none",
      Title: item.node.title,
      ID: item.node.id,
      Duration: formatDuration(
        intervalToDuration({
          start: startRange,
          end: endRange,
        })
      ),
    };
  });

  mets.forEach((met) => {
    met["Total"] = formatDuration(
      intervalToDuration({
        start: 0,
        end: total,
      })
    );
  });

  return mets;
}
