# Lab 5 - Video Submission Script
## 1 Minute Video Guide

**Student:** Harsh Arya  
**Lab:** Interactive Data Visualization with D3.js  
**Time Target:** 55-58 seconds (to stay under 1 minute)

---

## 📋 Video Requirements Checklist

- [ ] Present your visualizations
- [ ] Show you interacting with your visualizations
- [ ] Explain the search + pie click bug
- [ ] Explain which lines of code fix it
- [ ] **Show the fixed interaction (EXTRA CREDIT - 10%)**
- [ ] Share the most interesting thing you learned

---

## 🎬 FULL SCRIPT (Timed)

### **[0:00-0:12] Section 1: Present Visualizations (12 seconds)**

**What to show:** Pan across the page showing all components

**What to say:**
> "Hello! This is my Lab 5 data visualization project. I've created an interactive pie chart that displays my portfolio projects grouped by year. It includes a dynamic legend with project counts, a search bar for filtering, and a responsive project grid below."

**Camera actions:**
- Start at top of page
- Slowly scroll to show: pie chart → legend → search bar → project cards

---

### **[0:12-0:32] Section 2: Interact with Visualizations (20 seconds)**

**What to show:** All interactive features

**What to say:**
> "Let me demonstrate the interactions. When I hover over wedges, the others fade out for emphasis. Clicking on 2024 filters the projects to show only 2024. The search bar works in real-time - typing 'dashboard' filters matching projects. And here's the key feature: I can combine both - searching for 'app' and clicking 2023 shows only 2023 projects containing 'app'."

**Camera actions:**
1. Hover over 2-3 wedges (2 seconds)
2. Click 2024 wedge, show filtered projects (3 seconds)
3. Click again to deselect (2 seconds)
4. Type "dashboard" in search, show results (3 seconds)
5. Clear search (1 second)
6. Type "app" THEN click 2023 wedge (4 seconds)
7. Show both filters working together (3 seconds)
8. Clear to reset (2 seconds)

---

### **[0:32-0:52] Section 3: Explain Bug & The Fix (20 seconds)**

**What to show:** Code editor with `filterAndRenderProjects()` function visible

**What to say:**
> "Originally, you couldn't use search and pie filters together because each event handler only applied its own filter. The search handler at line 161 filtered by query only, and the pie click at line 81 filtered by year only - each overwrote the other. I fixed this by creating a centralized filterAndRenderProjects function that applies BOTH filters sequentially: search filter on lines 126-130, then year filter on lines 133-137. Both handlers now call this same function."

**Camera actions:**
- Show `projects.js` file
- Scroll to line 109: `function filterAndRenderProjects()`
- Highlight lines 126-137 (the two filter blocks)
- Briefly show line 84 and 157 where the function is called

---

### **[0:52-0:58] Section 4: Most Interesting Thing (6 seconds)**

**What to show:** Back to browser showing the working visualization

**What to say:**
> "The most interesting thing I learned was how D3's rollups function aggregates data and how ordinal color scales need fixed domains with sorted values to maintain consistent colors across dynamic filtering."

**Camera actions:**
- Show the full working page with pie chart

---

## 💡 KEY CODE REFERENCES

### **The Bug (Original Problem):**
```javascript
// OLD - Line ~161: Search handler (only filters by query)
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  let filteredProjects = projects.filter(...); // Ignores selectedYear!
  renderProjects(filteredProjects, ...);
});

// OLD - Line ~81: Pie click handler (only filters by year)
.on('click', () => {
  selectedYear = ...; 
  // Filters by year, ignores query!
  renderPieChart(filteredProjects);
});
```

### **The Fix (Lines 109-144):**
```javascript
function filterAndRenderProjects() {
  let filteredProjects = projects;
  
  // Apply search filter (lines 126-130)
  if (query.trim() !== '') {
    filteredProjects = filteredProjects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }
  
  // Apply year filter (lines 133-137)
  if (selectedYear !== null) {
    filteredProjects = filteredProjects.filter((project) => {
      return project.year === selectedYear;
    });
  }
  
  // Render with BOTH filters
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
}

// Both handlers now call this function:
// Line 84: pie click calls filterAndRenderProjects()
// Line 157: search input calls filterAndRenderProjects()
```

---

## 🎥 Recording Tips

### **Setup:**
1. **Close unnecessary tabs/apps** (minimize distractions)
2. **Open these windows:**
   - Browser: `http://localhost:8080/projects/` or GitHub Pages URL
   - VS Code: `projects/projects.js` open at line 109
3. **Set up recording:**
   - Windows: Press **Win + G** (Xbox Game Bar)
   - Or use **OBS Studio** / **Screen Recorder**
4. **Test audio** - speak clearly into microphone

### **Practice:**
- Do a **dry run** first without recording
- **Time yourself** - aim for 55 seconds (buffer for editing)
- Speak at a **steady, confident pace**
- **Breathe** between sections

### **During Recording:**
- Start recording, wait 2 seconds, then begin
- Follow the script naturally (don't read robotically)
- If you make a mistake, pause, then restart that section
- End cleanly - stop talking, wait 2 seconds, stop recording

### **After Recording:**
- Review the video
- Trim any dead space at start/end
- Ensure it's **under 60 seconds**
- Check audio quality

---

## 📤 Submission Checklist

- [ ] Video recorded (under 60 seconds)
- [ ] Video shows all 4 required components
- [ ] Video demonstrates EXTRA CREDIT bug fix
- [ ] GitHub repo link: `https://github.com/orginalbusta/Portfolio`
- [ ] Live website link: `https://orginalbusta.github.io/Portfolio/projects/`
- [ ] Upload video to submission platform

---

## 🌟 Extra Credit Proof

**You've earned the 10% extra credit because:**
1. ✅ You fixed the bug (combined search + pie filtering)
2. ✅ The fix is in your code (lines 109-144 in `projects.js`)
3. ✅ You can demonstrate it working in the video

**Make sure to explicitly show this in your video:**
- Type in search bar: "app"
- Click a pie wedge: 2024
- Show that projects are filtered by BOTH criteria
- Say: "As you can see, both filters work together!"

---

## 🎯 Quick Reference: What Each Line Does

- **Line 29-33:** Extract all unique years for color consistency
- **Line 36:** Create color scale with fixed domain (sorted years)
- **Line 39:** Track selected year (not index!)
- **Line 48:** Sort rolled data to ensure consistent ordering
- **Line 79:** Use year as color key (not index) for consistent colors
- **Line 109-144:** `filterAndRenderProjects()` - combines both filters
- **Line 84:** Pie click handler calls combined filter
- **Line 157:** Search handler calls combined filter

---

## 💪 You Got This!

Your implementation is complete and working perfectly. The video is just about presenting what you've built. Be confident, speak clearly, and show off your work!

**Good luck!** 🚀

