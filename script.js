const SUPABASE_URL = "https://ulndueveyrqackqnnimw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmR1ZXZleXJxYWNrcW5uaW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjYzNjUsImV4cCI6MjEwODQ0MjM2NX0.bbqrQDJz-DE797e1pMjsOBQfZfa7WL59tEDigAKGkKU";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let dramas = [];
let loggedIn = false;
let currentPage = "home";

async function loadDramas() {
  const { data, error } = await db.from("dramas").select("*");

  if (error) {
    alert("Could not load: " + error.message);
    return;
  }

  dramas = data;
  renderAll();
}

function posterHtml(drama) {
  if (!drama.poster) {
    return `<div class="poster poster-empty" data-id="${drama.id}">${drama.title.charAt(0).toUpperCase()}</div>`;
  }

  return `<img class="poster" data-id="${drama.id}" src="${drama.poster}" alt="${drama.title}">`;
}

function makeCard(drama) {
  let adminHTML = "";

  if (loggedIn) {
    adminHTML = `
      <div class="admin">
        <select class="status-select" data-id="${drama.id}">
          <option value="finished" ${drama.status === "finished" ? "selected" : ""}>Finished</option>
          <option value="ongoing" ${drama.status === "ongoing" ? "selected" : ""}>On Going</option>
          <option value="towatch" ${drama.status === "towatch" ? "selected" : ""}>To Watch</option>
        </select>
        <button class="delete-btn" data-id="${drama.id}">Delete</button>
        <button class="edit-btn" data-id="${drama.id}">Edit</button>
      </div>
    `;
  }

  return `
    <div class="card">
      ${posterHtml(drama)}
      <h2>${drama.title} (${drama.year})</h2>
      <p class="stars">${"★".repeat(drama.rating)}</p>
      <p>${drama.genres}</p>
      <p>Episodes: ${drama.episodes}</p>
      <details>
        <summary>My Review</summary>
        <p>${drama.review}</p>
      </details>
      ${adminHTML}
    </div>
  `;
}

const row = document.querySelector("#home-row");

const genreList = ["Romance", "Comedy", "Thriller", "Action"];
const countryList = ["Korean", "Japanese", "Chinese", "Thai", "Filipino", "Anime", "English"];

function renderByGenre(containerId, status) {
  const container = document.querySelector("#" + containerId);
  container.innerHTML = "";

  genreList.forEach(function (genre) {
    let html = "";

    countryList.forEach(function (country) {
      const matches = dramas.filter(function (drama) {
        return drama.status === status &&
          drama.genres.includes(genre) &&
          drama.country === country;
      });

      if (matches.length === 0) return;

      html += `<h3>${country}</h3><div class="row">`;
      matches.forEach(function (drama) {
        html += makeCard(drama);
      });
      html += `</div>`;
    });

    if (html === "") return;

    container.innerHTML += `<section class="genre"><h1>${genre}</h1>${html}</section>`;
  });
}

function renderAll() {
  row.innerHTML = "";

  dramas.forEach(function (drama) {
    row.innerHTML += makeCard(drama);
  });

  renderByGenre("finished-list", "finished");
  renderByGenre("ongoing-list", "ongoing");
  renderByGenre("towatch-list", "towatch");
}

const links = document.querySelectorAll(".sidebar a");
const pages = document.querySelectorAll(".page");
const addLink = document.querySelector("#add-link");
const loginLink = document.querySelector("#login-link");

function showPage(id) {
  if (id !== "detail") currentPage = id;

  pages.forEach(function (page) {
    page.hidden = true;
  });
  document.querySelector("#" + id).hidden = false;
}

function showLoggedIn(isLoggedIn) {
  loggedIn = isLoggedIn;
  addLink.hidden = !isLoggedIn;
  loginLink.textContent = isLoggedIn ? "Log out" : "Login";
  renderAll();
}

