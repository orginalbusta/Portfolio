// Lab 6 & 8: Data Analysis, Visualization, and Animation
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

// Step 1.1: Load CSV data with type conversion
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  
  return data;
}

// Step 1.2: Process commits data
function processCommits(data) {
  const commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/orginalbusta/Portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      // Hide the lines array from enumeration
      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: false,
        writable: false,
        enumerable: false,
      });

      return ret;
    });

  // Ensure commits are sorted chronologically for scrollytelling
  return d3.sort(commits, (d) => d.datetime);
}

// Step 1.3: Render commit info and stats
function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
  // Total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);
  
  // Total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);
  
  // Number of files
  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);
  
  // Average file length (grouped aggregate)
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file,
  );
  const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').text('Average file length');
  dl.append('dd').text(Math.round(averageFileLength) + ' lines');
  
  // Longest file (min/max value)
  const longestFile = d3.greatest(fileLengths, (d) => d[1]);
  dl.append('dt').text('Longest file');
  dl.append('dd').html(`<code>${longestFile[0]}</code> (${longestFile[1]} lines)`);
  
  // Average line length
  const avgLineLength = d3.mean(data, d => d.length);
  dl.append('dt').text('Average line length');
  dl.append('dd').text(Math.round(avgLineLength) + ' characters');
  
  // Longest line
  const longestLine = d3.greatest(data, d => d.length);
  dl.append('dt').text('Longest line');
  dl.append('dd').text(longestLine.length + ' characters');
  
  // Maximum depth
  const maxDepth = d3.max(data, d => d.depth);
  dl.append('dt').text('Maximum indentation');
  dl.append('dd').text(maxDepth + ' levels');
  
  // Time of day most work is done
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Most productive time');
  dl.append('dd').text(maxPeriod || 'N/A');
  
  // Day of week most work is done
  const workByDay = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleDateString('en', { weekday: 'long' }),
  );
  const maxDay = d3.greatest(workByDay, (d) => d[1])?.[0];
  dl.append('dt').text('Most productive day');
  dl.append('dd').text(maxDay || 'N/A');
}

// Step 3: Tooltip functions
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');
  
  if (Object.keys(commit).length === 0) return;
  
  link.href = commit.url;
  link.textContent = commit.id;
  
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  
  time.textContent = commit.datetime?.toLocaleString('en', {
    timeStyle: 'short',
  });
  
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// Step 5 & Lab 8: Global state for brushing, filtering, and animation
let xScale, yScale, commitsData;
let data, commits;

// Slider and filtering state for scatter plot
let commitProgress = 100;
let timeScale;
let commitMaxTime;
let filteredCommits;

// Slider and filtering state for file visualization
let fileProgress = 100;
let fileMaxTime;
let filteredCommitsForFiles;

let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Step 2: Visualizing commits in a scatterplot
function renderScatterPlot(data, commits) {
  // Store commits for brushing
  commitsData = commits;
  
  // Step 2.1: Set up dimensions and SVG
  const width = 1000;
  const height = 600;
  
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
  
  // Step 2.2: Define margins and usable area
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Step 2.1: Create scales (now stored globally for brushing)
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();
  
  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);
  
  // Step 2.3: Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  
  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );
  
  // Step 2.2: Create and add axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
  
  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);
  
  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);
  
  // Step 4: Create radius scale for dot size
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  
  // Step 4.2: Use sqrt scale for proper area perception
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);
  
  // Step 4.3: Sort commits by size (descending) for better interaction
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  
  // Step 2.1: Draw the dots
  const dots = svg.append('g').attr('class', 'dots');
  
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .style('--r', (d) => rScale(d.totalLines))
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
  
  // Step 5.1-5.2: Set up brush with proper extent
  svg.call(
    d3.brush()
      .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
      .on('start brush end', brushed)
  );
  
  // Raise dots and everything after overlay to restore tooltips
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// Lab 8 Step 1.2 & 1.3: Update scatter plot when filtering by time
function updateScatterPlot(data, commits) {
  // Keep brushed data in sync with the currently displayed commits
  commitsData = commits;

  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  if (commits.length === 0 || svg.empty()) {
    return;
  }

  // Update x-scale domain to match filtered commits
  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // Clear and redraw x-axis
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .style('--r', (d) => rScale(d.totalLines))
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// Step 5.4: Check if commit is within brush selection
function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

// Step 5.4: Handle brush events
function brushed(event) {
  const selection = event.selection;
  
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

// Step 5.5: Show count of selected commits
function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commitsData.filter((d) => isCommitSelected(selection, d))
    : [];
  
  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;
  
  return selectedCommits;
}

// Step 5.6: Show language breakdown
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commitsData.filter((d) => isCommitSelected(selection, d))
    : [];
  
  const container = document.getElementById('language-breakdown');
  
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const requiredCommits = selectedCommits.length ? selectedCommits : commitsData;
  const lines = requiredCommits.flatMap((d) => d.lines);
  
  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );
  
  // Update DOM with breakdown
  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

