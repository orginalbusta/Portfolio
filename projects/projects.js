// Step 1.3: Import functions from global.js
import { fetchJSON, renderProjects } from '../global.js';

// Determine base path for GitHub Pages vs local
const BASE_PATH = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? ''
  : '/Portfolio';

// Fetch project data from JSON file
const projects = await fetchJSON(`${BASE_PATH}/lib/projects.json`);

// Select the projects container
const projectsContainer = document.querySelector('.projects');

// Render the projects dynamically
renderProjects(projects, projectsContainer, 'h2');

// Step 1.6: Add project count to the page heading
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && projects) {
  projectsTitle.textContent = `Projects (${projects.length})`;
}

