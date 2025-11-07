console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 1.2: Fetch JSON data from a URL
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    
    // Check if the fetch request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    // Parse the response into JSON format
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// Step 3.2: Fetch GitHub user data from GitHub API
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

// Step 1.4: Render projects dynamically
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Clear existing content to avoid duplication
  containerElement.innerHTML = '';
  
  // Handle empty projects array
  if (!projects || projects.length === 0) {
    containerElement.innerHTML = '<p>No projects to display at this time.</p>';
    return;
  }
  
  // Loop through each project and create HTML elements
  for (let project of projects) {
    // Create an article element for each project
    const article = document.createElement('article');
    
    // Populate the article with dynamic content using innerHTML
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      ${project.year ? `<p class="year">${project.year}</p>` : ''}
      <img src="${project.image}" alt="${project.title || ''}">
      <p>${project.description || ''}</p>
    `;
    
    // Append the article to the container
    containerElement.appendChild(article);
  }
}

// Step 2: Automatic current page link (COMMENTED OUT - now done in Step 3)
// let navLinks = $$("nav a");
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );
// currentLink?.classList.add('current');

// Step 3: Automatic navigation menu
const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/Portfolio/'; // GitHub Pages repo name

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'meta/', title: 'Meta' },
  { url: 'https://github.com/orginalbusta', title: 'GitHub' }
];

// Create nav element and add it to the body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Loop through pages and create links
for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  // Add BASE_PATH to relative URLs
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }
  
  // Create link element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  // Add current class if this is the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );
  
  // Add target="_blank" for external links
  if (a.host !== location.host) {
    a.target = '_blank';
  }
  
  // Add link to nav
  nav.append(a);
}

// Step 4.2: Add dark mode switcher HTML
const colorSchemeDetected = window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light";

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic (${colorSchemeDetected})</option>
			<option value="light">Light</option>
			<option value="dark">Dark</option>
		</select>
	</label>`
);

// Step 4.4 & 4.5: Make the switcher work and save preference
const select = document.querySelector('.color-scheme select');

// Function to set color scheme (avoids code duplication)
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

// Step 4.5: Load saved preference on page load
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

// Step 4.4: Add event listener to update color scheme
select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  const colorScheme = event.target.value;
  
  // Apply the color scheme
  setColorScheme(colorScheme);
  
  // Step 4.5: Save to localStorage
  localStorage.colorScheme = colorScheme;
});

// Step 5: Better contact form with proper URL encoding
const form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
  // Prevent default form submission
  event.preventDefault();
  
  // Create FormData object from the form
  let data = new FormData(form);
  
  // Start building the mailto URL
  let url = form.action + '?';
  
  // Iterate over form fields and build URL parameters
  let params = [];
  for (let [name, value] of data) {
    console.log(name, encodeURIComponent(value));
    params.push(`${name}=${encodeURIComponent(value)}`);
  }
  
  // Join all parameters with &
  url += params.join('&');
  
  console.log('Final mailto URL:', url);
  
  // Open the mailto link
  location.href = url;
});