// Lab 8 Step 2: File unit visualization
function updateFileDisplay(filteredCommits) {
  const lines = filteredCommits.flatMap((d) => d.lines);

  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append('div').call((div) => {
        div.append('dt').append('code');
        div.append('dd');
      }),
    );

  filesContainer
    .select('dt > code')
    .html((d) => `${d.name}<small>${d.lines.length} lines</small>`);

  // Append one div for each line
  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('--color', (d) => colors(d.type));
}

// Lab 8 Step 1.1 & 1.2: Time slider behavior (scatter plot)
function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeElement = document.getElementById('commit-time');

  if (!slider || !timeElement || !timeScale || !commits) return;

  commitProgress = Number(slider.value);
  commitMaxTime = timeScale.invert(commitProgress);

  timeElement.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
}

// Separate slider behavior for file size visualization
function onFileSliderChange() {
  const slider = document.getElementById('file-progress');
  const timeElement = document.getElementById('file-time');

  if (!slider || !timeElement || !timeScale || !commits) return;

  fileProgress = Number(slider.value);
  fileMaxTime = timeScale.invert(fileProgress);

  timeElement.textContent = fileMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  filteredCommitsForFiles = commits.filter((d) => d.datetime <= fileMaxTime);

  updateFileDisplay(filteredCommitsForFiles);
}

// Lab 8 Step 3: Scrollytelling callbacks
function onStepEnter(response) {
  const commit = response.element.__data__;
  if (!commit || !timeScale) return;

  // Update slider to match the commit we scrolled to
  const slider = document.getElementById('commit-progress');
  const timeElement = document.getElementById('commit-time');

  commitMaxTime = commit.datetime;
  commitProgress = timeScale(commit.datetime);

  if (slider) {
    slider.value = commitProgress;
  }

  if (timeElement) {
    timeElement.textContent = commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
}

// Main execution
data = await loadData();
commits = processCommits(data);

console.log('Loaded data:', data.length, 'lines');
console.log('Processed commits:', commits.length, 'commits');
console.log('Sample commit:', commits[0]);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

// Initialize time scale and slider UI
timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

filteredCommits = commits;
commitMaxTime = timeScale.invert(commitProgress);

const commitSlider = document.getElementById('commit-progress');
if (commitSlider) {
  commitSlider.addEventListener('input', onTimeSliderChange);
}

// Initialize scatter slider display
onTimeSliderChange();

// Initialize file slider and visualization
const fileSlider = document.getElementById('file-progress');
if (fileSlider) {
  fileSlider.addEventListener('input', onFileSliderChange);
}
onFileSliderChange();

// Lab 8 Step 3.2: Generate commit narrative text
d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
      <p>
        On ${d.datetime.toLocaleString('en', {
          dateStyle: 'full',
          timeStyle: 'short',
        })},
        I made
        <a href="${d.url}" target="_blank">
          ${
            i > 0
              ? 'another glorious commit'
              : 'my first commit, and it was glorious'
          }
        </a>.
        I edited ${d.totalLines} lines across ${
          d3.rollups(
            d.lines,
            (D) => D.length,
            (d) => d.file,
          ).length
        } files.
        Then I looked over all I had made, and I saw that it was very good.
      </p>
    `,
  );

// Lab 8 Step 3.3: Set up Scrollama scrollytelling
const scroller = scrollama();

scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);

