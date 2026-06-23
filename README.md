# EcoStep (Google Promptwars Submission)

EcoStep is a state-of-the-art, premium Single Page Application (SPA) designed to help individuals understand, track, and reduce their carbon footprint. Developed with high-fidelity visual design (custom dark mode, glowing accents, clean glassmorphic elements) and interactive gamification, it is optimized for high-impact hackathon demos.

## 🚀 Key Features

1. **Interactive Assessment**: A multi-step onboarding wizard to calculate a baseline carbon footprint based on transportation habits, utilities, diet, and consumption level.
2. **Dynamic Gamification (Eco-Tree)**: A level-up system where the user's "Eco Score" increases as they log activities and pledge habits, growing their seedling into a thriving forest!
3. **Pledges & Action Planner**: A rich registry of actions that users can pledge to lower their monthly baseline footprint.
4. **Daily Tracker (Offset Logger)**: Users can log green daily actions (like commuting by bike, eating a vegan meal, taking short showers) to offset their carbon footprint in real-time.
5. **Insights & Analytics (Powered by Chart.js)**: 
   - A doughnut chart showing baseline emission distribution.
   - An interactive line chart tracking progress over time vs the **IPCC 1.5°C climate target**.
   - Personalized smart recommendations based on the user's highest emitting category.
6. **Hackathon Demo Mode**: A 1-click **⚡ Load Demo Data** trigger that instantly seeds a month of historical logs, charts, and active habits to show off the application's full power during judging.

## 🛠️ Technology Stack

- **HTML5**: Semantic tags, clean responsive layout.
- **Vanilla CSS**: Premium dark-mode color scheme, glassmorphic glows, transitions, and hover-triggered micro-animations.
- **Modern ES6 JavaScript**: Reactive DOM manipulation, calculations, local storage caching, and event routing.
- **Chart.js (via CDN)**: High-performance, animated rendering of interactive graphs.

## 📂 Project Structure

- `index.html` - Application structure, forms, and layout shells.
- `styles.css` - Custom styling tokens, layout grids, and visual animations.
- `carbon-data.js` - Database of emission factors, tips, and standard values.
- `app.js` - Logic controller, local storage synchronization, and Chart.js wrappers.

## 💻 How to Run Locally

Since this app is a client-side SPA, you can open it directly in any modern browser!

### Option 1: Direct File Open
Double click the [index.html](file:///g:/promptwar/index.html) file to open it directly in Chrome, Edge, Safari, or Firefox.

### Option 2: Run via Simple Python Server (Recommended for correct routing behavior)
To simulate a real web server environment, run the following in your terminal inside this directory:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.
# GreenDay
