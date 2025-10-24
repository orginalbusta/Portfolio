// Step 2.1: Import required functions from global.js
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Determine base path for GitHub Pages vs local
const BASE_PATH = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? ''
  : '/Portfolio';

// Fetch all project data from JSON file
const projects = await fetchJSON(`${BASE_PATH}/lib/projects.json`);

// Filter to get only the first 3 projects (latest projects)
const latestProjects = projects.slice(0, 3);

// Select the projects container on the home page
const projectsContainer = document.querySelector('.projects');

// Render the latest projects dynamically
renderProjects(latestProjects, projectsContainer, 'h2');

// Step 3: Fetch and display GitHub profile data
const githubData = await fetchGitHubData('orginalbusta');

// Step 4: Target the HTML element for profile stats
const profileStats = document.querySelector('#profile-stats');

// Step 5: Update the HTML with GitHub data
if (profileStats && githubData) {
  profileStats.innerHTML = `
    <dl>
      <dt>Public Repos</dt>
      <dd>${githubData.public_repos}</dd>
      <dt>Public Gists</dt>
      <dd>${githubData.public_gists}</dd>
      <dt>Followers</dt>
      <dd>${githubData.followers}</dd>
      <dt>Following</dt>
      <dd>${githubData.following}</dd>
    </dl>
  `;
}