links.forEach(function (link) {
  link.addEventListener("click", function (event) {
    event.preventDefault();

    if (link.id === "login-link" && loggedIn) {
      db.auth.signOut();
      showLoggedIn(false);
      showPage("home");
      return;
    }

    if (link.dataset.page === "add") {
      editingId = null;
      addForm.reset();
    }
    
    if (!link.dataset.page) return;
    showPage(link.dataset.page);
  });
});

const searchBox = document.querySelector(".search");

searchBox.addEventListener("input", function () {
  const text = searchBox.value.toLowerCase();

  row.innerHTML = "";

  dramas
    .filter(function (drama) {
      return drama.title.toLowerCase().includes(text) ||
        drama.genres.toLowerCase().includes(text);
    })
    .forEach(function (drama) {
      row.innerHTML += makeCard(drama);
    });
});

const addForm = document.querySelector("#add-form");

addForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const newDrama = {
    title: document.querySelector("#f-title").value,
    poster: document.querySelector("#f-poster").value.trim(),
    year: Number(document.querySelector("#f-year").value),
    episodes: Number(document.querySelector("#f-episodes").value),
    genres: document.querySelector("#f-genres").value,
    country: document.querySelector("#f-country").value,
    status: document.querySelector("#f-status").value,
    rating: Number(document.querySelector("#f-rating").value),
    review: document.querySelector("#f-review").value,
    cast_list: document.querySelector("#f-cast").value
  };
  
  let result;
  if (editingId === null) {
    result = await db.from("dramas").insert(newDrama);
  }
  else {
    result = await db.from("dramas").update(newDrama).eq("id", editingId);
  }
  const error = result;

  if (error) {
    alert("Could not add: " + error.message);
    return;
  }

  await loadDramas();
  addForm.reset();
  editingId = null;
  showPage("home");
});

const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.querySelector("#l-email").value;
  const password = document.querySelector("#l-password").value;

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    loginMessage.textContent = "Login failed: " + error.message;
    return;
  }

  loginForm.reset();
  loginMessage.textContent = "";
  showLoggedIn(true);
  showPage("home");
});

async function checkSession() {
  const { data } = await db.auth.getSession();
  showLoggedIn(data.session !== null);
}

document.addEventListener("click", async function (event) {
  if (!event.target.classList.contains("delete-btn")) return;

  if (!confirm("Delete this drama?")) return;

  const id = event.target.dataset.id;
  const { error } = await db.from("dramas").delete().eq("id", id);

  if (error) {
    alert("Could not delete: " + error.message);
    return;
  }

  await loadDramas();
});

document.addEventListener("change", async function (event) {
  if (!event.target.classList.contains("status-select")) return;

  const id = event.target.dataset.id;
  const newStatus = event.target.value;

  const { error } = await db.from("dramas").update({ status: newStatus }).eq("id", id);

  if (error) {
    alert("Could not update: " + error.message);
    return;
  }

  await loadDramas();
});

function showDetail(drama) {
  let castHTML = "";

  if (drama.cast_list) {
    castHTML = "<h3>Cast</h3><ul>" +
      drama.cast_list
        .split("\n")
        .map(function (line) {
          return "<li>" + line + "</li>";
        })
        .join("") +
      "</ul>";
  }

  let posterTag = `<div class="detail-poster poster-empty">${drama.title.charAt(0).toUpperCase()}</div>`;
  
  if (drama.poster){
    posterTag = `<img class="detail-poster" src="${drama.poster}" alt="${drama.title}">`;
  }
  
  document.querySelector("#detail-content").innerHTML = `
    ${posterTag}
    <h2>${drama.title} (${drama.year})</h2>
    <p class="stars">${"★".repeat(drama.rating)}</p>
    <p>${drama.country} · ${drama.genres} · ${drama.episodes} episodes</p>
    <p>Status: ${drama.status}</p>
    ${castHTML}
    <h3>My review</h3>
    <p>${drama.review}</p>
  `;

  showPage("detail");
}

