// see also
// https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects
// https://gist.github.com/richkuz/e8842fce354edbd4e12dcbfa9ca40ff6
// ProjectV2 is really badly documented

import 'dotenv/config'
import { gql, request } from 'graphql-request'
import fs from 'fs'
import { Parser } from 'json2csv'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'epiverse-connect';

const endpoint = 'https://api.github.com/graphql';

const query = gql`
  {
    organization(login: "${OWNER}") {
      projectV2(number: 1) {
        id
        updatedAt
        items(first: 100) {
          nodes {
            id
            content {
              ... on DraftIssue {
                title
              }
              ... on PullRequest {
                title
                url
              }
              ... on Issue {
                title
                url
              }
            }
            deliverable: fieldValueByName(name:"Deliverable") {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                id
                name
              }
            }
            category: fieldValueByName(name:"Category") {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                id
                name
              }
            }
            status: fieldValueByName(name:"Status") {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                id
                name
              }
            }
            start: fieldValueByName(name:"Start date") {
              __typename
              ... on ProjectV2ItemFieldDateValue {
                id
                date
              }
            }
            end: fieldValueByName(name:"End date") {
              __typename
              ... on ProjectV2ItemFieldDateValue {
                id
                date
              }
            }
          }
        }
      }
    }
}
`

const fetchProjects = async () => {
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
  };

  try {
    const data = await request(endpoint, query, {}, headers);
    return data.organization.projectV2.items;
  } catch (error) {
    console.error(error);
  }
};

const fields = ['deliverable', 'category', 'title', 'url', 'status', 'startDate', 'endDate'];
fetchProjects().then(projects => {
  const opts = { fields };

  const data = projects.nodes.map(project => ({
    deliverable: project.deliverable ? project.deliverable.name : '',
    category: project.category.name,
    title: project.content.title,
    url: project.content.url,
    status: project.status.name,
    startDate: project.start.date,
    endDate: project.end.date,
  }));

  try {
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    fs.writeFileSync('projects.csv', csv);
    console.log('CSV file successfully written');
  } catch (err) {
    // console.error(err);
  }
});