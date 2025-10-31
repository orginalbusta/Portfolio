// Step 1.3: Import functions from global.js
import { fetchJSON, renderProjects } from '../global.js';

// Lab 5: Import D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

// Lab 5 Step 3-4: Create pie chart with actual project data
// Get all unique years from all projects to create a fixed color domain
let allYears = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
).map(([year, count]) => year).sort((a, b) => b - a); // Sort descending: 2025, 2024, 2023...

// Create color scale with FIXED domain using all years
let colors = d3.scaleOrdinal(d3.schemeTableau10).domain(allYears);

// Step 5.2: Track selected year (not index, to avoid issues when data changes)
let selectedYear = null;

// Step 4.4: Refactor pie chart into reusable function
function renderPieChart(projectsGiven) {
  // Step 3.1: Use d3.rollups to group projects by year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  ).sort((a, b) => b[0] - a[0]); // Sort by year descending

  // Convert rolled data to the format we need
  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Create arc generator
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Create slice generator (pie layout) with value accessor
  let sliceGenerator = d3.pie().value((d) => d.value);

  // Generate arc data from our data
  let arcData = sliceGenerator(data);

  // Generate paths for each arc
  let arcs = arcData.map((d) => arcGenerator(d));

  // Clear existing paths and legend items before re-rendering
  let svg = d3.select('svg');
  svg.selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  // Draw the pie chart with click handlers
  arcs.forEach((arc, i) => {
    let currentYear = data[i].label; // Get the actual year value
    let fillColor = colors(currentYear); // Get color for this year
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', fillColor) // Use year as color key, not index!
      .on('click', (event) => {
        // Step 5.2: Toggle selection by year value (not index!)
        selectedYear = selectedYear === currentYear ? null : currentYear;
        
        // Step 5.3 & 5.4: Filter projects by selected year AND search query
        filterAndRenderProjects();
      });
  });

  // Create legend with click handlers
  let legend = d3.select('.legend');
  data.forEach((d, i) => {
    let currentYear = d.label; // Get the actual year value
    legend
      .append('li')
      .attr('style', `--color:${colors(currentYear)}`) // Use year as color key, not index!
      .attr('class', 'legend-item')
      .style('cursor', 'pointer')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        // Same logic as pie wedge click - use year value not index!
        selectedYear = selectedYear === currentYear ? null : currentYear;
        
        filterAndRenderProjects();
      });
  });
}

// Step 5.3 & 5.4: Combined filtering function (EXTRA CREDIT BUG FIX!)
// This function applies BOTH search filter AND year filter together
function filterAndRenderProjects() {
  // Start with all projects
  let filteredProjects = projects;
  
  // Apply search filter if query exists
  if (query.trim() !== '') {
    filteredProjects = filteredProjects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }
  
  // Apply year filter if a wedge is selected (using year value, not index!)
  if (selectedYear !== null) {
    filteredProjects = filteredProjects.filter((project) => {
      return project.year === selectedYear;
    });
  }
  
  // Render the filtered projects in the grid
  renderProjects(filteredProjects, projectsContainer, 'h2');
  
  // Re-render pie chart with the filtered data
  renderPieChart(filteredProjects);
}

// Call this function on page load
renderPieChart(projects);

// Step 4.1-4.3: Add search functionality
let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // Update query value
  query = event.target.value;
  
  // Use the combined filtering function
  filterAndRenderProjects();
});