document.addEventListener("click", function (event) {
  if (!event.target.classList.contains("poster")) return;

  const id = event.target.dataset.id;
  const drama = dramas.find(function (d) {
    return String(d.id) === id;
  });

  if (drama) showDetail(drama);
});

document.querySelector("#back-btn").addEventListener("click", function () {
  showPage(currentPage);
});

document.addEventListener("error", function (event) {
  const img = event.target;

  if (img.tagName !== "IMG") return;
  
  const isDetail = img.classList.contains("detail-poster");
  const isCard = img.classList.contains("poster");
  
  if (!isDetail && !isCard) return;

  const box = document.createElement("div");
  box.className = (isDetail ? "detail-poster" : "poster") + " poster-empty";
  if (img.dataset.id) box.dataset.id = img.dataset.id;
  box.textContent = img.alt.charAt(0).toUpperCase();
  img.replaceWith(box);
}, true);
 
const TMDB_KEY = "5e2055f9c8a8129c7ea1e3c8f0143e63";
let tmdbResults = [];

document.querySelector("#tmdb-btn").addEventListener("click", async function () {
  const query = document.querySelector("#tmdb-search").value.trim();
  if (query === "") return;

  const box = document.querySelector("#tmdb-results");
  box.innerHTML = "Searching...";

  const response = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await response.json();

  tmdbResults = data.results.filter(function (r) {
    return r.media_type === "movie" || r.media_type === "tv";
  });

  box.innerHTML = tmdbResults.map(function (r, i) {
    const title = r.title || r.name;
    const date = r.release_date || r.first_air_date || "";
    return `<div class="tmdb-item" data-index="${i}">${title} (${date.slice(0, 4)})</div>`;
  }).join("");
});   

const genreMap = { 10749: "Romance", 35: "Comedy", 53: "Thriller", 28: "Action", 10759: "Action" };
const languageMap = { ko: "Korean", ja: "Japanese", zh: "Chinese", th: "Thai", tl: "Filipino", en: "English" };

document.querySelector("#tmdb-results").addEventListener("click", async function (event) {
  const item = event.target.closest(".tmdb-item");
  if (!item) return;

  const r = tmdbResults[item.dataset.index];

  let genre = "";
  for (const id of r.genre_ids) {
    if (genreMap[id]) {
      genre = genreMap[id];
      break;
    }
  }

  let episodes = 1;
  if (r.media_type === "tv") {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${r.id}?api_key=${TMDB_KEY}`);
    const details = await res.json();
    episodes = details.number_of_episodes;
  }

  const date = r.release_date || r.first_air_date || "";

  document.querySelector("#f-title").value = r.title || r.name;
  document.querySelector("#f-year").value = date.slice(0, 4);
  document.querySelector("#f-episodes").value = episodes;
  document.querySelector("#f-genres").value = genre;
  document.querySelector("#f-country").value = languageMap[r.original_language] || "";
  document.querySelector("#f-poster").value = r.poster_path
    ? "https://image.tmdb.org/t/p/w500" + r.poster_path
    : "";

  document.querySelector("#tmdb-results").innerHTML = "";
});

let editingId = null;

document.addEventListener("click", function(event) {
  const btn = event.target.closest(".edit-btn");
  if (!btn) return;
  
  const drama = dramas.find(function (d) {
    return String(d.id) === btn.dataset.id;
  });
  
  editingId = drama.id;
  
  document.querySelector("#f-title").value = drama.title;
  document.querySelector("#f-poster").value = drama.poster || "";
  document.querySelector("#f-year").value = drama.year;
  document.querySelector("#f-episodes").value = drama.episodes;
  document.querySelector("#f-genres").value = drama.genres;
  document.querySelector("#f-country").value = drama.country;
  document.querySelector("#f-status").value = drama.status;
  document.querySelector("#f-rating").value = drama.rating;
  document.querySelector("#f-cast").value = drama.cast_list || "";
  document.querySelector("#f-review").value = drama.review || "";
  
  showPage("add");
});

loadDramas();
checkSession();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
    }
